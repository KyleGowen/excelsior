import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';

/** Run only against a confirmed disposable local app and its isolated Guest browser session. */
export async function verifyGuestSharedDeckReadOnly({ tab, origin, sharedPath, guestListPath, name, expectedCount, evidenceDir }) {
  const url = new URL(origin);
  check(url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')), 'Select a loopback local test app');
  check(!new URL(sharedPath, origin).searchParams.has('readonly'), 'Exercise an unmodified shared link without a read-only flag');
  const role = (kind, label) => tab.playwright.getByRole(kind, { name: label, exact: true });
  const report = { environment: 'isolated-local', actor: 'guest', status: 'failed', cases: [], captures: [] };
  try {
    await tab.goto(new URL(guestListPath, origin).href);
    await role('heading', 'Guest Decks').waitFor({ state: 'visible' });
    await tab.playwright.getByText(`${expectedCount} decks`, { exact: true }).waitFor({ state: 'visible' });
    check(await tab.playwright.getByText(name, { exact: true }).count() === 0, 'Fixture already appears in Guest Decks');
    await tab.goto(new URL(sharedPath, origin).href);
    await role('button', 'Export').waitFor({ state: 'visible' });
    check(new URL(await tab.url()).pathname === new URL(sharedPath, origin).pathname, 'Shared link redirected to a guest copy');
    check(await tab.playwright.getByText('Read-only', { exact: true }).isVisible(), 'Missing read-only label');
    check(await role('textbox', 'Deck name').count() === 0, 'Shared deck name is editable');
    check(await tab.playwright.getByRole('button', { name: /^(Save|Saved|Saving…|Add Cards)$/ }).count() === 0, 'Shared deck exposes save or add controls');
    check(await tab.playwright.getByRole('button', { name: /^Remove / }).count() === 0, 'Shared deck exposes removal controls');
    report.captures.push(await captureBrowserEvidence(tab, evidenceDir, 'shared-readonly'));
    report.cases.push('unmodified shared link stays read-only on its original URL');
    await role('button', 'Back to decks').click();
    await role('heading', 'Guest Decks').waitFor({ state: 'visible' });
    await tab.playwright.getByText(`${expectedCount} decks`, { exact: true }).waitFor({ state: 'visible' });
    check(await tab.playwright.getByText(name, { exact: true }).count() === 0, 'Back reveals an unwanted shared-deck copy');
    report.captures.push(await captureBrowserEvidence(tab, evidenceDir, 'guest-list-after-back'));
    report.cases.push('Back leaves Guest Decks unchanged');
    report.status = 'passed';
  } catch (error) {
    report.error = error.message;
  }
  report.reportPath = await writeBrowserReport(evidenceDir, report);
  return report;
}
