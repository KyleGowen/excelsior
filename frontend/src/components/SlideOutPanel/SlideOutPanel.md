# SlideOutPanel

Accessible slide-out drawer used for details and forms across the app (card detail, create
deck, deck actions, add cards, mobile account sheet).

## Props
| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | `boolean` | – | Controls mount/visibility. |
| `onClose` | `() => void` | – | Called on backdrop click, `Esc`, or close button. |
| `title` | `ReactNode` | – | Header title. |
| `footer` | `ReactNode` | – | Sticky footer slot. |
| `side` | `'right' \| 'bottom' \| 'top'` | `'right'` | Edge it slides from. Right = desktop drawer; bottom = mobile sheet; **top** = deck editor Draw Hand overlay (`position="absolute"`). |
| `position` | `'fixed' \| 'absolute'` | `'fixed'` | Viewport-fixed (default) or positioned within a `position: relative` ancestor (Draw Hand on `.deck-editor__content`). |
| `width` | `number` | `380` | Width for the right variant (full-width on mobile). |
| `ariaLabel` | `string` | – | Accessible label when there's no visible title. |
| `closeOnEscape` | `boolean` | `true` | Set to `false` while a child overlay owns Escape dismissal. |

## Accessibility
- `role="dialog"`, `aria-modal="true"`; focus moves into the panel on open and returns to
  the trigger on close.
- Focus management runs only when `open` changes (not when `onClose` identity changes), so
  typing in form fields inside an open panel does not steal focus.
- Closes on `Escape` (when `closeOnEscape` is enabled) and backdrop click.
- A parent slide-out that remains mounted beneath a child overlay must temporarily set
  `closeOnEscape={false}` so one keypress dismisses only the topmost layer.

## Notes
- Sits above content via the drawer z-index with a scrim.
- There is also a `.cursorrules` in this folder describing the pattern.

## Host-configured overlays (M6 first slice)

A module host may supply `ModuleHost.overlays` through `OverlayHostProvider`. With a root supplied, the panel portals there; position defaults absolute, and host panels respect the root's rectangle. Modal defaults true, wraps Tab/Shift-Tab, and Escape applies only to the panel containing focus. Nonmodal mode keeps `aria-modal=false` and permits Tab to leave. Close/unmount restores a still-connected trigger and disposes the listener/portal. Root or modality changes also refresh focus ownership. No body/document attributes or scroll styles are changed. Default Excelsior overlays retain inline placement and existing keyboard behavior. Host styling/asset/container containment remains separate work.
