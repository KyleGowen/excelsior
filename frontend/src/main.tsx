import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { LayoutModeProvider } from './lib/layout/LayoutModeProvider';
import { AuthProvider } from './app/AuthProvider';
import { router } from './app/router';
import './styles/appStyles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LayoutModeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </LayoutModeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
