import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'Excelsior Storybook',
    brandUrl: 'http://localhost:5173',
    brandImage: '/src/resources/images/logo/logo5.png',
    colorPrimary: '#00c8e8',
    colorSecondary: '#00c8e8',
    appBg: '#070b16',
    appContentBg: '#0d1526',
    barBg: '#0d1526',
    textColor: '#e8edf7',
  }),
});
