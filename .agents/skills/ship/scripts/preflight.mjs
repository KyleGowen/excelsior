#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve, relative, sep } from 'node:path';
import { computeShipTreeFingerprint } from '../../../../scripts/ship-tree-fingerprint.mjs';
import { captureCandidate } from '../../../../scripts/ship-candidate.mjs';
import { writeReceipt } from '../../../../scripts/verification-receipt.mjs';

function fail(message) {
  process.stderr.write(`ship-preflight: ${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  let repo = process.cwd();
  let reportDir;
  const intended = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo') {
      repo = argv[++index] ?? fail('--repo requires a value');
    } else if (arg === '--report-dir') {
      reportDir = argv[++index] ?? fail('--report-dir requires a value');
    } else if (arg === '--include') {
      intended.push(argv[++index] ?? fail('--include requires a path'));
    } else {
      fail(`unknown argument: ${arg}`);
    }
  }

  if (intended.length === 0) fail('provide each intended path with --include');
  return { repo, intended, reportDir };
}

function git(root, args, encoding = 'utf8') {
  return execFileSync('git', args, {
    cwd: root,
    encoding,
    maxBuffer: 128 * 1024 * 1024,
  });
}

function normalizePath(root, input) {
  const absolute = resolve(root, input);
  const normalized = relative(root, absolute).split(sep).join('/');
  if (!normalized || normalized === '..' || normalized.startsWith('../')) {
    fail(`path is outside the repository: ${input}`);
  }
  return normalized;
}

function changedPaths(root) {
  const tracked = git(root, ['diff', '--name-only', '-z', 'HEAD'])
    .split('\0')
    .filter(Boolean);
  const untracked = git(root, ['ls-files', '-z', '--others', '--exclude-standard'])
    .split('\0')
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}

function addedDebugLines(root, paths, untrackedSet) {
  const matches = [];
  const debugPattern = /\bconsole\.(?:log|debug)\s*\(/;

  for (const file of paths) {
    if (untrackedSet.has(file)) {
      let contents;
      try {
        contents = readFileSync(resolve(root, file), 'utf8');
      } catch {
        continue;
      }
      contents.split(/\r?\n/).forEach((line, index) => {
        if (debugPattern.test(line)) matches.push({ file, line: index + 1, text: line.trim() });
      });
      continue;
    }

    const diff = git(root, ['diff', '--unified=0', '--no-ext-diff', 'HEAD', '--', file]);
    let newLine = 0;
    for (const line of diff.split(/\r?\n/)) {
      const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
      if (hunk) {
        newLine = Number(hunk[1]);
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        if (debugPattern.test(line.slice(1))) {
          matches.push({ file, line: newLine, text: line.slice(1).trim() });
        }
        newLine += 1;
      } else if (!line.startsWith('-')) {
        newLine += 1;
      }
    }
  }

  return matches;
}

const { repo, intended: intendedArgs, reportDir: requestedReportDir } = parseArgs(process.argv.slice(2));
const root = git(repo, ['rev-parse', '--show-toplevel']).trim();
const intendedPaths = [...new Set(intendedArgs.map(path => normalizePath(root, path)))].sort();
const allChangedPaths = changedPaths(root);
const changedSet = new Set(allChangedPaths);
const intendedSet = new Set(intendedPaths);
const untrackedSet = new Set(
  git(root, ['ls-files', '-z', '--others', '--exclude-standard']).split('\0').filter(Boolean),
);
const unstagedDiffCheck = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8' });
const stagedDiffCheck = spawnSync('git', ['diff', '--cached', '--check'], { cwd: root, encoding: 'utf8' });
const diffCheckOutput = [
  unstagedDiffCheck.stdout,
  unstagedDiffCheck.stderr,
  stagedDiffCheck.stdout,
  stagedDiffCheck.stderr,
].filter(Boolean).join('').trim();

const result = {
  repositoryRoot: root,
  branch: git(root, ['branch', '--show-current']).trim(),
  fingerprint: computeShipTreeFingerprint(root),
  intendedPaths,
  unrelatedPaths: allChangedPaths.filter(path => !intendedSet.has(path)),
  missingIntendedPaths: intendedPaths.filter(path => !changedSet.has(path)),
  diffCheck: {
    ok: unstagedDiffCheck.status === 0 && stagedDiffCheck.status === 0,
    output: diffCheckOutput,
  },
  triggers: {
    unit: true,
    soc2: intendedPaths.some(path =>
      path === 'src/index.ts' || path.startsWith('src/routes/') || path.startsWith('src/api/http/'),
    ),
    dependencyAudit: intendedPaths.some(path => /^(?:frontend\/)?package(?:-lock)?\.json$/.test(path)),
    frontendChanged: intendedPaths.some(path => path.startsWith('frontend/')),
    migrationChanged: intendedPaths.some(path => path.startsWith('migrations/')),
  },
  addedDebugLines: addedDebugLines(root, intendedPaths, untrackedSet),
};

const reportDir = requestedReportDir ?? mkdtempSync(join(tmpdir(), 'excelsior-preflight-'));
if (existsSync(join(reportDir, 'candidate.json'))) fail('Frozen candidate exists; use a fresh evidence directory');
const candidate = captureCandidate(root, intendedPaths);
const manifest = writeReceipt(join(reportDir, 'candidate.json'), candidate);
const receipt = writeReceipt(join(reportDir, 'preflight.json'), { kind: 'preflight', ...result, candidateId: candidate.candidateId, manifest });
process.stdout.write(`${JSON.stringify({ status: result.diffCheck.ok && !result.missingIntendedPaths.length ? 'ready' : 'blocked',
  branch: result.branch, intendedCount: intendedPaths.length, unrelatedCount: result.unrelatedPaths.length,
  fingerprint: result.fingerprint, candidateId: candidate.candidateId, triggers: result.triggers,
  missingIntendedPaths: result.missingIntendedPaths, debugLineCount: result.addedDebugLines.length, receipt, manifest })}\n`);
if (!result.diffCheck.ok || result.missingIntendedPaths.length > 0) process.exitCode = 1;
