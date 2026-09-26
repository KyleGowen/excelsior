#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const jestBinary = process.env.INTEGRATION_SHARD_JEST_BIN
  || path.join(repositoryRoot, 'node_modules', '.bin', 'jest');
const jestConfig = path.join(repositoryRoot, 'tests', 'config', 'jest.integration.config.js');
const postgresImage = process.env.INTEGRATION_SHARD_POSTGRES_IMAGE || 'postgres:15';
const flywayImage = process.env.INTEGRATION_SHARD_FLYWAY_IMAGE || 'flyway/flyway:latest';

function parseArguments(argv) {
  let shards = 2;
  let planOnly = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--plan-only') {
      planOnly = true;
      continue;
    }
    if (argument === '--shards') {
      shards = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (argument.startsWith('--shards=')) {
      shards = Number(argument.slice('--shards='.length));
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!Number.isInteger(shards) || shards < 1 || shards > 8) {
    throw new Error('--shards must be an integer between 1 and 8');
  }

  return { planOnly, shards };
}

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${command} ${args.join(' ')} failed (${result.status})${output ? `:\n${output}` : ''}`);
  }
  return result.stdout.trim();
}

function listTests(shard) {
  const args = ['--config', jestConfig, '--listTests', '--runInBand'];
  if (shard) args.push(`--shard=${shard}`);
  const output = runChecked(jestBinary, args);
  return output ? output.split(/\r?\n/).map(testPath => path.resolve(testPath)) : [];
}

function buildShardPlan(shardCount) {
  const allTests = listTests();
  const expected = new Set(allTests);
  // Compare Jest discovery with files on disk, not just against its own shards.
  const discover = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? discover(filename) : (/\.(test|spec)\.ts$/.test(entry.name) ? [filename] : []);
  });
  const omitted = discover(path.join(repositoryRoot, 'tests/integration')).filter(filename => !expected.has(filename));
  if (omitted.length) throw new Error(`Integration tests omitted by Jest configuration: ${omitted.join(', ')}`);
  const assignments = Array.from({ length: shardCount }, (_, index) => (
    listTests(`${index + 1}/${shardCount}`)
  ));
  const seen = new Map();

  assignments.forEach((tests, shardIndex) => {
    if (tests.length === 0) throw new Error(`Shard ${shardIndex + 1}/${shardCount} has no tests`);
    tests.forEach(testPath => {
      const owners = seen.get(testPath) || [];
      owners.push(shardIndex + 1);
      seen.set(testPath, owners);
    });
  });

  const missing = allTests.filter(testPath => !seen.has(testPath));
  const unexpected = [...seen.keys()].filter(testPath => !expected.has(testPath));
  const duplicated = [...seen.entries()].filter(([, owners]) => owners.length > 1);

  if (missing.length || unexpected.length || duplicated.length || seen.size !== expected.size) {
    throw new Error(JSON.stringify({
      duplicated: duplicated.map(([testPath, owners]) => ({ testPath, shards: owners })),
      missing,
      unexpected,
    }, null, 2));
  }

  return {
    assignments,
    counts: assignments.map(tests => tests.length),
    testCount: allTests.length,
  };
}

function elapsedSeconds(startedAt) {
  return ((Date.now() - startedAt) / 1000).toFixed(1);
}

function tail(filePath, lineCount = 120) {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).slice(-lineCount).join('\n');
}

function waitForHealthyContainer(containerName, timeoutMs = 90_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const status = runChecked('docker', [
      'inspect',
      '--format',
      '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}',
      containerName,
    ]);
    if (status === 'running healthy') return;
    if (status.startsWith('exited') || status.startsWith('dead')) {
      throw new Error(`PostgreSQL container stopped during startup (${status})`);
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1_000);
  }
  throw new Error(`PostgreSQL container was not healthy within ${timeoutMs / 1000} seconds`);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port: 0 }, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(error => {
        if (error) reject(error);
        else if (port) resolve(port);
        else reject(new Error('Unable to allocate a local test port'));
      });
    });
  });
}

function runLogged(command, args, logPath, options = {}) {
  const logStream = fs.createWriteStream(logPath);
  const startedAt = Date.now();

  return new Promise(resolve => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.pipe(logStream, { end: false });
    child.stderr.pipe(logStream, { end: false });
    child.once('error', error => {
      logStream.end();
      resolve({ error, logPath, seconds: elapsedSeconds(startedAt), status: null });
    });
    child.once('close', status => {
      logStream.end();
      resolve({ error: null, logPath, seconds: elapsedSeconds(startedAt), status });
    });
  });
}

function runShard({ databasePort, index, runDirectory, shardCount }) {
  const shardLabel = `${index + 1}/${shardCount}`;
  const logPath = path.join(runDirectory, `shard-${index + 1}.log`);

  return Promise.all([getFreePort(), getFreePort()]).then(([port, testPort]) => runLogged(
    jestBinary,
    [
      '--config', jestConfig,
      `--shard=${shardLabel}`,
      '--runInBand',
      '--json',
      `--outputFile=${path.join(runDirectory, `shard-${index + 1}.json`)}`,
      `--cacheDirectory=${path.join(runDirectory, `jest-cache-${index + 1}`)}`,
    ],
    logPath,
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        DATABASE_URL: `postgresql://postgres:password@127.0.0.1:${databasePort}/overpower`,
        FORCE_COLOR: '0',
        NODE_ENV: 'test',
        PORT: String(port),
        SKIP_MIGRATIONS: 'true',
        TEST_PORT: String(testPort),
        USER_PERSISTENCE_DATA_DIR: path.join(runDirectory, `persistence-${index + 1}`),
      },
    },
  ).then(result => ({ ...result, index })));
}

