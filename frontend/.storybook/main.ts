import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', 'msw-storybook-addon'],
  staticDirs: [{ from: './static', to: '/' }],
  features: { sidebarOnboardingChecklist: false },
};

export default config;
