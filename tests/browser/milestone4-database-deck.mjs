// Local-only mutation regression: the caller restores the exact owned fixture afterward.
import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';
export async function runDatabaseDeckNavigation({ tab, target, fixture, evidenceDir }) {
  check(target?.verified && target.environment === 'local', 'Verified local target required');
  const origin = new URL(target.frontendUrl).origin;
  check(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Local loopback only');
  check(fixture?.ownedFixture === true && fixture.deckUrl && fixture.deckName && fixture.cardName && Number.isInteger(fixture.beforeTotal), 'Owned fictional fixture and baseline required');
  const role = (kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
  const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
  const report = { schema: 1, kind: 'browser', environment: 'local', method: 'CUA live browser automation', sourceRevision: target.sourceRevision,
    inputFingerprint: target.sourceTreeFingerprint, theme: 'fixed dark', scenarios: [], acceptance: 'automated only; Kyle acceptance pending',
    cleanup: { applicationRecords: 'caller must restore owned fixture', browser: 'test-owned tab' }, gaps: ['desktop account flow only; mobile and Guest not executed by this case'] };
  try {
    await tab.goto(origin + fixture.deckUrl); // Initial load only: all subsequent navigation uses product controls.
    await wait(role('textbox', 'Deck name'));
    await wait(tab.playwright.getByText(`${fixture.beforeTotal} cards`, { exact: true }));
    check(await role('button', `View ${fixture.cardName}`).count() === 0, 'Fixture already contains target card');
    report.dimensions = await tab.playwright.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
    report.scenarios.push({ id: 'warm-deck-cache', status: 'passed', evidence: await captureBrowserEvidence(tab, evidenceDir, 'warm-deck-cache') });
    await role('button', 'Card Database').click();
    await wait(role('searchbox', 'Search cards'));
    await role('tab', fixture.cardTab).click();
    await role('searchbox', 'Search cards').fill(fixture.cardName);
    await role('button', `View ${fixture.cardName}`).click();
    await wait(role('dialog', `${fixture.cardName} details`));
    await role('button', 'Add to Deck').click();
    await wait(role('button', fixture.deckName));
    await role('button', fixture.deckName).click();
    await wait(tab.playwright.getByText(`Added to ${fixture.deckName}`, { exact: true }));
    await role('button', 'Close panel').click();
    await role('link', 'Decks').click();
    await wait(role('heading', 'My Decks'));
    const tile = tab.playwright.getByRole('button').filter({ has: role('heading', fixture.deckName) });
    check(await tile.count() === 1, 'Expected one fixture deck tile');
    await tile.click();
    await wait(role('textbox', 'Deck name'));
    await wait(role('button', `View ${fixture.cardName}`));
    await wait(tab.playwright.getByText(`${fixture.beforeTotal + 1} cards`, { exact: true }));
    report.scenarios.push({ id: 'database-add-normal-navigation', status: 'passed', observed: { addedCard: fixture.cardName, total: fixture.beforeTotal + 1, reloadAfterAdd: false }, evidence: await captureBrowserEvidence(tab, evidenceDir, 'database-add-normal-navigation') });
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.scenarios.push({ id: 'database-add-normal-navigation', status: 'failed', reason: error.message, evidence: await captureBrowserEvidence(tab, evidenceDir, 'failure').catch(() => null) });
  }
  report.counts = Object.fromEntries(['passed','failed','skipped','blocked'].map(status => [status, report.scenarios.filter(s => s.status === status).length]));
  report.reportPath = await writeBrowserReport(evidenceDir, report); return report;
}
