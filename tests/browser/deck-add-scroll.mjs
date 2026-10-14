import { check, captureBrowserEvidence, writeBrowserReport } from '../helpers/browserEvidence.mjs';

/** Caller creates/deletes the named local Guest fixture. All card edits remain unsaved. */
export async function runAddCardsScroll({ tab, target, evidenceDir, deckName, expectedLayout, ownedFixtureConfirmed }) {
  check(target.verified && target.environment === 'local' && ownedFixtureConfirmed, 'Verified local target and owned fixture required');
  check(new URL(await tab.url()).origin === target.frontendUrl, 'Browser origin differs from the verified local target');
  await tab.reload();
  const role = (kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
  await role('textbox', 'Deck name').waitFor({ state: 'visible' });
  check(await role('textbox', 'Deck name').evaluate(element => element.value) === deckName, 'Only the named disposable deck may be edited');
  const viewport = await tab.playwright.evaluate(() => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight, layout: document.documentElement.className }));
  check(viewport.layout.split(/\s+/).includes(`layout-${expectedLayout}`), 'Rendered layout differs from the selected case');
  await role('button', 'Add Cards').first().click();
  const dialog = role('dialog', 'Add cards');
  await dialog.getByRole('button', { name: 'Add to deck', exact: true }).first().and(tab.playwright.locator(':enabled')).waitFor({ state: 'visible' });
  await tab.scroll([viewport.width - Math.min(140, viewport.width / 3), viewport.height / 2], 'down', 1);
  await tab.getAXState({ emit: false });
  const visibleCard = await dialog.evaluate(element => {
    const header = element.querySelector('.slideout__header').getBoundingClientRect();
    const footer = element.querySelector('.slideout__footer').getBoundingClientRect();
    const cards = [...element.querySelectorAll('.add-cards .card-tile__art')];
    const card = cards.find(card => { const rect = card.getBoundingClientRect(); return rect.top > header.bottom && rect.bottom < footer.top; });
    return card?.getAttribute('aria-label');
  });
  check(visibleCard, 'No fully visible card found in the scrolled results');
  const tile = dialog.getByRole('button', { name: visibleCard, exact: true });
  const scroll = async () => dialog.evaluate(element => {
    const results = element.querySelector('.add-cards');
    const body = element.querySelector('.slideout__body');
    const scroller = results.scrollHeight > results.clientHeight ? results : body;
    return { top: scroller.scrollTop, height: scroller.clientHeight, fullHeight: scroller.scrollHeight };
  });
  const report = { schema: 1, kind: 'browser', environment: 'local', sourceRevision: target.sourceRevision, sourceFingerprint: target.sourceTreeFingerprint,
    actor: 'guest', theme: 'fixed dark', viewport, card: visibleCard, scenarios: [], evidence: [], focusPreparation: 'Focus the control before measuring to exclude automation focus scrolling',
    acceptance: 'Automated only; Kyle acceptance separate', cleanup: 'Unsaved card edits; caller deletes only the named Guest session fixture' };
  const capture = async name => {
    const evidence = await captureBrowserEvidence(tab, evidenceDir, name);
    evidence.url = new URL(evidence.url).origin + '/[owned-guest-fixture]';
    report.evidence.push(evidence);
  };
  try {
    for (const [id, controlName, settledControl] of [
      ['art-add', null, 'Increase'],
      ['quantity-increase', 'Increase', 'Increase'],
      ['quantity-decrease', 'Decrease', 'Increase'],
      ['remove-last-copy', 'Decrease', 'Add to deck'],
    ]) {
      const control = controlName ? tile.getByRole('button', { name: controlName, exact: true }) : tile;
      await control.press('Shift');
      const before = await scroll();
      check(before.top > 100, 'Case must begin in a genuinely scrolled list');
      await capture(`${id}-before`);
      await control.click();
      await tile.getByRole('button', { name: settledControl, exact: true }).and(tab.playwright.locator(':enabled')).waitFor({ state: 'visible' });
      const after = await scroll();
      await capture(`${id}-after`);
      check(Math.abs(after.top - before.top) <= 1, `${id} changed scroll from ${before.top} to ${after.top}`);
      report.scenarios.push({ id, status: 'passed', before, after });
    }
  } catch (error) {
    report.scenarios.push({ id: 'scroll-preservation', status: 'failed', reason: error.message });
    await capture('failure');
  }
  report.browserErrorCount = (await tab.dev.logs({ levels: ['error'], limit: 20 })).length;
  report.status = report.scenarios.length === 4 && report.scenarios.every(scenario => scenario.status === 'passed') ? 'passed' : 'failed';
  report.reportPath = await writeBrowserReport(evidenceDir, report);
  return report;
}
