/** Adapt the existing stylesheet for a shadow surface, preserving ordinary site CSS. */
export function scopeNativeStyles(css: string): string {
 return css
  .replace(/:root\b/g, ':host')
  .replace(/(?<![\w-])(?:html|body|#root)(?=[\s,.{:#[>+~]|$)/g, '.module-native-root')
  .replace(/(-?\d*\.?\d+)rem\b/g, 'calc($1 * var(--module-root-font-size, 16px))')
  .replace(/(-?\d*\.?\d+)(?:d|s|l)?vw\b/g, '$1cqw')
  .replace(/(-?\d*\.?\d+)(?:d|s|l)?vh\b/g, '$1cqh')
  .replace(/@media\s*\((min|max)-width:\s*([^)]*)\)/g, '@container ($1-width: $2)');
}
