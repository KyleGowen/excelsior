#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeReceipt } from '../../../../scripts/verification-receipt.mjs';

let context;
function finish(status, code, reason = null) {
  if (context) {
    const { options, started, polls, unchanged, run } = context;
    const receipt = { kind: 'actions', environment: options.replay ? 'recorded-replay' : 'github',
      status, exitCode: code, reason, intendedRevision: options.sha, deployedRevision: null,
      runId: options.runId, run, pollCount: polls, unchangedStates: unchanged,
      durationSeconds: (Date.now() - started) / 1000, finishedAt: new Date().toISOString(),
      cleanup: 'no GitHub mutations', gaps: ['Required job/test execution and deployment health need main-agent review'] };
    writeReceipt(options.report, receipt);
    process.stdout.write(`${JSON.stringify({ status, exitCode: code, pollCount: polls, receipt: options.report })}\n`);
  }
  process.exit(code);
}

function fail(message, code = 2) {
  process.stderr.write(`ship-watch-actions: ${message}\n`);
  finish('blocked', code, message);
}

function parseArgs(argv) {
  let runId = '';
  let sha = '';
  let pollSeconds = 60;
  const options = { requestSeconds: 30, stallSeconds: 1200, deadlineSeconds: 7200, terminalOnly: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--run-id') runId = argv[++index] ?? fail('--run-id requires a value');
    else if (arg === '--sha') sha = argv[++index] ?? fail('--sha requires a value');
    else if (arg === '--poll-seconds') pollSeconds = Number(argv[++index]);
    else if (arg === '--report') options.report = argv[++index] ?? fail('--report requires a path');
    else if (arg === '--replay') options.replay = argv[++index] ?? fail('--replay requires a file');
    else if (arg === '--request-timeout-seconds') options.requestSeconds = Number(argv[++index]);
    else if (arg === '--stall-seconds') options.stallSeconds = Number(argv[++index]);
    else if (arg === '--deadline-seconds') options.deadlineSeconds = Number(argv[++index]);
    else if (arg === '--terminal-only') options.terminalOnly = true;
    else fail(`unknown argument: ${arg}`);
  }

  if (!/^\d+$/.test(runId)) fail('--run-id must be numeric');
  if (!/^[0-9a-f]{40}$/i.test(sha)) fail('--sha must be a full 40-character commit SHA');
  if (!Number.isFinite(pollSeconds) || pollSeconds < (options.replay ? 0 : 60)) fail('--poll-seconds must be at least 60 for live GitHub');
  for (const key of ['requestSeconds', 'stallSeconds', 'deadlineSeconds']) {
    if (!Number.isFinite(options[key]) || options[key] <= 0) fail(`Invalid ${key}`);
  }
  if (options.replay && process.env.SHIP_GH_BIN) fail('Replay must not use a GitHub executable override');
  options.report ??= join(mkdtempSync(join(tmpdir(), 'excelsior-actions-')), 'receipt.json');
  return { ...options, runId, sha: sha.toLowerCase(), pollMilliseconds: pollSeconds * 1000 };
}

function queryRun(runId) {
  const gh = process.env.SHIP_GH_BIN || 'gh';
  const result = spawnSync(
    gh,
    ['run', 'view', runId, '--json', 'status,conclusion,jobs,url,headSha'],
    { encoding: 'utf8', timeout: context.options.requestSeconds * 1000, killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024 },
  );

  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    const rawError = `${result.stderr ?? ''}${result.stdout ?? ''}`.trim();
    fail(rawError || `gh exited ${result.status}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`invalid gh JSON: ${error.message}`);
  }
}

function summarize(run) {
  const jobs = (run.jobs ?? []).map(job => ({
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
  }));
  const attentionJobs = jobs.filter(job =>
    job.status !== 'completed' ||
      (job.conclusion && !['success', 'skipped'].includes(job.conclusion)),
  );

  return {
    status: run.status,
    conclusion: run.conclusion,
    url: run.url,
    headSha: run.headSha,
    jobCounts: {
      total: jobs.length,
      completed: jobs.filter(job => job.status === 'completed').length,
      successful: jobs.filter(job => job.conclusion === 'success').length,
      attention: attentionJobs.length,
    },
    attentionJobs,
  };
}

const options = parseArgs(process.argv.slice(2));
const { runId, sha, pollMilliseconds } = options;
const replay = options.replay ? JSON.parse(readFileSync(options.replay, 'utf8')) : null;
if (replay && (!Array.isArray(replay) || !replay.length)) fail('Replay must contain a nonempty run-state array');
context = { options, started: Date.now(), polls: 0, unchanged: 0, run: null };
let previousState = '';
let changedAt = Date.now();

while (true) {
  if (Date.now() - context.started >= options.deadlineSeconds * 1000) fail('Monitoring deadline exceeded; inspect exact run', 4);
  if (Date.now() - changedAt >= options.stallSeconds * 1000) fail('Run state stalled; inspect exact run without triggering recovery', 4);
  const raw = replay ? replay[Math.min(context.polls, replay.length - 1)] : queryRun(runId);
  context.polls++;
  if (!raw || !['queued', 'in_progress', 'pending', 'waiting', 'requested', 'completed'].includes(raw.status)) fail('Invalid run status');
  const run = summarize(raw);
  context.run = run;
  if ((run.headSha ?? '').toLowerCase() !== sha) {
    fail(`run headSha ${run.headSha || '<missing>'} does not match ${sha}`, 3);
  }

  const state = JSON.stringify(run);
  if (state !== previousState) {
    if (!options.terminalOnly) process.stdout.write(`${JSON.stringify(run)}\n`);
    previousState = state;
    changedAt = Date.now();
  } else {
    context.unchanged++;
  }

  if (run.status === 'completed') finish(run.conclusion === 'success' ? 'passed' : 'failed', run.conclusion === 'success' ? 0 : 1);
  const remaining = Math.min(options.deadlineSeconds * 1000 - (Date.now() - context.started), options.stallSeconds * 1000 - (Date.now() - changedAt));
  await new Promise(resolve => setTimeout(resolve, Math.max(1, Math.min(pollMilliseconds, remaining))));
}
