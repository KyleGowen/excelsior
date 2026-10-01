# AppShell

The application chrome for all primary routes. Renders a responsive
navigation frame around its `children`.

## Layout
- **Desktop** (`useLayoutMode().isMobile === false`): sticky **top nav** with the `Logo`,
  primary tabs in `NAV_ITEMS` order (**Home, Database, Decks, Community, Collection**), and
  `UserMenu` on the right. **Community** is **desktop-only** (excluded from `MOBILE_NAV_ORDER`).
- **Mobile**: composes [`MobileBottomNav`](../MobileBottomNav/MobileBottomNav.tsx) — fixed
  **bottom nav** with icon+label tabs ordered **Database, Decks, Home, Collection, Profile**
  (Home centered; its icon is 15% larger via `.bottom-nav__item--home`). Profile opens a
  bottom-sheet `SlideOutPanel` ("account sheet") with Guest sign-in and account creation or
  member account settings and Log Out, plus a **Use desktop layout** toggle (`preferDesktop`).

## Nav model
[`navConfig.tsx`](../MobileBottomNav/navConfig.tsx) — `NAV_ITEMS` defines each tab's
`to(userId)` target and `match(pathname)` predicate. Decks and Collection are user-scoped
(`/users/:userId/...`); Home, Database, and Community are global. `MOBILE_NAV_ORDER` lists the
4 tabs shown in the mobile bottom nav (database, decks, home, collection) — **Community is
omitted on mobile** (reached via Home "View All" links). Active state is computed from the
current pathname. The Decks tab is active on both the deck list and deck editor URLs.

## Dependencies
- `useAuth()` for the user, guest flag, and logout (via `MobileBottomNav` on mobile).
- `useLayoutMode()` for the mobile/desktop split and the desktop-layout override.

## Notes
- Nav sits at `--z-nav` (9999) so dropdowns/sheets always clear page content.
- Shelled routes wrap via `ShelledLayout` in `app/router.tsx`. The deck editor is outside
  AppShell (unguarded shared links) but mounts the same `MobileBottomNav` on mobile.
