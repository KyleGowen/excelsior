// Local account transport checks. Reuses M1 CUA helpers; never writes credentials to evidence.
import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';
const role = (tab, kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
export async function runMilestone2Account({ tab, target, fixture, evidenceDir }) {
  check(target?.verified && target.environment === 'local', 'Verified local target required');
  check(fixture?.ownedFixture === true && fixture.username && fixture.password && /^\/users\/[^/]+\/decks\/[^/]+$/.test(fixture.deckUrl), 'Private owned local fixture required');
  const origin = new URL(target.frontendUrl).origin;
  check(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname), 'Nonlocal target forbidden');
  const report = { schema: 1, kind: 'browser', environment: 'local', sourceRevision: target.sourceRevision, inputFingerprint: target.sourceTreeFingerprint, method: 'CUA live browser automation', scenarios: [], cleanup: { applicationRecords: 'owned fixture retained for Kyle; temporary deck name restored', browser: 'pending; inspect current tab on failure' }, acceptance: 'automated only; Kyle acceptance pending', gaps: ['real Google OAuth unavailable', 'light theme unavailable', 'future host/module UI unavailable'] };
  const capture = name => captureBrowserEvidence(tab, evidenceDir, name);
  let active = 'password-login';
  let originalName;
  let changedName = false;
  try {
    await tab.goto(origin + '/home'); await wait(role(tab, 'heading', 'Welcome to Excelsior'));
    if (await role(tab, 'button', 'Guest').count()) {
      await role(tab, 'button', 'Guest').click(); await role(tab, 'menuitem', 'Log In').click();
      await role(tab, 'textbox', 'Email or Username').fill(fixture.username);
      await role(tab, 'textbox', 'Password Show password').fill(fixture.password);
      await role(tab, 'button', 'Log In').click();
    }
    await wait(role(tab, 'button', fixture.username));
    check(await role(tab, 'textbox', 'Password Show password').count() === 0, 'Login form remains open');
    report.scenarios.push({ id: active, status: 'passed', evidence: await capture('account-home') });
    active = 'owned-deck-save-reload';
    await tab.goto(origin + fixture.deckUrl); await wait(role(tab, 'textbox', 'Deck name'));
    const name = role(tab, 'textbox', 'Deck name'); originalName = await name.getAttribute('value');
    check(originalName === fixture.deckName, 'Fixture deck name mismatch');
    await name.fill(originalName + ' verified'); changedName = true; await role(tab, 'button', 'Save').click(); await wait(role(tab, 'button', 'Saved'));
    await tab.reload(); await wait(name); check(await name.getAttribute('value') === originalName + ' verified', 'Save did not persist');
    await name.fill(originalName); await role(tab, 'button', 'Save').click(); await wait(role(tab, 'button', 'Saved')); changedName = false;
    await tab.reload(); await wait(name); check(await name.getAttribute('value') === originalName, 'Original fixture name not restored');
    report.scenarios.push({ id: active, status: 'passed', evidence: await capture('owned-deck-restored') });
    active = 'account-collection-read';
    await tab.goto(origin + '/users/' + fixture.userId + '/collection'); await wait(role(tab, 'heading', 'My Collection'));
    await role(tab, 'checkbox', 'Owned only').check();
    await wait(role(tab, 'button', /^Characters Lancelot /));
    check(await role(tab, 'textbox', 'Quantity').getAttribute('value') === '1', 'Owned fixture quantity differs');
    const dom = await tab.playwright.domSnapshot(); check(!dom.includes('Stored on this device'), 'Account collection is incorrectly Guest-local');
    report.scenarios.push({ id: active, status: 'passed', evidence: await capture('owned-collection'), observed: { persistedFixtureCard: 'Lancelot', quantitiesChanged: false } });
    active = 'logout-guest-isolation';
    await tab.goto(origin + '/home'); await wait(role(tab, 'button', fixture.username)); await role(tab, 'button', fixture.username).click();
    await role(tab, 'menuitem', 'Log Out').click(); await wait(role(tab, 'button', 'Guest'));
    await role(tab, 'link', 'Collection').click(); await wait(role(tab, 'heading', 'My Collection')); await role(tab, 'checkbox', 'Owned only').check();
    await wait(role(tab, 'heading', 'No cards owned here yet'));
    report.scenarios.push({ id: active, status: 'passed', evidence: await capture('guest-collection-after-logout'), observed: { accountQuantitiesVisibleToGuest: false } });
    await tab.goto(origin + '/home'); await wait(role(tab, 'heading', 'Welcome to Excelsior')); report.status = 'passed'; report.cleanup.browser = 'Guest Home';
  } catch (error) {
    report.status = 'failed'; report.scenarios.push({ id: active, status: 'failed', reason: error.message, evidence: active === 'password-login' ? null : await capture('failure-' + active).catch(() => null) });
    if (changedName && originalName) {
      try { await tab.goto(origin + fixture.deckUrl); await wait(role(tab, 'textbox', 'Deck name')); await role(tab, 'textbox', 'Deck name').fill(originalName); await role(tab, 'button', 'Save').click(); await wait(role(tab, 'button', 'Saved')); }
      catch { report.cleanup.applicationRecords = 'BLOCKED: restore owned fixture name using private manifest'; }
    }
  }
  report.counts = { passed: report.scenarios.filter(s => s.status === 'passed').length, failed: report.scenarios.filter(s => s.status === 'failed').length, skipped: 0, blocked: 0 };
  report.browserErrorCount = (await tab.dev.logs({ levels: ['error'], limit: 50 })).length;
  report.reportPath = await writeBrowserReport(evidenceDir, report); return report;
}
