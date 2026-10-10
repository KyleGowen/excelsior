// Shared CUA scenarios extracted from M1's successful live browser calls.
// Import in cua_repl; no standalone Playwright dependency, Jest discovery, or CI browser runner.
import { blocked, captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';

const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
const role = (tab, kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
async function navigate(tab, url) {
  if (await tab.url() !== url) await tab.goto(url);
}
async function home(tab, origin) {
  await navigate(tab, `${origin}/home`);
  await wait(role(tab, 'heading', 'Welcome to Excelsior'));
}

export const scenarioNames = ['home-guest', 'database-search-detail', 'collection-guest-read', 'deck-readonly-draw-export', 'deck-export-formats', 'deck-import-formats', 'supporter-retired'];

export function validateSelection(target, scenarioIds, actor) {
  check(target?.verified === true, 'Health evidence is required before browser execution');
  check(target.health?.revision === target.expectedRevision, 'Target revision mismatch');
  check(target.health?.status === 'OK' && target.health?.database === 'OK', 'Healthy application and database required');
  check(String(target.health?.migration) === String(target.expectedMigration), 'Target migration mismatch');
  check(['local', 'production'].includes(target.environment), 'Explicit environment required');
  const url = new URL(target.frontendUrl);
  if (target.environment === 'production') check(url.origin === 'https://excelsior.cards', 'Unapproved production origin');
  else check(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.protocol === 'http:', 'Local scenarios require loopback HTTP');
  check(actor === 'guest' || (target.environment === 'local' && actor === 'fictional-account'), 'Select Guest or an isolated local fictional account');
  check(Array.isArray(scenarioIds) && scenarioIds.length > 0 && new Set(scenarioIds).size === scenarioIds.length, 'Select unique scenarios explicitly');
  for (const id of scenarioIds) check(scenarioNames.includes(id), `Unknown scenario: ${id}`);
}

const cases = {
  'home-guest': async ({ tab, origin }) => {
    await home(tab, origin);
    const guest = role(tab, 'button', 'Guest');
    if (!await guest.isVisible()) blocked('Desktop Guest menu unavailable; select the observed mobile Profile workflow or an isolated Guest session');
    await guest.click();
    await wait(role(tab, 'menuitem', 'Log In'));
    const dom = await tab.playwright.domSnapshot();
    check(dom.includes('Create Account') && dom.includes('Sign in with Google'), 'Contextual sign-in options missing');
    await guest.click();
    return { guestEntry: true, contextualAuthControls: true, actualOAuth: 'not executed' };
  },
  'database-search-detail': async ({ tab, origin, options, capture }) => {
    await home(tab, origin);
    await role(tab, 'link', 'Database').click();
    await wait(role(tab, 'heading', 'Card Database'));
    const search = role(tab, 'searchbox', 'Search cards');
    if (!options.skipEmptySearch) {
      await search.fill('unmatched-fictional-baseline');
      await wait(role(tab, 'heading', 'No cards found'));
      await capture('empty');
    }
    const name = options.cardName ?? 'Lancelot';
    await search.fill(name);
    await wait(role(tab, 'button', `View ${name}`));
    await role(tab, 'button', `View ${name}`).click();
    const details = role(tab, 'dialog', `${name} details`);
    await wait(details);
    await tab.getAXState({ emit: false });
    const img = role(tab, 'img', name);
    await wait(img);
    const art = await img.evaluate(image => ({ complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }));
    check(art.complete && art.naturalWidth > 0 && art.naturalHeight > 0, 'Card artwork has not loaded');
    await capture('detail');
    // SlideOutPanel supports Escape. Verify dismissal rather than assuming a
    // coordinate-backed click hit a close button during the entrance animation.
    await details.press('Escape');
    await details.waitFor({ state: 'hidden', timeoutMs: 15000 });
    await wait(role(tab, 'button', `View ${name}`));
    return { emptySearch: options.skipEmptySearch ? 'skipped by selection' : 'passed', cardName: name, artwork: art, detailsClosed: true };
  },
  'collection-guest-read': async ({ tab, origin, options }) => {
    await home(tab, origin);
    await role(tab, 'link', 'Collection').click();
    await wait(role(tab, 'heading', 'My Collection'));
    const dom = await tab.playwright.domSnapshot();
    check(dom.includes('Stored on this device'), 'Expected browser-local Guest collection');
    await role(tab, 'checkbox', 'Owned only').check();
    if (options.expectEmpty === true) await wait(role(tab, 'heading', 'No cards owned here yet'));
    return { storage: 'browser-local', emptyExpected: options.expectEmpty === true, quantitiesChanged: false };
  },
  'deck-readonly-draw-export': async ({ tab, origin, options, capture }) => {
    if (!options.deckUrl || !options.expectedExport || !options.expectedDrawCount) blocked('Select a current public read-only fixture and verified export/draw expectations');
    const url = new URL(options.deckUrl, origin);
    check(url.origin === origin && /^\/users\/[^/]+\/decks\/[^/]+$/.test(url.pathname) && url.searchParams.get('readonly') === 'true', 'Fixture must be a same-origin public read-only deck');
    await navigate(tab, url.href);
    await wait(role(tab, 'button', 'Export'));
    check(await role(tab, 'button', 'Save').count() === 0, 'Read-only fixture exposes Save');
    check(await role(tab, 'textbox', 'Deck name').count() === 0, 'Read-only fixture exposes editable deck name');
    // Evaluation is asynchronous in M3; wait for the current revision's capability.
    await wait(role(tab, 'button', 'Draw Hand').and(tab.playwright.locator(':enabled')));
    await role(tab, 'button', 'Draw Hand').click();
    const dialog = role(tab, 'dialog', 'Drawn Hand');
    await wait(dialog);
    // M1 observed one button per drawn card, plus Draw again and Close panel.
    check(await dialog.getByRole('button').count() === options.expectedDrawCount + 2, 'Draw count differs from selected fixture');
    await role(tab, 'button', 'Draw again').click();
    check(await dialog.getByRole('button').count() === options.expectedDrawCount + 2, 'Redraw count differs from selected fixture');
    await capture('draw');
    await role(tab, 'button', 'Close panel').click();
    await role(tab, 'button', 'Export').click();
    await role(tab, 'button', 'JSON').click();
    const exported = role(tab, 'dialog', 'Export deck JSON');
    await wait(exported);
    await wait(exported.getByRole('button', { name: 'Copy to clipboard', exact: true }).and(tab.playwright.locator(':enabled')));
    const values = await exported.evaluate(el => {
      const value = JSON.parse(el.querySelector('pre').textContent);
      return { total_cards: value.total_cards, total_threat: value.total_threat, reserve_character: value.reserve_character, legal: value.legal };
    });
    for (const [key, value] of Object.entries(options.expectedExport)) check(values[key] === value, `Export ${key} differs from selected fixture`);
    await role(tab, 'button', 'Close panel').click();
    return { drawCount: options.expectedDrawCount, exported: values, recordsChanged: false };
  },
  'deck-export-formats': async ({ tab, origin, options, capture }) => {
    if (!options.deckUrl || !options.expectedExport || !options.expectedTopDeckLines) blocked('Select a read-only fixture and verified export expectations');
    // IAB's clipboard bridge may be empty after a native app copy. A caller can
    // supply read-back through a test-owned local paste field instead.
    const readClipboard = options.readClipboardText ?? (() => tab.clipboard.readText());
    const url = new URL(options.deckUrl, origin);
    check(url.origin === origin && /^\/users\/[^/]+\/decks\/[^/]+$/.test(url.pathname) && url.searchParams.get('readonly') === 'true', 'Fixture must be a same-origin public read-only deck');
    await navigate(tab, url.href);
    await wait(role(tab, 'button', 'Export'));
    check(await role(tab, 'button', 'Save').count() === 0, 'Read-only fixture exposes Save');
    await role(tab, 'button', 'Export').click();
    const initialTopDeckDialog = role(tab, 'dialog', 'Export deck TopDeck');
    await wait(initialTopDeckDialog);
    check(await role(tab, 'button', 'TopDeck').getAttribute('aria-pressed') === 'true', 'TopDeck must be the default');
    await wait(role(tab, 'button', 'JSON').and(tab.playwright.locator(':enabled')));
    await role(tab, 'button', 'JSON').click();
    const jsonDialog = role(tab, 'dialog', 'Export deck JSON');
    await wait(jsonDialog);
    check(await role(tab, 'button', 'JSON').getAttribute('aria-pressed') === 'true', 'JSON must remain selectable');
    const jsonText = await jsonDialog.locator('pre').innerText();
    const values = JSON.parse(jsonText);
    for (const [key, value] of Object.entries(options.expectedExport)) check(values[key] === value, `Export ${key} differs from selected fixture`);
    await capture('json');
    await role(tab, 'button', 'Copy to clipboard').click();
    await wait(role(tab, 'button', 'Copied!'));
    check(await readClipboard() === jsonText, 'JSON clipboard differs from its preview');
    await role(tab, 'button', 'TopDeck').click();
    const topDeckDialog = role(tab, 'dialog', 'Export deck TopDeck');
    await wait(topDeckDialog);
    check(await role(tab, 'button', 'TopDeck').getAttribute('aria-pressed') === 'true', 'TopDeck must be selected');
    await wait(role(tab, 'button', 'Copy to clipboard'));
    const topDeckText = await topDeckDialog.locator('pre').innerText();
    for (const line of options.expectedTopDeckLines) check(topDeckText.split('\n').includes(line), `TopDeck line missing: ${line}`);
    for (const line of options.absentTopDeckLines ?? []) check(!topDeckText.split('\n').includes(line), `Unexpected TopDeck line: ${line}`);
    check(!topDeckText.startsWith('~Deck') && !topDeckText.startsWith('{'), 'TopDeck must be a published-style text list');
    await capture('topdeck');
    await role(tab, 'button', 'Copy to clipboard').click();
    await wait(role(tab, 'button', 'Copied!'));
    check(await readClipboard() === topDeckText, 'TopDeck clipboard differs from its preview');
    await role(tab, 'button', 'JSON').click();
    await wait(jsonDialog);
    await wait(role(tab, 'button', 'Copy to clipboard'));
    // Catalog refreshes can rebuild the existing JSON export timestamp.
    const { export_timestamp: initialTimestamp, ...initialDeck } = values;
    const { export_timestamp: switchedTimestamp, ...switchedDeck } = JSON.parse(await jsonDialog.locator('pre').innerText());
    check(Number.isFinite(Date.parse(initialTimestamp)) && Number.isFinite(Date.parse(switchedTimestamp)), 'Export timestamp invalid');
    check(JSON.stringify(switchedDeck) === JSON.stringify(initialDeck), 'Switching formats changed JSON deck data');
    await jsonDialog.press('Escape');
    await jsonDialog.waitFor({ state: 'hidden', timeoutMs: 15000 });
    await role(tab, 'button', 'Export').click();
    await wait(topDeckDialog);
    check(await role(tab, 'button', 'TopDeck').getAttribute('aria-pressed') === 'true', 'Reopened export must default to TopDeck');
    return { topDeckDefault: true, formats: ['JSON', 'TopDeck'], copyFeedback: 'both formats; cleared on switch', clipboardMatchesPreview: true, clipboardReadBack: options.readClipboardText ? 'caller-selected local paste field' : 'browser clipboard', jsonPreserved: true, recordsChanged: false };
  },
  'deck-import-formats': async ({ tab, origin, options, capture }) => {
    if (!options.decksPath) blocked('Select the current actor’s deck-list path; no session changes are permitted');
    const url = new URL(options.decksPath, origin);
    check(url.origin === origin && /^\/users\/[^/]+\/decks$/.test(url.pathname), 'Select a same-origin deck-list path');
    await navigate(tab, url.href);
    const open = role(tab, 'button', 'Import Deck');
    await wait(open);
    await open.click();
    const dialog = role(tab, 'dialog', 'Import deck from JSON or TopDeck');
    await wait(dialog);
    const field = name => dialog.getByRole('textbox', { name, exact: true });
    const topDeck = dialog.getByRole('button', { name: 'TopDeck', exact: true });
    const json = dialog.getByRole('button', { name: 'JSON', exact: true });
    check(await topDeck.getAttribute('aria-pressed') === 'true', 'Import must default to TopDeck');
    check(!await dialog.getByRole('button', { name: 'Import deck', exact: true }).isEnabled(), 'Empty import must be disabled');
    await field('TopDeck decklist').fill('-- Other Cards --\n1x Cheshire Cat [ERB]');
    await field('Deck name').fill('Import selector example');
    await capture('topdeck');
    await json.click();
    check(await json.getAttribute('aria-pressed') === 'true', 'JSON is not selected');
    check(await field('Deck JSON').evaluate(el => el.value) === '-- Other Cards --\n1x Cheshire Cat [ERB]', 'Switching lost the pasted list');
    check(await field('Deck name').evaluate(el => el.value) === 'Import selector example', 'Switching lost the deck name');
    await field('Deck JSON').fill('{"name":"JSON selector example","cards":{"characters":["Zeus"]}}');
    check(await field('Deck name').evaluate(el => el.value) === 'JSON selector example', 'JSON name did not populate');
    check(await dialog.getByRole('button', { name: 'Import deck', exact: true }).isEnabled(), 'Pasted import must be enabled');
    await capture('json');
    // Escape dismisses the drawer even if the app header overlaps its close icon.
    await dialog.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeoutMs: 15000 });
    await open.click();
    await wait(dialog);
    await wait(topDeck.and(tab.playwright.locator('[aria-pressed="true"]')));
    check(await topDeck.getAttribute('aria-pressed') === 'true', 'Reopened import must default to TopDeck');
    check(await field('TopDeck decklist').evaluate(el => el.value) === '', 'Reopened import retained the previous list');
    let resolutionChecked = false;
    if (options.validationDecklist) {
      check(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Catalog resolution probe is local-only');
      // The unknown sentinel forces resolution to fail before any deck creation.
      // The caller must verify that this sentinel is absent from the target catalog.
      const sentinel = 'Codex Unresolvable Validation Sentinel';
      await field('TopDeck decklist').fill(`${options.validationDecklist}\n-- Other Cards --\n1x ${sentinel}`);
      await dialog.getByRole('button', { name: 'Import deck', exact: true }).click();
      const alert = dialog.getByRole('alert');
      await wait(alert);
      const error = await alert.innerText();
      check(error.includes(`${sentinel} (aspect)`), 'Expected unknown validation sentinel');
      check(!error.includes('(ambiguous)'), 'Real catalog cards still have conflicting matches');
      check(error.trim().split('Unresolved cards:')[1]?.trim() === `${sentinel} (aspect)`, 'A decklist card was unresolved');
      await capture('catalog-resolution');
      resolutionChecked = true;
    }
    // Escape dismisses the drawer even if the app header overlaps its close icon.
    await dialog.press('Escape');
    return { topDeckDefault: true, jsonSelectable: true, textAndNameRetainedOnSwitch: true, jsonNamePopulates: true, resetOnReopen: true, resolutionChecked, submitted: resolutionChecked ? 'resolution-only failure probe' : false, recordsChanged: false };
  },
  'supporter-retired': async ({ tab, origin }) => {
    await navigate(tab, `${origin}/supporter`);
    await wait(role(tab, 'heading', 'Welcome to Excelsior'));
    check(new URL(await tab.url()).pathname === '/home', 'Retired route did not redirect Home');
    const result = await tab.playwright.evaluate(() => ({ text: /supporter/i.test(document.body.innerText), links: Array.from(document.querySelectorAll('a[href]')).filter(a => a.getAttribute('href')?.includes('/supporter')).length }));
    check(!result.text && result.links === 0, 'Shelved Supporter visible');
    return { redirectedHome: true, supporterVisible: false, retiredApi: 'separate API check required' };
  },
};

export async function runMilestone1({ tab, target, scenarioIds, actor, evidenceDir, options = {}, dimensions, viewport, capturePolicy = 'all', comparison = false }) {
  validateSelection(target, scenarioIds, actor);
  if (!evidenceDir) throw new Error('Choose a fresh evidence directory');
  check(['all', 'failure'].includes(capturePolicy), 'Choose all or failure capture policy');
  check(!comparison || capturePolicy === 'all', 'Before/after comparisons require all screenshot captures');
  const started = Date.now();
  const origin = new URL(target.frontendUrl).origin;
  const report = { schema: 1, kind: 'browser', environment: target.environment, sourceRevision: target.sourceRevision, deployedRevision: target.environment === 'production' ? target.health?.revision : null,
    inputFingerprint: target.sourceTreeFingerprint, selectedScenarios: scenarioIds, capturePolicy, comparison,
    target, actor, theme: 'fixed dark', method: 'CUA live browser automation', scenarios: [], cleanup: { applicationRecords: 'unchanged; read-only scenarios', browser: 'pending' }, acceptance: 'automated evidence only; Kyle acceptance not inferred', gaps: ['light theme unavailable in M1', 'Google OAuth not exercised', 'independent module harness unavailable in M1'] };
  try {
    if (dimensions) {
      if (!viewport) throw new Error('Viewport capability required for requested dimensions');
      await viewport.set(dimensions);
      const actual = await tab.playwright.evaluate(() => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }));
      check(actual.width === dimensions.width && actual.height === dimensions.height, 'Requested viewport did not apply to this tab');
      report.viewport = actual;
    }
    if (target.environment === 'production') {
      await home(tab, origin);
      if (!await role(tab, 'button', 'Guest').isVisible()) blocked('Production subset requires a Guest session; do not sign out a real account automatically');
    }
    for (const id of scenarioIds) {
      const result = { id, status: 'passed', evidence: [] };
      const capture = async suffix => { if (capturePolicy === 'failure' && result.status === 'passed') return null; await tab.getAXState({ emit: false }); const item = await captureBrowserEvidence(tab, evidenceDir, `${id}-${suffix}`); result.evidence.push(item); return item; };
      try {
        if (['home-guest', 'collection-guest-read'].includes(id) && actor !== 'guest') blocked('Scenario requires Guest; account-session validation is a separate local case');
        result.observed = await cases[id]({ tab, origin, options, capture });
        check(new URL(await tab.url()).origin === origin, 'Browser left the selected target');
        await capture('result');
      } catch (error) {
        result.status = error.browserResult ?? 'failed'; result.reason = error.message;
        if (new URL(await tab.url()).origin === origin) {
          try { await capture('failure'); } catch (captureError) { result.evidenceGap = captureError.message; }
        }
      }
      report.scenarios.push(result);
      // Stop after first failure rather than continuing against unknown state.
      if (result.status !== 'passed') break;
    }
    for (const id of scenarioIds) if (!report.scenarios.some(result => result.id === id)) report.scenarios.push({ id, status: 'blocked', reason: 'Earlier scenario failed or was blocked' });
    report.browserErrorCount = (await tab.dev.logs({ levels: ['error'], limit: 100 })).length;
    if (report.browserErrorCount) report.gaps.push('Inspect and redact browser errors before declaring pass; error count alone does not classify them');
  } catch (error) {
    report.setup = { status: error.browserResult ?? 'failed', reason: error.message };
    for (const id of scenarioIds) if (!report.scenarios.some(result => result.id === id)) report.scenarios.push({ id, status: 'blocked', reason: 'Browser setup incomplete' });
  } finally {
    if (dimensions && viewport) {
      try { await viewport.reset(); report.cleanup.viewport = 'reset'; } catch { report.cleanup.viewport = 'blocked; reset required'; }
    }
    try { await home(tab, origin); report.cleanup.browser = 'returned Home; close this test-owned tab or mark handoff explicitly'; } catch { report.cleanup.browser = 'blocked; inspect test-owned tab'; }
  }
  report.status = !report.setup && report.scenarios.every(result => result.status === 'passed') && report.browserErrorCount === 0 && !Object.values(report.cleanup).some(value => String(value).startsWith('blocked')) ? 'passed' : 'needs review';
  report.durationSeconds = (Date.now() - started) / 1000;
  report.counts = Object.fromEntries(['passed', 'failed', 'skipped', 'blocked'].map(status => [status, report.scenarios.filter(result => result.status === status).length]));
  report.reportPath = await writeBrowserReport(evidenceDir, report);
  return report;
}
