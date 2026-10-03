import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repositoryRoot = path.resolve(__dirname, '../..');
const preflightScript = path.join(repositoryRoot, '.agents/skills/ship/scripts/preflight.mjs');
const verifyCommitScript = path.join(repositoryRoot, '.agents/skills/ship/scripts/verify-commit.mjs');
const watchActionsScript = path.join(repositoryRoot, '.agents/skills/ship/scripts/watch-actions.mjs');
const integrationShardScript = path.join(repositoryRoot, 'scripts/run-integration-shards.mjs');

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function createRepository(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'excelsior-ship-test-'));
  fs.mkdirSync(path.join(directory, 'src'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'src/index.ts'), 'export const value = 1;\n');
  git(directory, ['init', '-q']);
  git(directory, ['config', 'user.name', 'Ship Test']);
  git(directory, ['config', 'user.email', 'ship-test@example.com']);
  git(directory, ['add', 'src/index.ts']);
  git(directory, ['commit', '-qm', 'Initial']);
  return directory;
}

describe('ship workflow scripts', () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('reports frozen scope, gate triggers, unrelated files, and added debug output', () => {
    const directory = createRepository();
    temporaryDirectories.push(directory);
    fs.writeFileSync(path.join(directory, 'src/index.ts'), 'console.log("temporary");\n');
    fs.writeFileSync(path.join(directory, 'notes.txt'), 'unrelated\n');

    const output = execFileSync(
      process.execPath,
      [preflightScript, '--repo', directory, '--include', 'src/index.ts'],
      { encoding: 'utf8' },
    );
    const result = JSON.parse(fs.readFileSync(JSON.parse(output).receipt, 'utf8'));

    expect(['main', 'master']).toContain(result.branch);
    expect(result.intendedPaths).toEqual(['src/index.ts']);
    expect(result.unrelatedPaths).toEqual(['notes.txt']);
    expect(result.missingIntendedPaths).toEqual([]);
    expect(result.diffCheck.ok).toBe(true);
    expect(result.triggers.soc2).toBe(true);
    expect(result.addedDebugLines).toEqual([
      { file: 'src/index.ts', line: 1, text: 'console.log("temporary");' },
    ]);
    expect(result.fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('verifies that HEAD contains exactly the frozen manifest', () => {
    const directory = createRepository();
    temporaryDirectories.push(directory);
    fs.writeFileSync(path.join(directory, 'src/index.ts'), 'export const value = 2;\n');
    const frozen = JSON.parse(execFileSync(process.execPath, [preflightScript, '--repo', directory, '--include', 'src/index.ts'], { encoding: 'utf8' }));
    git(directory, ['add', 'src/index.ts']);
    git(directory, ['commit', '-qm', 'Update']);
    const sha = git(directory, ['rev-parse', 'HEAD']);

    const output = execFileSync(
      process.execPath,
      [verifyCommitScript, '--repo', directory, '--sha', sha, '--manifest', frozen.manifest],
      { encoding: 'utf8' },
    );
    const result = JSON.parse(fs.readFileSync(JSON.parse(output).receipt, 'utf8'));

    expect(result.head).toBe(sha);
    expect(result.committedPaths).toEqual(['src/index.ts']);
  });

  it('watches one exact Actions run and emits only changed states', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'excelsior-actions-test-'));
    temporaryDirectories.push(directory);
    const sha = 'a'.repeat(40);

    const replayFile = path.join(directory, 'replay.json');
    fs.writeFileSync(replayFile, JSON.stringify(['in_progress', 'in_progress', 'completed'].map(status => ({ status, conclusion: status === 'completed' ? 'success' : '', headSha: sha, jobs: [] }))));
    const output = execFileSync(
      process.execPath,
      [watchActionsScript, '--run-id', '123', '--sha', sha, '--replay', replayFile, '--poll-seconds', '0'],
      {
        encoding: 'utf8',
        env: process.env,
      },
    );
    const states = output.trim().split('\n').map(line => JSON.parse(line)).filter(state => state.headSha);

    expect(states).toHaveLength(2);
    expect(states[0].status).toBe('in_progress');
    expect(states[1]).toMatchObject({ status: 'completed', conclusion: 'success', headSha: sha });
  });

  it('rejects an Actions run whose head SHA differs from the shipped SHA', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'excelsior-actions-test-'));
    temporaryDirectories.push(directory);
    const mockGh = path.join(directory, 'mock-gh.mjs');
    fs.writeFileSync(
      mockGh,
      `#!/usr/bin/env node
process.stdout.write(JSON.stringify({ status: 'completed', conclusion: 'success', headSha: '${'b'.repeat(40)}', jobs: [] }));
`,
      { mode: 0o755 },
    );

    const result = spawnSync(
      process.execPath,
      [watchActionsScript, '--run-id', '123', '--sha', 'a'.repeat(40)],
      { encoding: 'utf8', env: { ...process.env, SHIP_GH_BIN: mockGh } },
    );

    expect(result.status).toBe(3);
    expect(result.stderr).toContain('does not match');
  });

  it('returns the first GitHub error without retrying', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'excelsior-actions-test-'));
    temporaryDirectories.push(directory);
    const invocationFile = path.join(directory, 'invocations');
    const mockGh = path.join(directory, 'mock-gh.mjs');
    fs.writeFileSync(
      mockGh,
      `#!/usr/bin/env node
import fs from 'node:fs';
fs.appendFileSync(process.env.MOCK_GH_INVOCATIONS, 'called\\n');
process.stderr.write('error connecting to api.github.com\\n');
process.exit(1);
`,
      { mode: 0o755 },
    );

    const result = spawnSync(
      process.execPath,
      [watchActionsScript, '--run-id', '123', '--sha', 'a'.repeat(40)],
      {
        encoding: 'utf8',
        env: { ...process.env, SHIP_GH_BIN: mockGh, MOCK_GH_INVOCATIONS: invocationFile },
      },
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('error connecting to api.github.com');
    expect(fs.readFileSync(invocationFile, 'utf8').trim().split('\n')).toHaveLength(1);
  });
});

