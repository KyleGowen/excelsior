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
      'try{const {ServiceAccessService}=require(path.join(process.env.MOCK_SOURCE,"src/api/access/serviceAccessService"));const {NativeDatabaseAccess}=require(path.join(process.env.MOCK_SOURCE,"src/api/access/nativeDatabaseAccess"));const {readApplicationClientCredentials}=require(path.join(process.env.MOCK_SOURCE,"src/api/access/applicationClientCredentials"));new NativeDatabaseAccess(new ServiceAccessService(),()=>readApplicationClientCredentials("excelsior-web")).authenticate();if(process.env.ENABLE_NATIVE_DECKBUILDER_SERVICE==="1"){const {NativeDeckbuilderAccess}=require(path.join(process.env.MOCK_SOURCE,"src/api/access/nativeDeckbuilderAccess"));new NativeDeckbuilderAccess(new ServiceAccessService(),()=>readApplicationClientCredentials("excelsior-web")).authenticate("decks:read");}}catch{console.error("Production database service configuration is invalid");process.exit(1);}',
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
  it('loads an optional Featured account UUID and rejects malformed values', () => {
    const userId = 'a2d00000-0000-4000-8000-000000000001';
    put('app/featured_decks_user_id', 'malformed');
    expect(run).toThrow();
    expect(existsSync(join(appDirectory, '.env'))).toBe(false);
    put('app/featured_decks_user_id', userId);
    run();
    expect(readFileSync(join(appDirectory, '.env'), 'utf8')).toContain('FEATURED_DECKS_USER_ID=' + userId);
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
  it('gates builder activation and validates the narrow three-client registry before migration', () => {
    put('app/database_service_enabled','1'); put('app/deckbuilder_service_enabled','1');
    put('app/database_service_config',{environment:'production',signingSecret:'fictional-service-signing-key'.repeat(3),tokenTtlSeconds:60,clients:[
      {id:'excelsior-web',secret:nativeSecret,scopes:['catalog:read','decks:read','decks:write','guest:decks']},
      {id:'bmg-database-ui',secret:bmgSecret,scopes:['catalog:read']},
      {id:'bmg-deckbuilder',secret:'fictional-production-builder-secret',scopes:['catalog:read','decks:read']},
    ].map(({id,secret,scopes}) => ({id,enabled:true,tokenEpoch:0,requestsPerMinute:600,scopes,credentials:[{version:'v1',secretSha256:createHash('sha256').update(secret).digest('hex')}]}))});
    const output=run(); expect(readFileSync(join(appDirectory,'.env'),'utf8')).toContain('ENABLE_NATIVE_DECKBUILDER_SERVICE=1');
    expect(output.indexOf('Validating native builder identity')).toBeLessThan(output.indexOf('Flyway migrate'));expect(output).not.toContain('fictional-production-builder-secret');
  });
  it.each(['1','true'])('rejects builder activation %s without matching catalog activation and registry', setting => {
    put('app/deckbuilder_service_enabled',setting);expect(run).toThrow();expect(existsSync(join(appDirectory,'.env'))).toBe(false);
  });

  const configureAccounts = () => {
    put('app/database_service_enabled', '1'); put('app/account_service_enabled', '1');
    const registry = JSON.parse(readFileSync(join(parameters, 'app_database_service_config'), 'utf8'));
    registry.clients.push({ id: 'bmg-shared-account-ui', enabled: true, tokenEpoch: 0, requestsPerMinute: 600,
      scopes: ['account:self', 'decks:read', 'decks:write'], credentials: [{ version: 'v1', secretSha256: createHash('sha256').update('fictional-dedicated-account-secret').digest('hex') }] });
    put('app/database_service_config', registry);
  };
  it('enables the dedicated account gateway while retaining the native and catalog identities', () => {
    configureAccounts(); const output = run(); const env = readFileSync(join(appDirectory, '.env'), 'utf8');
    expect(env).toContain('ENABLE_ACCOUNT_SERVICE_GATEWAY=1'); expect(env).not.toContain('ENABLE_ACCOUNT_DECK_GATEWAY=1');
    expect(JSON.parse(readFileSync(join(appDirectory, 'service-access/registry.json'), 'utf8')).clients).toHaveLength(3);
    expect(output).not.toContain('fictional-dedicated-account-secret');
  });
  it.each(['account_service_enabled', 'account_decks_enabled'])('rejects unsupported %s before runtime writes', key => {
    put('app/' + key, 'true'); expect(run).toThrow(); expect(existsSync(join(appDirectory, '.env'))).toBe(false);
  });
  it('requires an enabled exact-scope account client', () => {
    configureAccounts(); const registry = JSON.parse(readFileSync(join(parameters, 'app_database_service_config'), 'utf8'));
    registry.clients[2].scopes.push('guest:decks'); put('app/database_service_config', registry);
    expect(run).toThrow(); expect(existsSync(join(appDirectory, '.env'))).toBe(false);
  });
  it('rejects an extra account client while account access is disabled', () => {
    configureAccounts(); put('app/account_service_enabled', '0'); expect(run).toThrow();
  });
  it('requires builder activation for account decks', () => {
    configureAccounts(); put('app/account_decks_enabled', '1'); expect(run).toThrow();
    expect(existsSync(join(appDirectory, '.env'))).toBe(false);
  });
  it('enables account decks with prerequisite gates and preserves every catalog scope', () => {
    configureAccounts(); put('app/account_decks_enabled', '1'); put('app/deckbuilder_service_enabled', '1');
    const registry = JSON.parse(readFileSync(join(parameters, 'app_database_service_config'), 'utf8'));
    registry.clients[0].scopes = ['catalog:read', 'decks:read', 'decks:write', 'guest:decks'];
    registry.clients.push({ id: 'bmg-deckbuilder', enabled: true, tokenEpoch: 0, requestsPerMinute: 600,
      scopes: ['catalog:read', 'decks:read'], credentials: [{ version: 'v1', secretSha256: createHash('sha256').update('fictional-production-builder-secret').digest('hex') }] });
    put('app/database_service_config', registry); run();
    expect(readFileSync(join(appDirectory, '.env'), 'utf8')).toContain('ENABLE_ACCOUNT_DECK_GATEWAY=1');
    expect(JSON.parse(readFileSync(join(appDirectory, 'service-access/registry.json'), 'utf8')).clients).toEqual(registry.clients);
  });

});
