/** Actual focused descendant across open shadow surfaces, without global state. */
export function activeElement(owner: Document = document): Element | null {
 let active = owner.activeElement;
 while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
 return active;
}
