export function validateCustomContribution(
  value: string,
  minimum: number,
  maximum: number,
): { amount: number | null; error: string | null } {
  if (value.length === 0) return { amount: null, error: 'Enter a monthly amount.' };
  if (!/^\d+$/.test(value)) {
    return { amount: null, error: 'Use whole US dollars only.' };
  }
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) {
    return { amount: null, error: 'Enter a smaller whole-dollar amount.' };
  }
  if (amount < minimum) {
    return { amount: null, error: `Monthly support starts at $${minimum}.` };
  }
  if (amount > maximum) {
    return { amount: null, error: 'Enter a smaller whole-dollar amount.' };
  }
  return { amount, error: null };
}
