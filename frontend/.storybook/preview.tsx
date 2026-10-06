import { ImageAssetsContext } from '../src/lib/images/useImageAssets';
import * as legacyAssets from '../src/app/legacyImageAssets';
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

function StoryProviders({ children, route, user, withoutRouter, withoutAuth, interactiveAuth }: {
  children: ReactNode;
  route: string;
  user: AppUser | null | undefined;
  withoutRouter: boolean;
  withoutAuth: boolean;
  interactiveAuth: boolean;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  }));
  const content = <LayoutClasses>{children}</LayoutClasses>;
  const identityContent = withoutAuth ? content : <StorybookAuthProvider user={user} interactiveAuth={interactiveAuth}>{content}</StorybookAuthProvider>;
  return (
    <ImageAssetsContext.Provider value={legacyAssets}><QueryClientProvider client={queryClient}>
      {withoutRouter ? (
        <LayoutModeProvider>
          {identityContent}
        </LayoutModeProvider>
      ) : (
        <MemoryRouter initialEntries={[route]}>
          <LayoutModeProvider>
            {identityContent}
          </LayoutModeProvider>
        </MemoryRouter>
      )}
    </QueryClientProvider></ImageAssetsContext.Provider>
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
        withoutRouter={context.parameters.withoutRouter === true}
        withoutAuth={context.parameters.withoutAuth === true}
        interactiveAuth={context.parameters.interactiveAuth === true}
      >
        <Story />
      </StoryProviders>
    ),
  ],
};

export default preview;
