import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

describe('production database service preparation with isolated fake providers', () => {
  let directory: string; let appDirectory: string; let bin: string; let parameters: string;
  const root = resolve(__dirname, '../..');
  const nativeSecret = 'fictional-production-preparation-native-secret';
  const bmgSecret = 'fictional-production-preparation-bmg-secret';
  const put = (name: string, value: unknown) => writeFileSync(join(parameters, name.replace(/\//g, '_')), typeof value === 'string' ? value : JSON.stringify(value));
  const script = (name: string, value: string) => writeFileSync(join(bin, name), value, { mode: 0o700 });
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'database-service-deployment-')); appDirectory = join(directory, 'app');
    bin = join(directory, 'bin'); parameters = join(directory, 'parameters'); mkdirSync(bin); mkdirSync(parameters);
    for (const [name, value] of Object.entries({ 'database/host': 'local.test', 'database/port': '5432', 'database/name': 'test', 'database/username': 'fictional-user', 'database/password': 'fictional-password', 'app/cdn_base_url': 'https://assets.example.test', 'app/jwt_secret': 'fictional-player-signing-key', 'firebase/app_id': 'fictional-app' })) put(name, value);
    put('app/database_service_config', { environment: 'production', signingSecret: 'fictional-service-signing-key'.repeat(3), tokenTtlSeconds: 60,
      clients: [['excelsior-web', nativeSecret], ['bmg-database-ui', bmgSecret]].map(([id, secret]) => ({ id, enabled: true, tokenEpoch: 0, requestsPerMinute: 600, scopes: ['catalog:read'], credentials: [{ version: 'v1', secretSha256: createHash('sha256').update(secret!).digest('hex') }] })) });
    put('app/native_database_credentials', { environment: 'production', clients: [{ clientId: 'excelsior-web', clientSecret: nativeSecret }] });
    script('aws', '#!/usr/bin/env node\n' + [
      'const fs=require("fs"),path=require("path"),args=process.argv.slice(2);',
      'if(args[0]==="ecr"){process.stdout.write("fictional-registry-login");process.exit(0);}',
      'const key=args[args.indexOf("--name")+1].replace("/op-deckbuilder/dev/","");',
      'fs.appendFileSync(process.env.MOCK_CALLS,key+"\\n");',
      'const file=path.join(process.env.MOCK_PARAMETERS,key.replaceAll("/","_"));',
      'if(!fs.existsSync(file))process.exit(1);process.stdout.write(fs.readFileSync(file,"utf8"));',
    ].join('\n'));
    script('timeout', '#!/bin/sh\nshift\nexec "$@"\n');
    script('docker', '#!/usr/bin/env node\n' + [
      'const fs=require("fs"),path=require("path"),args=process.argv.slice(2);',
      'fs.appendFileSync(process.env.MOCK_CALLS,"docker "+args[0]+"\\n");',
      'if(args[0]==="login"){process.stdin.resume();process.stdin.on("end",()=>process.exit(0));}',
      'else if(args.includes("--entrypoint")&&args[args.indexOf("--entrypoint")+1]==="node"){',
      'for(const line of fs.readFileSync(args[args.indexOf("--env-file")+1],"utf8").split("\\n")){const p=line.indexOf("=");if(p>0)process.env[line.slice(0,p)]=line.slice(p+1).replace("/app/runtime/service-access",process.env.MOCK_APP+"/service-access");}',
      'require(path.join(process.env.MOCK_SOURCE,"node_modules/ts-node/register/transpile-only"));',
      'try{const {ServiceAccessService}=require(path.join(process.env.MOCK_SOURCE,"src/api/access/serviceAccessService"));const {NativeDatabaseAccess}=require(path.join(process.env.MOCK_SOURCE,"src/api/access/nativeDatabaseAccess"));const {readApplicationClientCredentials}=require(path.join(process.env.MOCK_SOURCE,"src/api/access/applicationClientCredentials"));new NativeDatabaseAccess(new ServiceAccessService(),()=>readApplicationClientCredentials("excelsior-web")).authenticate();}catch{console.error("Production database service configuration is invalid");process.exit(1);}',
      '}else if(args.includes("sh")){process.stdout.write("368\\n");}',
    ].join('\n'));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  const run = () => execFileSync('bash', [join(root, '.github/scripts/prepare-production.sh')], { cwd: root, encoding: 'utf8', env: {
    ...process.env, PATH: bin + ':' + process.env.PATH, EXCELSIOR_APP_DIRECTORY: appDirectory, MOCK_PARAMETERS: parameters, MOCK_CALLS: join(directory, 'calls.log'),
    MOCK_SOURCE: root, MOCK_APP: appDirectory, ECR_IMAGE: 'example.test/excelsior:fictional', EXPECTED_MIGRATION: '368',
  }, timeout: 10000 });
  it('preserves disabled rollout and creates no credentials when the optional setting is absent', () => {
    const output = run(); const env = readFileSync(join(appDirectory, '.env'), 'utf8');
    expect(env).not.toContain('ENABLE_SERVICE_ACCESS'); expect(existsSync(join(appDirectory, 'service-access/registry.json'))).toBe(false);
    expect(readFileSync(join(directory, 'calls.log'), 'utf8')).not.toContain('app/database_service_config');
    expect(output).not.toContain('fictional-password'); expect(statSync(join(appDirectory, '.env')).mode & 0o777).toBe(0o600);
  });
  it('loads private production configuration and verifies real native identity before migration', () => {
    put('app/database_service_enabled', '1'); const output = run();
    expect(readFileSync(join(appDirectory, '.env'), 'utf8')).toContain('ENABLE_NATIVE_DATABASE_SERVICE=1');
    for (const file of ['registry.json', 'native.json']) expect(statSync(join(appDirectory, 'service-access', file)).mode & 0o777).toBe(0o600);
    expect(readFileSync(join(appDirectory, 'service-access/native.json'), 'utf8')).not.toContain(bmgSecret);
    for (const secret of [nativeSecret, bmgSecret, 'fictional-password']) expect(output).not.toContain(secret);
    expect(output.indexOf('Validating production service identity')).toBeLessThan(output.indexOf('Flyway migrate'));
  });
  it('fails before migration for mismatched native credentials, without exposing them', () => {
    put('app/database_service_enabled', '1'); put('app/native_database_credentials', { environment: 'production', clients: [{ clientId: 'excelsior-web', clientSecret: 'fictional-but-wrong-private-secret' }] });
    try { run(); throw new Error('Unexpected preparation success'); }
    catch (error) {
      const result = error as { stderr?: string; stdout?: string };
      expect(result.stderr).toContain('configuration is invalid'); expect(result.stderr).not.toContain('fictional-but-wrong');
      expect(result.stdout).not.toContain('Running the one authoritative Flyway');
    }
  });
  it('rejects an unsupported activation setting before runtime writes', () => {
    put('app/database_service_enabled', 'true');
    expect(run).toThrow(); expect(existsSync(join(appDirectory, '.env'))).toBe(false);
  });
});
