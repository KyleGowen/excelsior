# Future native host integration checklist

M6 prepares a native React host contract inside Excelsior. Its ordinary branding, routes and interactions stay the compatibility baseline. The alternate host is fictional; no iframe, LRG code copy, live rebrand or package publication is involved.

| Input | M6 preparation | Actual host still supplies |
| --- | --- | --- |
| API and identity | Typed configurable transport, explicit player/Guest/admin context, M2 server access adapters | Approved confidential server credentials, player mapping, ownership policy and per-environment/identity QueryClient lifecycle. |
| Styling | Opt-in isolated ShadowRoot with local reset/default tokens/rem units, container layout and inline shared component styles | Approved tokens/fonts/contrast; choose surface width/height; verify supported browsers/assistive technology and M7 assets. No real LRG visual match is claimed. |
| Brand/icons | Accessible host chrome/brand nodes, semantic decorative icon renderer and action nodes | Approved logos/icons/licensing and accessible inert replacements; printed game/third-party assets remain separate. |
| Routes/navigation | Host callbacks/detail adapter; two development base paths; native links/deep reload/Back/Forward; dirty/saving guard, explicit external link and beforeunload lifecycle | Own router/base prefix, production history fallback, safe return policy and native reload/tab-close Chrome spot check. Browser-suppressed unload prompts cannot guarantee crash/forced-close recovery. |
| Authentication/actions | Explicit sign-in request, card-detail action renderer, save-feedback slot and subtractive deck feature flags | Real sign-in/identity transition and authorized add-to-deck/collection actions. Fixture receipts are not real auth or writes. |
| Panels/focus | Internal isolated overlay root or explicit nonisolated root; shadow/ordinary focus, modal keyboard, geometry and disposal | Surface/stacking/modal design and supported-browser checks. External roots are rejected with isolated style mode rather than losing containment. |
| Delivery | Same source modules in Excelsior and fictional hosts; no import-time stylesheet injection from the reusable graph | M7 now supplies private ESM/types/font exports and a frontend-only build proof with host-resolved card art. Actual installation, production route fallback and publication still require their own scope. |
| Acceptance/release | Automated local/browser evidence is separate from Kyle's final local acceptance and exact-SHA Ship/production evidence | Approve the identified final preview, then Ship gates; real LRG asset/identity/production acceptance later. |

M6 alone did not complete the remaining delivery/rule boundary work. M7 now implements delivery and simulation/import/export retirement; its Kyle acceptance/release remains pending. M8 and real host acceptance remain future work. See [module contract](../../frontend/src/modules/README.md) and [implementation ledger](FRONTEND_PREPARATION.md).
