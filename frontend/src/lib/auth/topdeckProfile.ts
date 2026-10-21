/** Only explicitly saved handles create links. The destination host is fixed. */
export function topdeckProfileUrl(handle: string | null | undefined): string | null {
  return handle ? `https://topdeck.gg/profile/@${encodeURIComponent(handle)}` : null;
}
