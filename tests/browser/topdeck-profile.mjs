import { check, captureBrowserEvidence, writeBrowserReport } from '../helpers/browserEvidence.mjs';

/** Live local account writes require an explicitly supplied, disposable fixture. */
export async function runTopDeckProfile({ tab, target, fixture, unsetUser, viewport, dimensions, evidenceDir }) {
  const origin = new URL(await tab.url()).origin;
  check(target.verified && target.environment === 'local', 'A verified local target is required');
  check(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Never mutate production accounts');
  check(fixture.id && fixture.username && fixture.password && unsetUser.id, 'Explicit fictional fixture required');
  const report = { environment: 'disposable-local', sourceRevision: target.sourceRevision,
    inputFingerprint: target.sourceTreeFingerprint, dimensions, status: 'failed', cases: [], captures: [],
    cleanup: 'fixture handle cleared by scenario; run-owned database retained until caller teardown',
    gaps: ['Real TopDeck ownership and Google OAuth are not exercised'], acceptance: 'automated evidence only' };
  const role = (name, type = 'button') => tab.playwright.getByRole(type, { name, exact: true });
  const capture = async name => report.captures.push(await captureBrowserEvidence(tab, evidenceDir, name));
  const openMenu = async () => {
    const mobile = dimensions.width <= 900;
    await role(mobile ? 'Profile' : fixture.username).click();
    await role('Log Out', 'menuitem').waitFor({ state: 'visible' });
  };
  const login = async () => {
    await role(dimensions.width <= 900 ? 'Profile' : 'Guest').click();
    await role('Log In', 'menuitem').click();
    await role('Email or Username', 'textbox').fill(fixture.username);
    await tab.playwright.getByLabel('Password', { exact: true }).fill(fixture.password);
    await role('Log In').click();
    await role('Log In', 'menuitem').waitFor({ state: 'hidden' });
  };
  const saved = handle => role(`TopDeck: @${handle}`, 'link');
  try {
    await viewport.set(dimensions);
    await tab.reload();
    const actual = await tab.playwright.evaluate(() => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }));
    check(actual.width === dimensions.width && actual.height === dimensions.height, 'Actual viewport does not match the selected size');
    // The caller signs in the known fictional fixture before invoking this suite.
    await openMenu();
    check(await role('Add TopDeck Account', 'menuitem').isVisible(), 'Fixture must start without a handle');
    check(await tab.playwright.getByRole('link', { name: /^TopDeck: @/ }).count() === 0, 'Unset account shows no link');
    await capture('unset-account'); report.cases.push('unset account omits profile line');
    await role('Add TopDeck Account', 'menuitem').click();
    await role('TopDeck handle', 'textbox').fill('https://invalid.example/profile');
    await role('Save').click();
    await tab.playwright.getByRole('alert').waitFor({ state: 'visible' });
    check((await tab.playwright.getByRole('alert').innerText()).includes('not a URL'), 'Invalid URL feedback missing');
    report.cases.push('invalid URL rejected');
    await role('TopDeck handle', 'textbox').fill('  @ExcelsiorExample  ');
    await role('Save').click();
    await saved('ExcelsiorExample').waitFor({ state: 'visible' });
    check(await saved('ExcelsiorExample').getAttribute('href') === 'https://topdeck.gg/profile/@ExcelsiorExample', 'Wrong normalized URL');
    check(await saved('ExcelsiorExample').getAttribute('target') === '_blank', 'Link must open separately');
    check((await saved('ExcelsiorExample').getAttribute('rel')).includes('noreferrer'), 'Missing external link protection');
    await capture('saved-account'); report.cases.push('save normalizes handle and creates safe link');
    await tab.reload(); await openMenu();
    await saved('ExcelsiorExample').waitFor({ state: 'visible' });
    report.cases.push('handle persists after reload');
    await role('Edit TopDeck Account', 'menuitem').click();
    await role('TopDeck handle', 'textbox').fill('CancelledChange');
    await role('Cancel').click();
    check(await saved('ExcelsiorExample').isVisible(), 'Cancel changed saved handle');
    report.cases.push('cancel preserves saved value');
    await role('Edit TopDeck Account', 'menuitem').click();
    await role('TopDeck handle', 'textbox').fill('@ExcelsiorUpdated');
    await role('Save').click();
    await saved('ExcelsiorUpdated').waitFor({ state: 'visible' });
    await capture('edited-account'); report.cases.push('edit replaces link');
    await role('Log Out', 'menuitem').click();
    await tab.goto(`${origin}/users/${fixture.id}/decks`);
    await tab.playwright.getByRole('heading', { name: `${fixture.username}'s Decks`, exact: true }).waitFor({ state: 'visible' });
    await saved('ExcelsiorUpdated').waitFor({ state: 'visible' });
    check(await tab.playwright.getByText('No public decks yet', { exact: true }).isVisible(), 'Expected zero public decks');
    await capture('public-linked-no-decks'); report.cases.push('guest sees saved handle without public decks');
    await tab.goto(`${origin}/users/${unsetUser.id}/decks`);
    await tab.playwright.getByRole('heading', { name: `${unsetUser.username}'s Decks`, exact: true }).waitFor({ state: 'visible' });
    check(await tab.playwright.getByRole('link', { name: /^TopDeck: @/ }).count() === 0, 'Unset public profile exposes a handle');
    await capture('public-unset-no-decks'); report.cases.push('unset public profile omits line');
    await login(); await openMenu();
    await saved('ExcelsiorUpdated').waitFor({ state: 'visible' });
    report.cases.push('handle persists after fresh login');
    await role('Edit TopDeck Account', 'menuitem').click();
    await role('Remove').click();
    await role('Add TopDeck Account', 'menuitem').waitFor({ state: 'visible' });
    check(await tab.playwright.getByRole('link', { name: /^TopDeck: @/ }).count() === 0, 'Removed account link still visible');
    await role('Log Out', 'menuitem').click();
    await tab.goto(`${origin}/users/${fixture.id}/decks`);
    await tab.playwright.getByRole('heading', { name: `${fixture.username}'s Decks`, exact: true }).waitFor({ state: 'visible' });
    check(await tab.playwright.getByRole('link', { name: /^TopDeck: @/ }).count() === 0, 'Removed public link still visible');
    await capture('removed-public-profile'); report.cases.push('removal clears owner and public links');
    report.status = 'passed';
  } catch (error) {
    report.error = error.message;
    try { await capture('failure'); } catch { /* Preserve the original error. */ }
  } finally {
    await viewport.reset();
    report.reportPath = await writeBrowserReport(evidenceDir, report);
  }
  return report;
}
