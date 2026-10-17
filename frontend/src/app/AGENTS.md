# Application identity context

Read root/frontend AGENTS.md. AuthProvider owns native identity bootstrap, Guest establishment, Google readiness/redirect lifecycle, and account transition query cleanup. ExcelsiorModuleHost supplies identity to modules; a module must not independently bootstrap another auth session. Follow docs/current/FRONTEND_AUTH_AND_SESSION.md.

External component preparation must not change native bootstrap, existing login/logout, router, or cache behavior. Keep host-owned drafts separate from identity-dependent query cleanup. A future shared component is not permission to install it into existing modules.
