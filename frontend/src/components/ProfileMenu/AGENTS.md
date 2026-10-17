# Account menu context

Read the root and frontend AGENTS.md. ProfileMenuContent owns native dropdown/sheet forms, loading/errors, Google fallback, identity display, and host actions. The current native ADMIN links remain enabled for administrators; external hosts must keep their own admin entries disabled. See docs/current/FRONTEND_AUTH_AND_SESSION.md and EXTERNAL_ACCOUNT_ACCESS.md from the repository root.

Keep UI behavior unchanged during external account preparation. Guest deck warning, safe post-auth navigation, provider restrictions, and identity cache cleanup must survive future refactoring. A reusable consumer receives deck count/navigation/help callbacks; it must not import these host dependencies. Any later UI change requires named Storybook states and live browser evidence under root instructions.
