# Guest Deck & Add-to-Deck: Lessons Learned

This document captures what we tried for GUEST users and deck editing, why it didn’t work out, and what we decided. Use it to avoid repeating the same approaches and to keep cursor/AI context accurate.

> **Note:** The legacy v1 vanilla-JS UI (`public/`) has been removed. The lessons below describe historical v1 behavior and policy; the **v2 React SPA** in `frontend/` implements the same GUEST policy (+Deck disabled on Card Database, session guest decks, clone-on-open).

---

## Current behavior (as of this doc)

- **GUEST can:** Use Deck Builder, create/edit/delete **session-scoped** decks via `/api/v1/guest/decks`, open the guest account's preloaded sample decks (which are **cloned to a session copy** so the DB is never modified), and save that session copy. They cannot persist deck changes to the database.
- **Shared links:** Another account's database deck opens **read-only**, even without `?readonly=true`. Viewing it and using Back must not create a copy or add it to Guest Decks. Clone-on-open is restricted to samples owned by the current guest account, using the loaded owner rather than the route's user id.
- **GUEST cannot:** Use the **+Deck** button on the Card Database view. The button is **disabled** for GUEST (greyed out, “Log in to add to decks...”).
- **Backend:** GUEST is blocked from mutating database decks: `blockGuestMutation` is used on POST/PUT/DELETE for `/api/decks/:id` and `/api/decks/:id/cards`. Session-only behavior is achieved via guest deck APIs and clone-on-open for DB decks.

---

## What we tried and what went wrong

### 1. Let GUEST use +Deck and add to “their” decks

- **Idea:** GUEST has preloaded DB decks (e.g. “Time Detectives”). Allow GUEST to add cards from the Card Database to those decks.
- **Implementation:** Removed `blockGuestMutation` from deck card endpoints so GUEST could call POST/PUT/DELETE `/api/decks/:id/cards` when they “own” the deck (same user id).
- **Result:** Cards **persisted to the database**. In another incognito window (or new session), the same preloaded deck showed the added cards. That violated “session only” for GUEST.
- **Lesson:** Letting GUEST call main deck APIs on “their” DB decks will persist to the DB. If the requirement is “no DB writes for GUEST,” those routes must stay blocked for GUEST.

### 2. Clone DB deck to session when GUEST opens it (clone-on-open)

- **Idea:** When GUEST opens a preloaded deck (e.g. from deck list), clone it to a session deck and open the clone so all edits go to session only.
- **Implementation:** In `loadDeckForEditing`, if user is GUEST and `deckId` is a DB deck (not `guest_*`), fetch the deck, POST `/api/guest/decks`, PUT cards to the new guest deck, then redirect to the guest deck URL.
- **Result:** Works: GUEST never edits the DB deck; they edit a session copy. No DB persistence from the editor.
- **Lesson:** Clone-on-open is a good way to keep “open preloaded deck” session-only. We kept this.

### 3. Let GUEST use +Deck and add to preloaded decks via session copy

- **Idea:** From the Card Database, when GUEST clicks +Deck and picks a **preloaded** deck, don’t call main deck API; create or reuse a **session copy** and add the card to that.
- **Implementation:**  
  - Backend: Re-enabled `blockGuestMutation` on deck card endpoints so GUEST can’t mutate DB decks.  
  - Frontend: When GUEST picks a DB deck in the +Deck dropdown, call `getOrCreateGuestSessionCopy(dbDeckId)` (fetch deck, create guest deck, PUT cards, store mapping in `sessionStorage`), then POST the new card to the guest deck.
- **Result:** Complex and brittle: session copy creation could fail; `sessionStorage` mapping (DB deck id → guest deck id) is easy to get out of sync (e.g. guest deck list refresh, multiple tabs). Users saw 403 or “Open the deck first…” when the flow failed.
- **Lesson:** Adding to a “preloaded deck” from the database view really means “adding to a session copy.” Doing that on demand in the +Deck flow added a lot of edge cases and poor UX. Not worth the complexity for the benefit.

### 4. Disable +Deck for GUEST

- **Idea:** Don’t support “add card from Card Database to a deck” for GUEST at all.
- **Implementation:** Disable the +Deck button for GUEST everywhere (Card Database tabs, All Cards view): `disableAddToDeckButtonsImmediate` and `disableAddToDeckButtons` when `isGuestUser()`, and per-view logic (e.g. `all-cards-display.js`) to render the button disabled with “Log in to add to decks...”.
- **Result:** Clear, simple, no DB leakage, no session-copy edge cases. GUEST can still use Deck Builder and session decks (including clones of preloaded decks when they open them).
- **Lesson:** Disabling +Deck for GUEST is the right tradeoff: avoids bugs and complexity while keeping a consistent “session only” story. Document this so we don’t re-open the same can of worms without a strong product reason.

---

## Technical pitfalls (for future changes)

1. **Two `addCardToDeck` implementations**  
   - `deck-management.js`: `addCardToDeckFromSelection(deckId, cardType, cardId, cardName)` — used when a deck is chosen from the +Deck dropdown.  
   - `deck-card-operations.js`: `addCardToDeck(cardType, cardId)` — uses global `currentDeckId` (deck editor flow).  
   Load order can overwrite one with the other. We resolved the “No deck selected” bug by renaming the deck-management one to `addCardToDeckFromSelection` so the two don’t collide.

2. **Deck list for GUEST**  
   GET `/api/guest/decks` returns both **DB decks owned by the guest user** (preloaded) and **session-only decks** (`guest_*`). The dropdown shows both. If you ever let GUEST use +Deck again, you must not send DB deck ids to the main deck API, or you’ll persist to DB again.

3. **Where +Deck is disabled for GUEST**  
   Multiple places must stay in sync:  
   - `index.html`: `disableAddToDeckButtonsImmediate()` (runs when guest; MutationObserver + `disableAddToDeckButtons()`).  
   - `deck-editor-simple.js`: `disableAddToDeckButtons()` (no-op when not guest).  
   - `card-display.js`, `card-display-functions.js`: after appending rows that contain `.add-to-deck-btn`, if guest then disable the button.  
   - `all-cards-display.js`: for guest, render button with `disabled`, no `onclick`, and “Log in to add to decks...” title.  
   Any new view that adds a +Deck button should also disable it for GUEST.

---

## Recommendations

- **Do not** re-enable +Deck for GUEST without a clear product decision and a simple design (e.g. “only allow adding to existing session decks” with no DB-deck → session-copy logic in the dropdown).
- **Do not** remove `blockGuestMutation` from deck mutation routes for GUEST; that leads to DB persistence.
- **Keep** clone-on-open only for the guest account's own preloaded samples. Shared decks owned by other accounts must open read-only without creating a guest deck.
- When touching guest vs deck behavior, **re-read this doc** and the guest sections in API_DOCUMENTATION.md and .cursorrules so implementation matches the intended policy.

---

## References

- Guest deck API: [API_V1.md](../../API_V1.md) — Guest decks section; legacy session routes in [API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
- Backend guest block: `src/api/http/` guest deck handlers + `blockGuestMutation` on legacy deck mutation routes
- Clone-on-open and +Deck policy: v2 [`DeckEditorPage.tsx`](../../frontend/src/features/deck-editor/DeckEditorPage.tsx) and Card Database components under `frontend/src/features/database/`