async function main() {
  const { planOnly, shards } = parseArguments(process.argv.slice(2));
  const overallStartedAt = Date.now();
  const plan = buildShardPlan(shards);
  console.log(`integration-shards: verified exact coverage of ${plan.testCount} test files (${plan.counts.join(' + ')})`);

  if (planOnly) {
    console.log(JSON.stringify({ shards, ...plan, assignments: undefined }));
    return;
  }

  runChecked('docker', ['info', '--format', '{{.ServerVersion}}']);
  const runDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'excelsior-integration-shards-'));
  const runId = `${process.pid}-${Date.now()}`;
  const containerNames = Array.from(
    { length: shards },
    (_, index) => `excelsior-integration-${runId}-${index + 1}`,
  );
  const createdContainers = new Set();

  const cleanup = () => {
    for (const containerName of createdContainers) {
      spawnSync('docker', ['rm', '--force', containerName], { encoding: 'utf8' });
    }
    createdContainers.clear();
    if (process.env.INTEGRATION_SHARD_REPORT_DIR) {
      fs.mkdirSync(process.env.INTEGRATION_SHARD_REPORT_DIR, { recursive: true });
      for (const entry of fs.readdirSync(runDirectory)) {
        if (/\.(log|json)$/.test(entry)) {
          fs.copyFileSync(path.join(runDirectory, entry), path.join(process.env.INTEGRATION_SHARD_REPORT_DIR, entry));
        }
      }
    }
    fs.rmSync(runDirectory, { recursive: true, force: true });
  };

  const terminate = signal => {
    console.error(`integration-shards: received ${signal}; cleaning up`);
    cleanup();
    process.exit(130);
  };
  process.once('SIGINT', () => terminate('SIGINT'));
  process.once('SIGTERM', () => terminate('SIGTERM'));

  try {
    const setupStartedAt = Date.now();
    console.log(`integration-shards: starting ${shards} isolated PostgreSQL container${shards === 1 ? '' : 's'}`);
    for (const containerName of containerNames) {
      runChecked('docker', [
        'run', '--detach',
        '--name', containerName,
        '--label', 'com.excelsior.integration-shards=true',
        '--publish', '127.0.0.1::5432',
        '--env', 'POSTGRES_USER=postgres',
        '--env', 'POSTGRES_PASSWORD=password',
        '--env', 'POSTGRES_DB=overpower',
        '--health-cmd', 'pg_isready -U postgres -d overpower',
        '--health-interval', '1s',
        '--health-timeout', '5s',
        '--health-retries', '90',
        postgresImage,
      ]);
      createdContainers.add(containerName);
    }

    containerNames.forEach(containerName => waitForHealthyContainer(containerName));
    const databasePorts = containerNames.map(containerName => {
      const portOutput = runChecked('docker', ['port', containerName, '5432/tcp']);
      const portMatch = portOutput.match(/:(\d+)\s*$/m);
      if (!portMatch) throw new Error(`Unable to determine PostgreSQL port from: ${portOutput}`);
      return Number(portMatch[1]);
    });

    console.log(`integration-shards: migrating ${shards} isolated database${shards === 1 ? '' : 's'} concurrently`);
    const migrationResults = await Promise.all(databasePorts.map((databasePort, index) => runLogged(
      'docker',
      [
        'run', '--rm',
        '--add-host', 'host.docker.internal:host-gateway',
        '--volume', `${repositoryRoot}:/workspace`,
        '--workdir', '/workspace',
        flywayImage,
        `-url=jdbc:postgresql://host.docker.internal:${databasePort}/overpower`,
        '-user=postgres',
        '-password=password',
        '-schemas=public',
        '-locations=filesystem:/workspace/migrations',
        '-baselineOnMigrate=true',
        '-validateOnMigrate=true',
        '-connectRetries=60',
        'migrate',
      ],
      path.join(runDirectory, `flyway-${index + 1}.log`),
    )));
    migrationResults.forEach((result, index) => {
      if (result.error || result.status !== 0) {
        throw new Error(`Flyway migration ${index + 1}/${shards} failed (${result.status}):\n${tail(result.logPath)}`);
      }
    });

    const setupSeconds = elapsedSeconds(setupStartedAt);
    console.log(`integration-shards: database setup complete in ${setupSeconds}s; running shards concurrently`);

    const testStartedAt = Date.now();
    const heartbeat = setInterval(() => {
      console.log(`integration-shards: tests still running (${elapsedSeconds(testStartedAt)}s elapsed)`);
    }, 30_000);
    heartbeat.unref();

    const results = await Promise.all(Array.from({ length: shards }, (_, index) => (
      runShard({ databasePort: databasePorts[index], index, runDirectory, shardCount: shards })
    )));
    clearInterval(heartbeat);

    let failed = false;
    results.forEach(result => {
      const label = `${result.index + 1}/${shards}`;
      if (result.error || result.status !== 0) {
        failed = true;
        console.error(`integration-shards: shard ${label} failed after ${result.seconds}s${result.error ? `: ${result.error.message}` : ''}`);
        console.error(tail(result.logPath));
      } else {
        const summary = tail(result.logPath, 30).split(/\r?\n/)
          .filter(line => /^(Test Suites:|Tests:|Snapshots:|Time:)/.test(line))
          .join(' | ');
        console.log(`integration-shards: shard ${label} passed in ${result.seconds}s${summary ? ` (${summary})` : ''}`);
      }
    });

    const testSeconds = elapsedSeconds(testStartedAt);
    const totalSeconds = elapsedSeconds(overallStartedAt);
    console.log(`integration-shards: ${failed ? 'FAILED' : 'PASS'} setup=${setupSeconds}s tests=${testSeconds}s total=${totalSeconds}s`);
    if (failed) process.exitCode = 1;
  } finally {
    cleanup();
  }
}

main().catch(error => {
  console.error(`integration-shards: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
