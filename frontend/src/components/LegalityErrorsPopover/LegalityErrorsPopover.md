# LegalityErrorsPopover

Wraps a legality badge/trigger and surfaces deck validation error messages as a desktop
hover/focus tooltip or a mobile press-and-hold sheet.

## Props
| Prop | Type | Default | Notes |
|---|---|---|---|
| `errors` | `string[]` | – | Validation messages. When empty, renders `children` unchanged (no wrapper). |
| `pressAndHold` | `boolean` | `false` | `true` = a 500ms press opens a bounded mobile panel; `false` = hover/focus tooltip (`role="tooltip"`). |
| `children` | `ReactNode` | – | The trigger (e.g. the legality badge). |

## Notes
- Tooltip mode: the wrapper is focusable (`tabIndex={0}`, `aria-describedby` the list) and
  opens on `mouseenter`/`focus`, closes on `mouseleave`/`blur` (blur ignores focus moving to a
  child via `relatedTarget`). Open state toggles `.legality-errors-popover--open`.
- Press-and-hold mode: holding the trigger for 500ms opens a portaled panel anchored 6px below
  the trigger. Its measured position keeps it inside the viewport and clear of mobile navigation,
  even though the deck header's blur establishes a containing block. Moving more than 10px
  cancels the gesture so scrolling stays natural. The
  synthesized click after a successful hold is suppressed, which prevents an owner's legality
  toggle from firing. Tap outside, use **Close**, or press Escape to dismiss. Keyboard focus on
  the wrapper also opens the sheet.
- List id is generated with `useId()` so multiple instances stay isolated.
- Styling in [`LegalityErrorsPopover.css`](./LegalityErrorsPopover.css); the popover panel must
  layer above page content (z-index 9999 per the global popup rule). See
  [`.cursorrules`](./.cursorrules).
