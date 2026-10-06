import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync, readlinkSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const git = (root, args, options = {}) => execFileSync('git', args, { cwd: root, encoding: 'utf8', ...options });
export function candidateId(candidate) {
  return createHash('sha256').update(JSON.stringify({ baseRevision: candidate.baseRevision, entries: candidate.entries })).digest('hex');
}
export function captureCandidate(root, paths) {
  const entries = [...new Set(paths)].sort().map(input => {
    const path = relative(root, resolve(root, input)).split(sep).join('/');
    if (!path || path === '..' || path.startsWith('../')) throw new Error('Candidate path outside repository');
    let stat;
    try { stat = lstatSync(resolve(root, path)); } catch (error) { if (error.code === 'ENOENT') return { path, mode: null, blob: null }; throw error; }
    if (!stat.isFile() && !stat.isSymbolicLink()) throw new Error('Candidate paths must be individual files');
    const mode = stat.isSymbolicLink() ? '120000' : stat.mode & 0o111 ? '100755' : '100644';
    const content = stat.isSymbolicLink() ? Buffer.from(readlinkSync(resolve(root, path))) : readFileSync(resolve(root, path));
    const blob = git(root, ['hash-object', '--stdin'], { input: content }).trim();
    return { path, mode, blob };
  });
  const result = { schema: 1, baseRevision: git(root, ['rev-parse', 'HEAD']).trim(), entries };
  return { ...result, candidateId: candidateId(result) };
}
export function verifyCandidateCommit(root, sha, candidate) {
  if (!candidate?.entries?.length || candidateId(candidate) !== candidate.candidateId) throw new Error('Invalid frozen candidate manifest');
  const parents = git(root, ['rev-list', '--parents', '-n', '1', sha]).trim().split(' ');
  if (parents.length !== 2 || parents[1] !== candidate.baseRevision) throw new Error('Commit parent differs from frozen candidate base');
  const observed = new Map(git(root, ['--literal-pathspecs', 'ls-tree', '-r', '-z', sha, '--', ...candidate.entries.map(entry => entry.path)]).split('\0').filter(Boolean).map(line => {
    const [header, path] = line.split('\t'); const [mode, , blob] = header.split(' '); return [path, { mode, blob }];
  }));
  const mismatches = candidate.entries.filter(entry => {
    const actual = observed.get(entry.path);
    return entry.blob === null ? !!actual : actual?.blob !== entry.blob || actual?.mode !== entry.mode;
  }).map(entry => entry.path);
  if (mismatches.length) throw new Error(`Committed contents differ from validated candidate: ${mismatches.join(', ')}`);
}