describe('UserPersistenceService test isolation', () => {
  it('writes test sessions outside the repository data directory', () => {
    const previousDirectory = process.env.USER_PERSISTENCE_DATA_DIR;
    delete process.env.USER_PERSISTENCE_DATA_DIR;
    const repositorySessionsPath = path.join(repositoryRoot, 'data/sessions.json');
    const sessionsBefore = fs.readFileSync(repositorySessionsPath, 'utf8');
    const temporaryDirectorySpy = jest.spyOn(fs, 'mkdtempSync');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      const { UserPersistenceService } = jest.requireActual('../../src/persistence/userPersistence');
      const service = new UserPersistenceService();
      service.createSession({ id: 'test-id', name: 'test-user', email: '', role: 'USER' });

      const temporaryDirectory = temporaryDirectorySpy.mock.results[0]?.value as string;
      expect(temporaryDirectory).toContain(path.join(os.tmpdir(), 'excelsior-test-persistence-'));
      expect(fs.existsSync(path.join(temporaryDirectory, 'users.json'))).toBe(true);
      expect(fs.existsSync(path.join(temporaryDirectory, 'sessions.json'))).toBe(true);
      expect(fs.readFileSync(repositorySessionsPath, 'utf8')).toBe(sessionsBefore);
    } finally {
      temporaryDirectorySpy.mockRestore();
      consoleSpy.mockRestore();
      if (previousDirectory === undefined) delete process.env.USER_PERSISTENCE_DATA_DIR;
      else process.env.USER_PERSISTENCE_DATA_DIR = previousDirectory;
    }
  });
});

describe('integration shard runner', () => {
  const shardRunnerTemporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of shardRunnerTemporaryDirectories.splice(0)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('assigns every integration test file to exactly one balanced shard', () => {
    const output = execFileSync(
      process.execPath,
      [integrationShardScript, '--shards=2', '--plan-only'],
      { cwd: repositoryRoot, encoding: 'utf8' },
    );
    const result = JSON.parse(output.trim().split('\n').at(-1) as string);

    expect(result.shards).toBe(2);
    expect(result.testCount).toBeGreaterThan(0);
    expect(result.counts).toHaveLength(2);
    expect(result.counts.reduce((total: number, count: number) => total + count, 0)).toBe(result.testCount);
    expect(Math.abs(result.counts[0] - result.counts[1])).toBeLessThanOrEqual(1);
  });

  it('routes the Ship integration gate through the guarded sharded runner', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'excelsior-conditional-test-'));
    shardRunnerTemporaryDirectories.push(directory);
    const isolatedRepository = createRepository();
    shardRunnerTemporaryDirectories.push(isolatedRepository);
    const binaryDirectory = path.join(directory, 'bin');
    const invocationFile = path.join(directory, 'npm-arguments');
    fs.mkdirSync(binaryDirectory);
    fs.writeFileSync(
      path.join(binaryDirectory, 'npm'),
      '#!/usr/bin/env bash\nprintf \'%s\\n\' "$*" > "$MOCK_NPM_ARGS"\nprintf \'Test Suites: 1 passed, 1 total\\nTests: 1 passed, 1 total\\n{"status":"passed","cleanup":"completed"}\\n\'\n',
      { mode: 0o755 },
    );

    execFileSync(process.execPath, ['--input-type=module', '-e', `import {runTestGate} from ${JSON.stringify(path.join(repositoryRoot, 'scripts/ship-test-gate.mjs'))}; process.exitCode = await runTestGate(${JSON.stringify(isolatedRepository)}, 'integration');`], {
      cwd: isolatedRepository,
      encoding: 'utf8',
      env: {
        ...process.env,
        MOCK_NPM_ARGS: invocationFile,
        PATH: `${binaryDirectory}:${process.env.PATH}`,
        SHIP_TEST_CACHE_DIR: path.join(directory, 'cache'),
        SHIP_TESTS_FORCE: '1',
      },
    });

    expect(fs.readFileSync(invocationFile, 'utf8').trim()).toBe('run test:integration:sharded');
  });

  it('rejects an unsafe shard count before starting Docker', () => {
    const result = spawnSync(
      process.execPath,
      [integrationShardScript, '--shards=0', '--plan-only'],
      { cwd: repositoryRoot, encoding: 'utf8' },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--shards must be an integer between 1 and 8');
  });
});
