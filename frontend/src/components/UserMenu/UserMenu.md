# UserMenu

Desktop top-nav avatar + dropdown. Shows the user's initial, name (or "Guest"), and a
caret; the dropdown links to My Decks and Collection, a disabled "Profile (Soon)" item, and
Log Out / Exit Guest.

## Behavior
- Closes on outside click and `Escape`.
- Renders nothing when there is no authenticated user.
- Uses `useAuth()` for account state. Supporter promotion and account management are intentionally
  excluded from the dropdown.

## Notes
- Mobile uses the AppShell account sheet instead of this menu.
- `aria-haspopup="menu"` / `role="menu"` for accessibility.
