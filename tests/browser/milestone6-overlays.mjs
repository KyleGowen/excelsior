import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';
/** Local-only, read-only overlay checks. Verify the UI/API/data target before calling. */
export async function runHostOverlayCases(tab, { directory, target, deckId, deckName }) {
 check(target?.verified && target.environment === 'local', 'Verified local health required');
 const origin = new URL(await tab.url());
 check(['localhost', '127.0.0.1'].includes(origin.hostname) && origin.pathname === '/module-harness.html', 'Use the independent local harness');
 const role = (kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
 const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
 const scenarios = [];
 const capture = id => captureBrowserEvidence(tab, directory, id);
 const run = async (id, action) => { const result = { id, status: 'passed', evidence: [] }; try { result.observed = await action(suffix => capture(id + '-' + suffix).then(item => result.evidence.push(item))); result.evidence.push(await capture(id + '-result')); } catch (error) { result.status = 'failed'; result.reason = error.message; result.evidence.push(await capture(id + '-failure')); } scenarios.push(result); };
 const select = async name => { await role('button', name).click(); await wait(role('button', name).and(tab.playwright.locator('[aria-pressed="true"]'))); };
 const dialog = () => role('dialog', 'Lancelot details');
 const open = async () => { await role('button', 'View Lancelot').click(); await wait(dialog()); };
 await role('checkbox', 'Use host overlay root').check();
 await role('textbox', 'Local deck ID').fill(deckId);
 check(await role('checkbox', 'Read-only deck').evaluate(e => e.checked), 'Deck must remain read-only');
 const documentState = await tab.playwright.evaluate(() => ({ html: document.documentElement.className, body: document.body.getAttribute('style') }));
 await run('host-placement-and-image', async capture => {
  await select('Card Database module'); await role('searchbox', 'Search cards').fill('Lancelot'); await wait(role('button', 'View Lancelot')); await open();
  check(await dialog().evaluate(e => !!e.closest('[aria-label="Host overlay root"]')), 'Panel must be inside its declared host root');
  const bounds = await dialog().evaluate(e => { const panel = e.getBoundingClientRect(); const root = e.closest('[aria-label="Host overlay root"]').getBoundingClientRect(); return { panel: { left: panel.left, right: panel.right, top: panel.top, bottom: panel.bottom }, root: { left: root.left, right: root.right, top: root.top, bottom: root.bottom } }; });
  // Entrance transforms are transient; the final screenshot/settled geometry below is separate.
  await wait(dialog().getByRole('img', { name: 'Lancelot', exact: true }));
  check(await dialog().getByRole('img', { name: 'Lancelot', exact: true }).evaluate(e => e.complete && e.naturalWidth > 0), 'Real card image must load');
  await capture('open');
  const settled = await dialog().evaluate(e => { const p = e.getBoundingClientRect(); const r = e.closest('[aria-label="Host overlay root"]').getBoundingClientRect(); return { contained: p.left >= r.left - 1 && p.right <= r.right + 1 && p.top >= r.top - 1 && p.bottom <= r.bottom + 1 }; });
  check(settled.contained, 'Settled panel must stay inside host bounds');
  await dialog().press('Escape'); await dialog().waitFor({ state: 'hidden' });
  check(await role('button', 'View Lancelot').evaluate(e => document.activeElement === e), 'Close must restore card-trigger focus');
  return { bounds, settled, recordsChanged: false };
 });
 if (scenarios.at(-1).status === 'passed') await run('host-keyboard-focus', async () => {
  await open(); const controls = await dialog().getByRole('button').and(tab.playwright.locator(':enabled')).all();
  check(controls.length > 0, 'Expected keyboard controls');
  await role('button', 'Close panel').press('Shift+Tab');
  check(await controls.at(-1).evaluate(e => document.activeElement === e), 'Shift+Tab must wrap to last enabled action');
  await controls.at(-1).press('Tab');
  check(await role('button', 'Close panel').evaluate(e => document.activeElement === e), 'Tab must wrap to first action');
  await dialog().press('Escape'); await dialog().waitFor({ state: 'hidden' }); return { focusWrapped: true, restored: await role('button', 'View Lancelot').evaluate(e => document.activeElement === e) };
 });
 if (scenarios.at(-1).status === 'passed') await run('host-unmount-open-panel', async () => {
  await open(); await select('Unmount modules');
  check(await role('dialog', 'Lancelot details').count() === 0, 'Unmount must clear the portaled detail');
  check(await role('region', 'Host overlay root').evaluate(e => e.children.length === 0), 'Host root must be empty after unmount');
  const after = await tab.playwright.evaluate(() => ({ html: document.documentElement.className, body: document.body.getAttribute('style') }));
  check(JSON.stringify(after) === JSON.stringify(documentState), 'Overlay lifecycle must not change document/body attributes');
  await select('Card Database module'); await wait(role('searchbox', 'Search cards')); check(await role('searchbox', 'Search cards').evaluate(e => e.value === ''), 'Remount must be fresh');
  return { portalCleared: true, attributesUnchanged: true, remounted: true };
 });
 if (scenarios.at(-1).status === 'passed') await run('host-deck-draw-export', async () => {
  await select('Deck Builder module'); await wait(role('heading', deckName)); await wait(role('button', 'Draw Hand').and(tab.playwright.locator(':enabled')));
  await role('button', 'Draw Hand').click(); const drawn = role('dialog', 'Drawn Hand'); await wait(drawn);
  check(await drawn.evaluate(e => !!e.closest('[aria-label="Host overlay root"]')), 'Draw Hand must use host portal');
  check(await drawn.getByRole('button').count() === 10, 'Fictional fixture must draw eight cards');
  await role('button', 'Close panel').click(); await role('button', 'Export').click(); const exported = role('dialog', 'Export deck JSON'); await wait(exported);
  check(await exported.evaluate(e => !!e.closest('[aria-label="Host overlay root"]')), 'Export must use host portal');
  const values = await exported.evaluate(e => { const data = JSON.parse(e.querySelector('pre').textContent); return { cards: data.total_cards, threat: data.total_threat }; });
  check(values.cards === 8 && values.threat === 18, 'Fixture export values must stay unchanged');
  await role('button', 'Close panel').click(); return { drawCount: 8, exported: values, recordsChanged: false };
 });
 const ids = ['host-placement-and-image', 'host-keyboard-focus', 'host-unmount-open-panel', 'host-deck-draw-export'];
 for (const id of ids) if (!scenarios.some(s => s.id === id)) scenarios.push({ id, status: 'blocked', reason: 'Earlier overlay scenario failed' });
 const browserErrors = (await tab.dev.logs({ levels: ['error'], limit: 100 })).length;
 const counts = Object.fromEntries(['passed','failed','skipped','blocked'].map(status => [status, scenarios.filter(s => s.status === status).length]));
 const report = { schema: 1, environment: 'local', sourceRevision: target.sourceRevision, target, url: origin.href, scenarios, counts, browserErrors, status: counts.failed === 0 && counts.blocked === 0 && browserErrors === 0 ? 'passed' : 'needs review', cleanup: 'Read-only fixture; no Save/quantity writes; panels closed, host root cleared during unmount, module remounted; preview retained.', acceptance: 'Kyle acceptance pending', gaps: ['Full style containment/container layout/theme/brand/auth/action configuration remains M6 backlog.', 'No production M6 tests; no light theme/OAuth; independent simultaneous roots covered by component fixtures.'] };
 report.reportPath = await writeBrowserReport(directory, report); return report;
}
