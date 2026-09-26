# Excelsior Storybook

Storybook is the local gallery for Excelsior's existing React components and
screens. It is a free, open-source development dependency. This setup does not
use Chromatic or another hosted service.

From `frontend/`:

```bash
npm install
npm run storybook
```

Open <http://localhost:6006>. The regular Excelsior site remains at
<http://localhost:5173>, with its API at <http://localhost:8085>. Storybook
does not need either server: screen stories use local mock API responses and
fictional accounts. Run
`npm run build:storybook` to produce a standalone gallery in
`frontend/storybook-static/`; this output is separate from the site's
`frontend/dist/` production bundle.

Stories import the production components directly from `src/components/` and
`src/features/`, along with the same tokens and global CSS as the site. The
Storybook preview wraps stories in Excelsior's layout, router, and query
providers. Example data is deliberately fictional; the card images and other
art are copied from repository assets by
`scripts/prepare-storybook-assets.mjs` before each dev or build run. The script
copies only the examples' assets because the full card-art tree is over 2 GB.

Add stories under `src/stories/` with a title, production component import,
representative props, and states worth revisiting. When a story uses a new
asset under `src/resources/`, add its path to the preparation script. Keep
the `src/stories/` fixtures free of user, account, and production data.

For future UI work, the active repo instructions in the root and frontend
`AGENTS.md` files require a named Storybook example for every new React
component, including feature-local and route components. Components that only
make sense inside a parent or provider can be exercised by a named parent story
variant. Before finishing, compare newly added components with the stories and
add screen coverage for each new route or visual state. Existing stories reflect
edits to their imported production components and CSS without a second copy of
the UI. Run `npm run build:storybook` when checking a frontend UI change. The
gallery is a development tool; Excelsior's production bundle remains separate.
The site and gallery share `src/styles/appStyles.ts`; put new global stylesheet
imports there so they reach both builds automatically.

The **Screens** group covers every current route-level page: Login, Home,
Recent Updates, Tournament Data, Card Database, Collection, Decks, Community,
Deck Editor, Admin User Analytics, and Admin Biz Ops. Populated, empty,
mobile, read-only, and error examples are included where useful. The other
groups cover reusable card and deck tiles, card detail panel, catalog list,
card art and ribbons, controls, loading and empty states, slide-out panels,
brand elements, and tournament dashboard charts.

Screen responses are supplied by `src/stories/pageMocks.ts` and
`src/stories/adminMocks.ts` through Mock Service Worker. The admin figures are
invented visual examples, not production metrics. Screen stories show isolated
states; they are not a second full application with persistent account or deck
data. Use the regular local site for end-to-end workflows.
