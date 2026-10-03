#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { resolve, relative, sep } from 'node:path';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyCandidateCommit } from '../../../../scripts/ship-candidate.mjs';
import { writeReceipt } from '../../../../scripts/verification-receipt.mjs';

function fail(message) {
  process.stderr.write(`ship-verify-commit: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  let repo = process.cwd();
  let sha = '';
  let manifest = '';
  const intended = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo') repo = argv[++index] ?? fail('--repo requires a value');
    else if (arg === '--sha') sha = argv[++index] ?? fail('--sha requires a value');
    else if (arg === '--manifest') manifest = argv[++index] ?? fail('--manifest requires a path');
    else if (arg === '--include') intended.push(argv[++index] ?? fail('--include requires a path'));
    else fail(`unknown argument: ${arg}`);
  }

  if (!/^[0-9a-f]{40}$/i.test(sha)) fail('--sha must be a full 40-character commit SHA');
  if (!manifest) fail('--manifest from preflight is required; path-only verification is insufficient');
  return { repo, sha: sha.toLowerCase(), intended, manifest };
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

const { repo, sha, intended, manifest } = parseArgs(process.argv.slice(2));
const root = git(repo, ['rev-parse', '--show-toplevel']);
const candidate = JSON.parse(readFileSync(manifest, 'utf8'));
const normalizePath = input => relative(root, resolve(root, input)).split(sep).join('/');
const expectedPaths = [...new Set((intended.length ? intended : candidate.entries.map(entry => entry.path)).map(normalizePath))].sort();
if (JSON.stringify(expectedPaths) !== JSON.stringify(candidate.entries.map(entry => entry.path))) fail('Include paths differ from frozen manifest');
if (expectedPaths.some(path => !path || path === '..' || path.startsWith('../'))) {
  fail('an intended path is outside the repository');
}

const head = git(root, ['rev-parse', 'HEAD']).toLowerCase();
const committedPaths = git(root, ['diff-tree', '--no-commit-id', '--name-only', '-r', sha])
  .split('\n')
  .filter(Boolean)
  .sort();

const result = { sha, head, expectedPaths, committedPaths, candidateId: candidate.candidateId };

if (head !== sha) fail(`HEAD ${head} does not match returned SHA ${sha}`);
if (JSON.stringify(committedPaths) !== JSON.stringify(expectedPaths)) {
  fail('commit path set does not match the frozen manifest');
}
try { verifyCandidateCommit(root, sha, candidate); } catch (error) { fail(error.message); }
const receipt = writeReceipt(join(mkdtempSync(join(tmpdir(), 'excelsior-commit-')), 'receipt.json'), { kind: 'commit', status: 'passed', ...result, manifest });
process.stdout.write(`${JSON.stringify({ status: 'passed', sha, candidateId: candidate.candidateId, pathCount: committedPaths.length, receipt })}\n`);
