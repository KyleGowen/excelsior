import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';
/** Read-only local module checks; caller verifies checkout, session and fixture beforehand. */
export async function runIndependentModuleCases(tab, { directory, deckId, deckName, sourceRevision }) {
 const origin = new URL(await tab.url());
 check(['localhost', '127.0.0.1'].includes(origin.hostname), 'Module harness checks require a verified local target');
 check(origin.pathname === '/module-harness.html', 'Open the independent development harness first');
 const scenarios = [];
 const capture = id => captureBrowserEvidence(tab, directory, id);
 const run = async (id, action) => {
  try { await action(); scenarios.push({ id, status: 'passed', evidence: await capture(id) }); }
  catch (error) { scenarios.push({ id, status: 'failed', reason: error.message, evidence: await capture(`${id}-failed`) }); }
 };
 const select = async name => { const button = tab.playwright.getByRole('button', { name, exact: true }); await button.click(); await button.and(tab.playwright.locator('[aria-pressed="true"]')).waitFor({ state: 'visible' }); };
 const db = tab.playwright.getByRole('region', { name: 'Independent Card Database', exact: true });
 const col = tab.playwright.getByRole('region', { name: 'Independent Collection', exact: true });
 const deck = tab.playwright.getByRole('region', { name: 'Independent Deck Builder', exact: true });
 await tab.playwright.getByRole('textbox', { name: 'Local deck ID', exact: true }).fill(deckId);
 check(await tab.playwright.getByRole('checkbox', { name: 'Read-only deck', exact: true }).evaluate(el => el.checked), 'Harness must start read-only');
 await run('database-alone', async () => {
  await select('Card Database module'); await db.getByRole('searchbox', { name: 'Search cards', exact: true }).fill('Lancelot');
  await db.getByRole('button', { name: 'View Lancelot', exact: true }).waitFor({ state: 'visible' });
  check(await deck.count() === 0 && await col.count() === 0, 'Database must not require Deck or Collection pages');
  await db.getByRole('button', { name: 'View Lancelot', exact: true }).click();
  const detail = db.getByRole('dialog', { name: 'Lancelot details', exact: true }); await detail.waitFor({ state: 'visible' });
  await detail.getByRole('img', { name: 'Lancelot', exact: true }).and(tab.playwright.locator('img')).waitFor({ state: 'visible' });
  check(await detail.getByRole('img', { name: 'Lancelot', exact: true }).evaluate(el => el.complete && el.naturalWidth > 0), 'Detail art must load');
  await detail.getByRole('button', { name: 'Close panel', exact: true }).click();
 });
 await run('collection-alone', async () => {
  await select('Collection module'); await col.getByRole('heading', { name: 'My Collection', exact: true }).waitFor({ state: 'visible' });
  await col.getByRole('searchbox', { name: 'Search collection', exact: true }).fill('Lancelot');
  await col.getByRole('tab', { name: 'Characters', exact: true }).click();
  await col.getByRole('button', { name: 'View Lancelot', exact: true }).waitFor({ state: 'visible' });
  check(await db.count() === 0 && await deck.count() === 0, 'Collection must work without either feature page');
 });
 await run('deck-alone-host-callback', async () => {
  await select('Deck Builder module'); await deck.getByRole('heading', { name: deckName, exact: true }).waitFor({ state: 'visible' });
  check(await db.count() === 0 && await col.count() === 0, 'Deck must load its catalog without a Database page');
  check(await deck.getByRole('button', { name: 'Add Cards', exact: true }).count() === 0, 'Read-only host must suppress edit controls');
  check(await tab.playwright.locator('.deck-editor__rail').count() === 0, 'Standalone host must not mount Excelsior chrome');
  await deck.getByRole('button', { name: 'Back to host', exact: true }).click();
  check((await tab.playwright.getByRole('status', { name: 'Host callback result', exact: true }).innerText()).includes('Host received Back'), 'Back must call the host');
  check(await tab.url() === origin.href, 'Host callback must not redirect to an Excelsior route');
 });
 await run('together', async () => {
  await select('All three modules'); await db.getByRole('heading', { name: 'Card Database', exact: true }).waitFor({ state: 'visible' });
  await col.getByRole('heading', { name: 'My Collection', exact: true }).waitFor({ state: 'visible' });
  await deck.getByRole('heading', { name: deckName, exact: true }).waitFor({ state: 'visible' });
 });
 await run('close-detail-and-unmount', async () => {
  await select('Card Database module'); await db.getByRole('searchbox', { name: 'Search cards', exact: true }).fill('Lancelot');
  await db.getByRole('button', { name: 'View Lancelot', exact: true }).waitFor({ state: 'visible' }); await db.getByRole('button', { name: 'View Lancelot', exact: true }).click();
  await db.getByRole('dialog', { name: 'Lancelot details', exact: true }).waitFor({ state: 'visible' });
  await db.getByRole('button', { name: 'Close panel', exact: true }).click();
  await db.getByRole('dialog').waitFor({ state: 'hidden' });
  await select('Unmount modules');
  await db.waitFor({ state: 'hidden' });
  check(await tab.playwright.getByRole('dialog').count() === 0 && await db.count() === 0 && await col.count() === 0 && await deck.count() === 0, 'Unmount must remove modules and their open overlays');
  check(await tab.playwright.evaluate(() => document.body.style.overflow !== 'hidden'), 'Unmount must release scroll locking');
 });
 await run('remount', async () => {
  await select('Card Database module'); await db.getByRole('searchbox', { name: 'Search cards', exact: true }).waitFor({ state: 'visible' });
  check(await db.getByRole('searchbox', { name: 'Search cards', exact: true }).evaluate(el => el.value === ''), 'Remount must not retain a disposed local filter draft');
 });
 const failed = scenarios.filter(s => s.status === 'failed').length;
 const report = { schema: 1, environment: 'local', sourceRevision, deployedRevision: null, url: origin.href, status: failed ? 'failed' : 'passed', scenarios, counts: { passed: scenarios.length - failed, failed, skipped: 0, blocked: 0 }, cleanup: 'Read-only browser actions; no Save, quantity changes or record writes. Detail closed before host controls; modules unmounted and remounted.', acceptance: 'Automated evidence only; Kyle acceptance pending', gaps: ['Fixture component tests cover outage/retry/cancellation independently; no live API outage injected.', 'M6 style containment and M7 packaging remain future work.'] };
 report.reportPath = await writeBrowserReport(directory, report); return report;
}
