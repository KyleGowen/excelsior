# ProfileMenu

Account menu contents (file is `ProfileMenuContent.tsx`): user header, "Create New Deck", and
inline subforms for display name / email / password, Help & Feedback, plus log out. Guests see
Log In, Create Account, and Sign in with Google here. Rendered inside a desktop
dropdown or a mobile sheet by the nav.

## Props
| Prop | Type | Default | Notes |
|---|---|---|---|
| `onClose` | `() => void` | – | Closes the host dropdown/sheet after successful account actions and before navigation. |
| `onOpenHelp` | `() => void` | – | Closes the profile surface and opens the shared Help & Feedback workflow. |
| `variant` | `'dropdown' \| 'sheet'` | `'dropdown'` | Root class `profile-menu--{variant}` for desktop vs mobile presentation. |

## Notes
- Reads the session via [`useAuth()`](../../app/AuthProvider.tsx); renders nothing when there
  is no user. Header shows display name (or "Guest"), email, and deck count from
  `['decks','mine',userId]`.
- Capability gating:
  - Guests: Create Deck, credential Log In, Create Account, Google sign-in, and Help & Feedback. There is no Guest exit action because Guest is the default state. When a session has `guest_` decks, the menu explains that those decks will not transfer on sign-in or account creation.
  - Google (SSO) users: can set a separate **Display name** but cannot change email/password
    (those forms auto-close); password users edit their unique **Username**.
  - ADMIN users additionally see **User Analytics** and **Biz Ops Dashboard** links. Both destination routes are wrapped in `AdminRoute`, and their `/api/v1/admin/*` endpoints independently require the server-side ADMIN role.
- Only one subform open at a time (`openForm`). Mutations call `lib/api/account`
  (`setDisplayName`/`changeEmail`/`changePassword`), then `refresh()` +
  `invalidateQueries(['auth','me'])`. Password subform uses two
  [`PasswordInput`](../PasswordInput/PasswordInput.md)s with live match validation.
- Guest credential fields expand directly below **Log In**; account creation fields expand
  directly below **Create Account**. Opening either form focuses its first field (Email or
  Username for Log In, Username for Create Account) so typing can begin immediately. Opening one
  form closes the other.
- Help & Feedback is always placed before the divider above logout. Desktop renders its inspector
  from `UserMenu`; mobile renders the same flow from `MobileBottomNav` after closing the account sheet.
- Create Deck navigates to `/users/:id/decks?create=1`. Sign-in, account creation, and log out
  keep the current route and view when the new role can access it. Own Decks and Collection URLs
  retarget the new account; a Guest session deck falls back to that account's deck list. Persistent
  deck links stay open read-only after log out. Log out establishes a fresh Guest session.
  Styling in `ProfileMenuContent.css`.
