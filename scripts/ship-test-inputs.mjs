// Content, not HEAD/staging state. Unknown files remain inputs by default.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, lstatSync, readlinkSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// These reports/guides are not read by the application test suites. Do not broaden
// this list without inspecting test loaders/fixtures; .md and docs are NOT blanket exclusions.
export function isReportOnly(path) {
  return /^(?:docs\/evidence\/browser-skills-validation\/|docs\/evidence\/skill-hygiene\/)/.test(path)
    || /^\.agents\/skills\/(?:ship|start-excelsior|api-layer-migration|test-local-browser|verify-production-browser)\/(?:SKILL\.md|agents\/openai\.yaml|references\/[^/]+\.md)$/.test(path)
    || ['docs/current/BROWSER_TESTING.md', 'docs/current/TESTING_GUIDE.md', 'docs/current/FRONTEND_PREPARATION.md'].includes(path);
}
export function testInputs(root, mode, environment = process.env) {
  if (!['unit', 'integration'].includes(mode)) throw new Error('Invalid test gate');
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
  const files = new Map(git(['ls-files', '--stage', '-z']).split('\0').filter(Boolean).map(line => {
    const [info, path] = line.split('\t'); const [mode, blob, stage] = info.split(' ');
    if (stage !== '0') throw new Error('Unmerged input');
    return [path, { mode, blob }];
  }));
  const working = new Set([...git(['diff', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean));
  for (const path of working) {
    try {
      const stat = lstatSync(resolve(root, path));
      if (!stat.isFile() && !stat.isSymbolicLink()) throw new Error('Unsupported input type');
      const content = stat.isSymbolicLink() ? Buffer.from(readlinkSync(resolve(root, path))) : readFileSync(resolve(root, path));
      files.set(path, { mode: stat.isSymbolicLink() ? '120000' : stat.mode & 0o111 ? '100755' : '100644', blob: gitHash(root, content) });
    } catch (error) { if (error.code === 'ENOENT') files.delete(path); else throw error; }
  }
  const inputs = [...files].filter(([path]) => !isReportOnly(path)).sort(([a], [b]) => a.localeCompare(b));
  const hash = createHash('sha256');
  hash.update(JSON.stringify({ version: 2, mode, node: process.version, inputs }));
  const absent = [];
  const dotenv = ['', 'frontend'].flatMap(directory => {
    let names;
    try { names = readdirSync(resolve(root, directory)); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    return names.filter(name => name === '.env' || name.startsWith('.env.')).map(name => directory ? `${directory}/${name}` : name);
  });
  for (const path of ['node_modules/.package-lock.json', 'frontend/node_modules/.package-lock.json', ...dotenv]) {
    try { hash.update(path).update(readFileSync(resolve(root, path))); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      hash.update(`${path}:absent`);
      if (path.endsWith('.package-lock.json')) absent.push(path);
    }
  }
  const reporting = new Set(['_', 'SHLVL', 'PWD', 'OLDPWD', 'SHIP_TEST_CACHE_DIR', 'SHIP_TESTS_FORCE', 'SHIP_REPORT_DIR', 'INTEGRATION_REPORT_DIR']);
  const env = Object.entries(environment).filter(([key]) => !reporting.has(key)).sort(([a], [b]) => a.localeCompare(b));
  hash.update(JSON.stringify(env)); // Only the digest is persisted; never environment values.
  const baseFingerprint = hash.copy().digest('hex');
  let docker = null;
  const imageIds = [];
  if (mode === 'integration') {
    const result = spawnSync('docker', ['version', '--format', '{{.Client.Version}}/{{.Server.Version}}'], { encoding: 'utf8', timeout: 5000 });
    docker = result.status === 0 ? result.stdout.trim() : null;
    hash.update(docker ?? 'docker-unavailable');
    for (const image of [environment.INTEGRATION_SHARD_POSTGRES_IMAGE || 'postgres:15', environment.INTEGRATION_SHARD_FLYWAY_IMAGE || 'flyway/flyway:latest']) {
      const result = spawnSync('docker', ['image', 'inspect', image, '--format', '{{.Id}}'], { encoding: 'utf8', timeout: 5000 });
      imageIds.push(result.status === 0 ? result.stdout.trim() : null);
    }
    hash.update(JSON.stringify(imageIds));
  }
  return { fingerprint: hash.digest('hex'), baseFingerprint, mode, inputFiles: inputs.length, node: process.version, docker, imageIds,
    cacheable: absent.length === 0 && (mode !== 'integration' || !!docker && imageIds.every(Boolean)), gaps: [...absent.map(path => `Installed dependency receipt unavailable: ${path}`), ...(mode === 'integration' && (!docker || !imageIds.every(Boolean)) ? ['Docker runtime or fixture image identity unavailable'] : [])] };
}
export function sameTestInputs(before, after) {
  // First use may acquire previously absent fixture images. Do not cache that run;
  // known runtime identities, source, dependencies and environment must stay fixed.
  return before.baseFingerprint === after.baseFingerprint && before.docker === after.docker
    && before.imageIds.every((id, index) => !id || id === after.imageIds[index]);
}
function gitHash(root, input) {
  return execFileSync('git', ['hash-object', '--stdin'], { cwd: root, input, encoding: 'utf8' }).trim();
}
