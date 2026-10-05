import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';

/** Real local Guest-copy saves; rejection is an explicitly injected host fixture, not a backend outage. */
export async function runSaveFeedbackCase(tab, { target, sourceDeckId, evidenceDir, hostFeedback = false, mobile = false }) {
 check(target?.verified && target.environment === 'local' && target.frontendSource?.revision, 'Verified local sources required');
 const origin = new URL(target.frontendUrl).origin;
 check(new URL(await tab.url()).origin === origin && new URL(await tab.url()).pathname === '/module-harness.html', 'Intended local harness required');
 check(/^[a-f0-9-]{36}$/.test(sourceDeckId) && evidenceDir.startsWith('/private/tmp/'), 'Fictional source deck and private ownership tracking required');
 const role = (kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
 const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
 const nameInput = role('textbox', 'Deck name');
 const save = role('button', 'Save');
 const feedback = status => role(status === 'error' ? 'alert' : 'status', 'Host save feedback');
 const result = { id: hostFeedback ? 'host-save-feedback' : 'default-save-feedback', status: 'passed', evidence: [] };
 const started = Date.now();
 try {
  await wait(role('heading', 'Independent module harness'));
  check((await tab.playwright.domSnapshot()).includes('Host identity: Guest.'), 'Isolated Guest host required');
  await role('checkbox', 'Use host save feedback').setChecked(hostFeedback);
  await role('checkbox', 'Read-only deck').check();
  await role('combobox', 'Save fixture mode').selectOption('api');
  await role('textbox', 'Local deck ID').fill(sourceDeckId);
  await role('button', 'Deck Builder module').click(); await wait(role('button', 'Export'));
  check(await save.count() === 0 && await nameInput.count() === 0, 'Read-only source exposes editing');
  await role('checkbox', 'Read-only deck').uncheck();
  await wait(tab.playwright.locator('input[type="password"]')); await wait(nameInput);
  check(await tab.playwright.getByLabel('Local deck ID', { exact: true }).getAttribute('type') === 'password', 'Expected a masked session-only copy, not source mutation');
  check((await tab.playwright.domSnapshot()).includes('Host opened deck'), 'Host did not receive the completed Guest copy');
  // IDs encode session identity and are intentionally unreadable in browser tools.
  // Caller uses a before/after private API inventory to track only run-owned copies.
  const prefix = `M6 Save Feedback ${hostFeedback ? 'Host' : 'Default'} ${mobile ? 'Mobile' : 'Desktop'}`;
  await nameInput.fill(prefix); await save.click();
  if (hostFeedback) await wait(feedback('saved')); else await wait(role('button', 'Saved'));
  check(await nameInput.isVisible(), 'A name save discarded Guest owner controls');
  check(await nameInput.evaluate(el => el.value) === prefix, 'Saved name not retained');
  result.evidence.push(await captureBrowserEvidence(tab, evidenceDir, 'saved-result'));
  if (hostFeedback) {
   await role('checkbox', 'Use host save feedback').uncheck();
   check(await nameInput.isVisible() && await nameInput.evaluate(el => el.value) === prefix, 'Feedback omission removed editor');
   check(await feedback('saved').count() === 0 && await role('button', 'Saved').isVisible(), 'Omission did not restore ordinary controls');
   await role('checkbox', 'Use host save feedback').check();
   await role('combobox', 'Save fixture mode').selectOption('delayed');
   await nameInput.fill(`${prefix} captured`); await save.click(); await wait(feedback('saving'));
   check(await role('button', 'Saving...').evaluate(el => el.disabled), 'Pending save permits duplicate Save');
   await nameInput.fill(`${prefix} newer`);
   result.evidence.push(await captureBrowserEvidence(tab, evidenceDir, 'pending-newer-edit'));
   await wait(tab.playwright.getByText('Fictional host: Saved; newer edits pending', { exact: true }));
   check(await nameInput.evaluate(el => el.value) === `${prefix} newer` && await save.isEnabled(), 'Newer edits lost or marked clean');
   result.evidence.push(await captureBrowserEvidence(tab, evidenceDir, 'saved-newer-edits'));
   await role('combobox', 'Save fixture mode').selectOption('rejected');
   await nameInput.fill(`${prefix} rejected`); await save.click(); await wait(feedback('error'));
   check(await feedback('error').getAttribute('data-save-status') === 'error', 'Failure misreported as saved');
   check(await nameInput.evaluate(el => el.value) === `${prefix} rejected` && await save.isEnabled(), 'Rejection discarded retryable edits');
   result.evidence.push(await captureBrowserEvidence(tab, evidenceDir, 'injected-rejection'));
   await role('combobox', 'Save fixture mode').selectOption('api'); await save.click(); await wait(feedback('saved'));
   check(await nameInput.isVisible(), 'Retry discarded owner editor');
  } else {
   await nameInput.fill(`${prefix} second`); await save.click(); await wait(role('button', 'Saved'));
   check(await nameInput.isVisible(), 'Second save discarded Guest owner controls');
  }
  await role('button', 'Card Database module').press('Enter');
  await role('region', 'Independent Deck Builder').waitFor({ state: 'hidden', timeoutMs: 15000 });
  await wait(role('searchbox', 'Search cards'));
  await role('button', 'Deck Builder module').press('Enter'); await wait(nameInput);
  check(await nameInput.evaluate(el => el.value) === `${prefix} ${hostFeedback ? 'rejected' : 'second'}`, 'Remounted editor did not read the real saved name');
  await role('checkbox', 'Read-only deck').check(); await wait(role('button', 'Export'));
  check(await nameInput.count() === 0 && await save.count() === 0, 'Host feedback bypassed read-only permission');
  check(await feedback('saved').count() === 0 && await feedback('error').count() === 0, 'Read-only view retained host write feedback');
  await role('button', 'Unmount modules').press('Enter');
  await wait(role('button', 'Unmount modules').and(tab.playwright.locator('[aria-pressed="true"]')));
  await role('region', 'Independent Deck Builder').waitFor({ state: 'hidden', timeoutMs: 15000 });
  check(await tab.playwright.locator('[aria-label="Host save feedback"]').count() === 0, 'Unmount left host result nodes');
  result.observed = { actor: 'Guest', sessionOnlyCopy: true, readonlySourceUnchanged: true, repeatedRealSaves: true, realSavedNameReadAfterRemount: true, ownerControlsRetained: true, hostFeedback, ...(hostFeedback ? { actualDelayedLocalSave: true, newerEditsRetained: true, rejection: 'injected host fixture before mutation; not actual backend outage', realRetrySave: true, configurationReset: true } : {}), readonly: true, unmount: true };
 } catch (error) { result.status = 'failed'; result.reason = error.message.replace(/guest_[a-zA-Z0-9_]+/g, '[private Guest fixture]'); try { result.evidence.push(await captureBrowserEvidence(tab, evidenceDir, 'save-feedback-failure')); } catch {} }
 const browserErrors = (await tab.dev.logs({ levels: ['error'], limit: 100 })).length;
 const report = { schema: 1, kind: 'browser', environment: 'local', sourceRevision: target.frontendSource.revision, backendRevision: target.health.revision, target, viewport: mobile ? '390x844' : '1280x720', method: 'CUA live browser; real local HTTP saves plus explicitly injected host rejection', scenarios: [result], counts: { passed: result.status === 'passed' ? 1 : 0, failed: result.status === 'failed' ? 1 : 0, skipped: 0, blocked: 0 }, browserErrors, status: result.status === 'passed' && browserErrors === 0 ? 'passed' : 'needs review', durationSeconds: (Date.now() - started) / 1000, cleanup: 'Caller deletes only privately tracked owned Guest copies, closes tab and resets viewport; source fixture unchanged', acceptance: 'Automated only; Kyle acceptance separate', gaps: ['Actual backend outage/account save not exercised by this Guest-only slice', 'Nested routes/full CSS and retained M4 domain work remain open'] };
 report.reportPath = await writeBrowserReport(evidenceDir, report); return report;
}


/** Ordinary Excelsior wrapper compatibility using an already run-owned Guest copy. */
export async function runOrdinarySaveCase(tab, { target, fixtureName, evidenceDir }) {
 check(target?.verified && target.environment === 'local' && target.frontendSource?.revision, 'Verified local sources required');
 check(fixtureName.startsWith('M6 Save Feedback ') && evidenceDir.startsWith('/private/tmp/'), 'Run-owned fictional fixture required');
 const role = (kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
 const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
 const capture = async name => {
  const evidence = await captureBrowserEvidence(tab, evidenceDir, name);
  // Guest deck paths contain session-derived identifiers. Keep them out of reports.
  return { screenshot: evidence.screenshot, dimensions: evidence.dimensions, page: 'ordinary run-owned Guest deck; route withheld' };
 };
 const result = { id: 'ordinary-guest-repeated-save', status: 'passed', evidence: [] };
 try {
  await wait(role('heading', 'Welcome to Excelsior'));
  await role('link', 'Decks').click();
  const card = tab.playwright.getByRole('button').filter({ hasText: fixtureName }); await wait(card); await card.click();
  const input = role('textbox', 'Deck name'); await wait(input);
  check(await input.evaluate(el => el.value) === fixtureName, 'Wrong ordinary fixture');
  await input.fill('M6 Save Feedback Ordinary First'); await role('button', 'Save').click(); await wait(role('button', 'Saved'));
  check(await input.isVisible() && await tab.playwright.locator('[aria-label="Host save feedback"]').count() === 0, 'Ordinary host editor/configuration changed');
  result.evidence.push(await capture('ordinary-first-save'));
  await input.fill('M6 Save Feedback Ordinary Second'); await role('button', 'Save').click(); await wait(role('button', 'Saved'));
  await tab.reload(); await wait(input);
  check(await input.evaluate(el => el.value) === 'M6 Save Feedback Ordinary Second', 'Reload did not recover actual saved name');
  result.evidence.push(await capture('ordinary-reloaded-save'));
  result.observed = { normalNavigation: true, realSaves: 2, reloadConfirmed: true, ownerControlsRetained: true, hostFeedbackAbsent: true };
 } catch (error) { result.status = 'failed'; result.reason = error.message.replace(/guest_[a-zA-Z0-9_]+/g, '[private Guest fixture]'); try { result.evidence.push(await capture('ordinary-save-failure')); } catch {} }
 const browserErrors = (await tab.dev.logs({ levels: ['error'], limit: 100 })).length;
 const report = { schema: 1, environment: 'local', sourceRevision: target.frontendSource.revision, backendRevision: target.health.revision, scenarios: [result], counts: { passed: result.status === 'passed' ? 1 : 0, failed: result.status === 'failed' ? 1 : 0, skipped: 0, blocked: 0 }, browserErrors, status: result.status === 'passed' && browserErrors === 0 ? 'passed' : 'needs review', cleanup: 'Caller removes the already-tracked Guest copy; original local DB deck unchanged', acceptance: 'Automated only; Kyle acceptance separate', gaps: ['Guest-only; account persistence remains separate', 'No production validation of this unapproved slice'] };
 report.reportPath = await writeBrowserReport(evidenceDir, report); return report;
}
