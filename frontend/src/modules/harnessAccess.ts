import { createApiClient } from '../lib/api/client';
import { fetchCurrentUser, fetchAppConfig } from '../lib/api/auth';
import { createModuleApi } from './api';
import { createLocalRequestEvidence } from './localRequestEvidence';

/** Public development fixture mounts only. Credentials remain in the local server. */
export function harnessAccess(search: string) {
  const selected = new URLSearchParams(search).get('adapter');
  if (selected !== null && selected !== 'direct' && selected !== 'excelsior' && selected !== 'lrg') {
    throw new Error('Select direct, excelsior or lrg fixture access');
  }
  const evidence = createLocalRequestEvidence();
  const transport = { fetcher: evidence.fetcher, ...(selected && selected !== 'direct' ? { pathPrefix: '/api/host-fixtures/' + selected } : {}) };
  const client = createApiClient(transport);
  const api = createModuleApi(transport);
  const loadSession = async () => {
    const [user] = await Promise.all([fetchCurrentUser(client.request), fetchAppConfig(client.api)]);
    return user;
  };
  return { api, loadSession, evidence };
}

/** A routed fixture retains its adapter across native links and deep reloads. */
export function routedHarnessAccess(base: string, pathname: string) {
  const segment = pathname.startsWith(base + '/') ? pathname.slice(base.length + 1).split('/')[0] : '';
  const adapter = segment === 'excelsior' || segment === 'lrg' ? segment : 'direct';
  return { ...harnessAccess('?adapter=' + adapter), basename: adapter === 'direct' ? base : base + '/' + adapter };
}
