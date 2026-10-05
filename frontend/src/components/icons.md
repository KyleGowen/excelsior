# Decorative application icons

`icons.tsx` supplies the existing inline SVG controls. Default markup, sizes, labels and icon paths remain unchanged. A module host can opt into `ModuleIconOptions` to replace decorative controls by semantic `UIIconName`; the named brand/icon module stories exercise this through the actual provider.

The trusted render callback receives only name, filled state and optional class name. Return `undefined` to retain the existing SVG, `null` to hide it, or an inert node for replacement. Do not call hooks or perform effects during rendering. The wrapper preserves the caller class and style, marks content decorative and cannot replace the surrounding button label or action. Host nodes must not add focusable controls or interactive content. Card art, printed game/stat badges and Google's identity artwork remain separate domain/third-party assets.

Configuration belongs to each ModuleHostProvider and follows React context into configured portals. Provider changes update icons without remounting the module. Omitted configuration resets to defaults; no document, stylesheet, storage or global renderer is mutated. Host-owned branding is an optional `chrome.brand` node outside the module appearance boundary; style and accessible naming belong to that host.
