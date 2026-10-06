import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutModeProvider } from '../lib/layout/LayoutModeProvider';
import { LocalModuleHarness, ModuleHarness } from './ModuleHarness';
import { harnessAccess } from './harnessAccess';
import '../styles/appStyles';
const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
const root = createRoot(document.getElementById('module-harness-root')!);
const access = harnessAccess(window.location.search);
root.render(import.meta.env.DEV ? <QueryClientProvider client={client}><LayoutModeProvider><LocalModuleHarness loadSession={access.loadSession} renderHost={user => <ModuleHarness user={user} api={access.api} requestEvidence={access.evidence} />} /></LayoutModeProvider></QueryClientProvider> : <p>The fixture harness is development-only.</p>);

if (import.meta.hot) import.meta.hot.dispose(() => { root.unmount(); client.clear(); });
