import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutModeProvider } from '../lib/layout/LayoutModeProvider';
import { LocalModuleHarness } from './ModuleHarness';
import '../styles/appStyles';
const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
const root = createRoot(document.getElementById('module-harness-root')!);
root.render(import.meta.env.DEV ? <QueryClientProvider client={client}><LayoutModeProvider><LocalModuleHarness /></LayoutModeProvider></QueryClientProvider> : <p>The fixture harness is development-only.</p>);

if (import.meta.hot) import.meta.hot.dispose(() => { root.unmount(); client.clear(); });
