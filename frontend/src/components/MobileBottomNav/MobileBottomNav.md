# MobileBottomNav

Fixed **bottom navigation bar** for mobile layout mode (`useLayoutMode().isMobile` / `.layout-mobile`).

## Tabs
Ordered **Database, Decks, Home, Collection, Profile** (Home centered with a larger icon). Profile opens the bottom-sheet account panel (Create New Deck, Change Email/Password for password users, desktop-layout toggle, Log Out / Exit Guest). **The Account sheet auto-closes on route change** (e.g. tapping another bottom-nav tab while the sheet is open).

Supporter promotion and account management are intentionally excluded from the account sheet.

## Usage
- Composed by [`AppShell`](../AppShell/AppShell.tsx) for all shelled primary routes.
- Also mounted by [`DeckEditorPage`](../../features/deck-editor/DeckEditorPage.tsx) on mobile (deck editor is outside AppShell for unguarded shared links).

## Config
[`navConfig.tsx`](navConfig.tsx) — `NAV_ITEMS`, `MOBILE_NAV_ORDER`, active-state `match` predicates. Desktop top nav in AppShell reuses the same `NAV_ITEMS`.

## Styles
Imports [`AppShell.css`](../AppShell/AppShell.css) for `.bottom-nav` and `.account-sheet` rules (`--bottom-nav-height`, `--z-nav`).
