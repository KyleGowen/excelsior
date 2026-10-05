/** Shared global style entry for the Excelsior site and Storybook. */
import './tokens.css';
import './shadcn-theme.css';
import './tailwind.css';
import './global.css';

import '../modules/ModuleHarness.css';

import '../components/icons.css';

// Reusable module styles have no import-time document side effects.
import '../modules/moduleStyles.css';
import '@fontsource/poppins/800.css';
