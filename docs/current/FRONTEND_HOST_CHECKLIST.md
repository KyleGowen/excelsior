# Future native host integration checklist

All preparation stays inside Excelsior. Its branding, routes and interaction defaults remain the compatibility baseline. The local alternate host is fictional, not an LRG reskin, package deployment or account migration.

| Input / contract | Preparation status | Before real host integration |
| --- | --- | --- |
| API/data environment and player identity | Typed transport/identity ports; server access adapters from M2 | Supply approved server-owned credentials, verified player mapping and ownership policy. Never ship service secrets to a browser. Give each environment/identity lifecycle its own QueryClient. |
| Theme/typography/spacing | Opt-in local appearance wrapper and fictional presets | Obtain approved tokens/fonts and verify accessible contrast, complete asset rules and remaining fixed-color/global/rem dependencies. |
| Brand assets and icons | Host-owned `chrome.brand`, decorative UI icon renderer and detail action nodes; card/stat and third-party assets separate | Obtain approved logos/art/icons and licensing; verify their accessible rendering and M7 delivery. Do not replace Excelsior branding during preparation. |
| Navigation and URLs | Deck/Home/Back/detail-history callbacks; no router required by modules | Define host base paths, nested routes, safe links, browser back/forward, open-deck/card and unsaved return policy. Full nested-route integration still needs live evidence. |
| Detail actions and auth entry | Optional render slot, current card/source/type and explicit auth request | Decide supported add-to-deck/collection actions and permissions. Host owns sign-in UI, safe return and player/cache lifecycle. Current fixture receipts are not real login or data writes. |
| Save feedback and other feature actions | Optional pure host save-result/pending renderer; existing persistence/controls remain; other feature slots pending | Define success/failure/pending feedback and feature availability without bypassing backend authority. |
| Layout and panels | Per-container layout and host overlay roots; focus/Escape/disposal verified locally | Place roots inside appropriate wrappers, define stacking/containing block, exercise multiple instances and host keyboard interactions. External roots need host styling. |
| CSS containment | Container classes/tokens scoped; broad reset/ancestor/media/root dependencies remain | Verify styles cannot affect host chrome and host CSS cannot unexpectedly break modules. Do not claim CSS-leak-free embedding yet. |
| Delivery and assets | Source interface; current shared CSS/CDN initialization | M7 must remove backend source imports and declare assets/exports before packaging claims. No package publication is authorized. |
| Acceptance and release | Each bounded slice has automated local evidence and separate Kyle acceptance | Rerun changed baseline cases, inspect retained failures, obtain Kyle's identified-preview acceptance, then Ship; perform selected production smoke. Real LRG asset/identity/interaction acceptance is future work. |

Do not infer complete M6 or backend-domain migration from these ports. Remaining M4 simulation/import/export/Collection contracts are retained in the implementation ledger. No iframe implementation or exploration is part of this roadmap.
