# ProfileMenu

Account menu contents (file is `ProfileMenuContent.tsx`): user header, "Create New Deck", and
inline subforms for display name / email / password, Help & Feedback, plus log out. Rendered inside a desktop
dropdown or a mobile sheet by the nav.

## Props
| Prop | Type | Default | Notes |
|---|---|---|---|
| `onClose` | `() => void` | – | Closes the host dropdown/sheet (called before navigation and on logout). |
| `onOpenHelp` | `() => void` | – | Closes the profile surface and opens the shared Help & Feedback workflow. |
| `onOpenSupporter` | `() => void` | optional | Closes the host before navigating to the full Supporter page. Omitted for admins or unresolved status. |
| `supporterLabel` | Supporter profile label | optional | Canonical **Support Excelsior**, **Manage monthly support**, or **Supporter status** copy. |
| `variant` | `'dropdown' \| 'sheet'` | `'dropdown'` | Root class `profile-menu--{variant}` for desktop vs mobile presentation. |

## Notes
- Reads the session via [`useAuth()`](../../app/AuthProvider.tsx); renders nothing when there
  is no user. Header shows display name (or "Guest"), email, and deck count from
  `['decks','mine',userId]`.
- Capability gating:
  - Guests: Create Deck + Help & Feedback + "Exit Guest" (no name/email/password forms).
  - Google (SSO) users: can set a separate **Display name** but cannot change email/password
    (those forms auto-close); password users edit their unique **Username**.
  - ADMIN users additionally see **User Analytics** and **Biz Ops Dashboard** links. Both destination routes are wrapped in `AdminRoute`, and their `/api/v1/admin/*` endpoints independently require the server-side ADMIN role.
- Only one subform open at a time (`openForm`). Mutations call `lib/api/account`
  (`setDisplayName`/`changeEmail`/`changePassword`), then `refresh()` +
  `invalidateQueries(['auth','me'])`. Password subform uses two
  [`PasswordInput`](../PasswordInput/PasswordInput.md)s with live match validation.
- Help & Feedback is always placed before the divider above logout. Desktop renders its inspector
  from `UserMenu`; mobile renders the same flow from `MobileBottomNav` after closing the account sheet.
- The Supporter action uses the canonical billing-status label and navigates to `/supporter`, where
  the Stripe-backed controls render inline. It never mutates membership inside the menu.
- Create Deck navigates to `/users/:id/decks?create=1`; logout clears auth and routes to
  `/login`. Styling in `ProfileMenuContent.css`.
