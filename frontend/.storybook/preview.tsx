import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { Preview } from '@storybook/react-vite';
import { themes } from 'storybook/theming';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { LayoutModeProvider, useLayoutMode } from '../src/lib/layout/LayoutModeProvider';
import { StorybookAuthProvider } from '../src/stories/StorybookAuthProvider';
import type { AppUser } from '../src/lib/api/types';
import '../src/styles/appStyles';

function LayoutClasses({ children }: { children: ReactNode }) {
  const { isMobile } = useLayoutMode();
  useEffect(() => {
    document.documentElement.classList.toggle('layout-mobile', isMobile);
    document.documentElement.classList.toggle('layout-desktop', !isMobile);
    return () => {
      document.documentElement.classList.remove('layout-mobile', 'layout-desktop');
    };
  }, [isMobile]);
  return <>{children}</>;
}

function StoryProviders({ children, route, user }: {
  children: ReactNode;
  route: string;
  user: AppUser | null | undefined;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <LayoutModeProvider>
          <StorybookAuthProvider user={user}>
            <LayoutClasses>{children}</LayoutClasses>
          </StorybookAuthProvider>
        </LayoutModeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const preview: Preview = {
  tags: ['autodocs'],
  loaders: [mswLoader()],
  parameters: {
    layout: 'centered',
    docs: { theme: themes.dark },
    viewport: { options: { mobile: { name: 'Mobile', styles: { width: '390px', height: '844px' } }, desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } } } },
  },
  decorators: [
    (Story, context) => (
      <StoryProviders
        key={context.id}
        route={(context.parameters.route as string | undefined) ?? '/home'}
        user={context.parameters.authUser as AppUser | null | undefined}
      >
        <Story />
      </StoryProviders>
    ),
  ],
};

export default preview;
