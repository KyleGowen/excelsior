import fs from 'fs';
import path from 'path';
import { validateCustomContribution } from '../../../frontend/src/features/supporter-flow/contributionValidation';

const repoRoot = path.join(__dirname, '../../..');
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('customer-chosen monthly Supporter flow', () => {
  const provider = read('frontend/src/features/supporter-flow/SupporterFlowProvider.tsx');
  const input = read('frontend/src/features/supporter-flow/MonthlyContributionInput.tsx');
  const css = read('frontend/src/features/supporter-flow/SupporterFlow.css');

  it.each([
    ['', null],
    ['2', null],
    ['3.5', null],
    ['-3', null],
    ['1e3', null],
    [' 5 ', null],
    [String(Number.MAX_SAFE_INTEGER + 1), null],
    ['3', 3],
    ['5', 5],
    ['10', 10],
    ['999', 999]
  ])('validates the custom whole-dollar value %p', (value, expected) => {
    expect(validateCustomContribution(value, 3, 1000).amount).toBe(expected);
  });

  it('renders one accessible preset group with $3 selected by default and a focused Other field', () => {
    expect(provider).toContain("useState<ContributionChoice>('3')");
    expect(input).toContain("{ value: '3', label: '$3' }");
    expect(input).toContain("{ value: '5', label: '$5' }");
    expect(input).toContain("{ value: '10', label: '$10' }");
    expect(input).toContain("{ value: 'other', label: 'Other' }");
    expect(input).toContain('type="radio"');
    expect(input).toContain('customInputRef.current?.focus()');
    expect(input).toContain('inputMode="numeric"');
    expect(input).toContain('aria-describedby={error ? \'supporter-custom-error\' : undefined}');
  });

  it('uses a concise $3 minimum proposition, dynamic monthly CTA copy, guest sign-in, and canonical paid values', () => {
    expect(provider).toContain('MONTHLY SUPPORT');
    expect(provider).toContain('aria-label="$3 minimum per month"');
    expect(provider).toContain('Start at $3.&nbsp; Or, if you really appreciate Excelsior');
    expect(provider).toContain('All supporters receive the same thank you features.');
    expect(provider).not.toContain('Keep Excelsior free. Support what comes next.');
    expect(provider).not.toContain('Card data, rules, search, and core deckbuilding stay free for everyone.');
    expect(provider).not.toContain('Same Supporter features at every amount.');
    expect(provider).toContain('Become a Supporter — $${selectedAmount ?? 3}/month');
    expect(provider).toContain('Sign in to become a supporter');
    expect(provider).toContain('status.paid.monthlyContributionUsd');
    expect(provider).toContain('Manage monthly contribution');
    expect(provider).toContain('Confirming your support…');
    expect(provider).toContain('CONFIRMATION_MAX_POLLS = 15');
    expect(provider).toContain('Monthly Supporter billing is temporarily unavailable.');
    expect(provider).not.toContain('Free Excelsior remains fully usable.');
    expect(provider).not.toMatch(/one[- ]time|annual|popular|tier/i);
  });

  it('keeps desktop choices on one row, mobile choices in two columns, and disables motion', () => {
    expect(css).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))');
    expect(css).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none/);
  });
});
