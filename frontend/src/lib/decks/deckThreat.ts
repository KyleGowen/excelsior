export const MAX_TOTAL_THREAT = 76; // Display denominator; eligibility is server-owned.
export function formatThreatDisplay(total:number):string { return total > MAX_TOTAL_THREAT ? `${total}/${MAX_TOTAL_THREAT}` : String(total); }
export function formatThreatTooltip(total:number):string { return `Threat: ${formatThreatDisplay(total)}`; }
