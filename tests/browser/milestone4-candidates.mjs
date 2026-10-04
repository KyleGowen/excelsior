import { captureBrowserEvidence, check } from '../helpers/browserEvidence.mjs';
// Caller confirms a fictional owned local fixture; no Save or persisted record writes.
export async function runCandidateReadCases(tab, { directory, capture = captureBrowserEvidence, check: assert = check }) {
  const dialog = tab.playwright.getByRole('dialog', { name: 'Add cards', exact: true });
  const scenarios = [];
  const run = async (id, fn) => {
    try { await fn(); scenarios.push({ id, status: 'passed', evidence: await capture(tab, directory, id) }); }
    catch (error) { scenarios.push({ id, status: 'failed', reason: error.message, evidence: await capture(tab, directory, `${id}-failed`) }); throw Object.assign(error, { scenarios }); }
  };
  await tab.playwright.getByRole('button', { name: 'Add Cards', exact: true }).click();
  await dialog.waitFor({ state: 'visible' });
  const search = dialog.getByRole('searchbox', { name: 'Search cards to add' });
  const hide = dialog.getByRole('checkbox', { name: 'Hide Unusables', exact: true }).filter({ visible: true });
  const setHide = async value => {
    if (await hide.evaluate(e => e.checked) !== value) await dialog.getByText('Hide Unusables', { exact: true }).filter({ visible: true }).click();
    assert(await hide.evaluate(e => e.checked) === value, 'Visible filter label must toggle its checkbox');
  };
  await run('power-unfiltered', async () => {
    await dialog.getByRole('tab', { name: 'Power', exact: true }).click();
    await setHide(false); await search.fill('8 - Energy');
    await dialog.getByRole('button', { name: 'View 8 - Energy', exact: true }).waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: 'View 1 - Energy', exact: true }).waitFor({ state: 'hidden' });
    assert(await dialog.getByRole('button', { name: 'Add to deck', exact: true }).isEnabled(), 'Unusable filtering must not become write permission');
  });
  await run('power-hidden', async () => {
    await setHide(true); await dialog.getByRole('heading', { name: 'No cards', exact: true }).waitFor({ state: 'visible' });
    assert(await dialog.getByRole('button', { name: 'View 8 - Energy', exact: true }).count() === 0, 'Energy8 must be hidden for this Lancelot fixture');
  });
  await run('power-usable', async () => {
    await search.fill('7 - Combat'); await dialog.getByRole('button', { name: 'View 7 - Combat', exact: true }).waitFor({ state: 'visible' });
    assert(await dialog.getByRole('button', { name: 'Add to deck', exact: true }).isEnabled(), 'Combat7 must remain usable');
  });
  await run('one-per-deck-ceiling', async () => {
    await dialog.getByRole('tab', { name: 'Special', exact: true }).click(); await search.fill('Sword and Shield');
    await dialog.getByRole('button', { name: 'View Sword and Shield', exact: true }).waitFor({ state: 'visible' });
    assert(!(await dialog.getByRole('button', { name: 'Increase', exact: true }).isEnabled()), 'One-per-deck ceiling must remain enforced on the tile');
  });
  await run('no-homebase', async () => {
    await dialog.getByRole('tab', { name: 'Aspects', exact: true }).click(); await search.fill('');
    await dialog.getByRole('heading', { name: 'No cards', exact: true }).waitFor({ state: 'visible' });
  });
  await run('stacks-exemption', async () => {
    await dialog.getByRole('tab', { name: 'Stacks', exact: true }).click();
    assert(!(await hide.isEnabled()), 'Stacks hide-unusable toggle must remain disabled');
  });
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  return scenarios;
}

/** Caller owns this fictional local Lancelot fixture. Edits remain unsaved; reload restores it. */
export async function runCandidateTeamChange(tab, { directory }) {
  const url = new URL(await tab.url());
  check(['localhost', '127.0.0.1'].includes(url.hostname), 'Draft edits are local only');
  try {
  await tab.playwright.getByRole('button', { name: 'Remove Lancelot', exact: true }).click();
  await tab.playwright.getByRole('button', { name: 'Add Cards', exact: true }).click();
  const dialog = tab.playwright.getByRole('dialog', { name: 'Add cards', exact: true });
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByRole('tab', { name: 'Power', exact: true }).click();
  const hide = dialog.getByRole('checkbox', { name: 'Hide Unusables', exact: true }).filter({ visible: true });
  if (!await hide.evaluate(e => e.checked)) await dialog.getByText('Hide Unusables', { exact: true }).filter({ visible: true }).click();
  await dialog.getByRole('searchbox', { name: 'Search cards to add' }).fill('7 - Combat');
  await dialog.getByRole('heading', { name: 'No cards', exact: true }).waitFor({ state: 'visible' });
  check(await dialog.getByRole('button', { name: 'View 7 - Combat', exact: true }).count() === 0, 'Old starting-team decisions must not survive removing Lancelot');
  const removed = await captureBrowserEvidence(tab, directory, 'without-lancelot');
  await dialog.getByRole('tab', { name: 'Characters', exact: true }).click();
  await dialog.getByRole('searchbox', { name: 'Search cards to add' }).fill('Lancelot');
  await dialog.getByRole('button', { name: 'View Lancelot', exact: true }).waitFor({ state: 'visible' });
  await dialog.getByRole('button', { name: 'View Lancelot', exact: true }).getByRole('button', { name: 'Add to deck', exact: true }).click();
  await dialog.getByRole('tab', { name: 'Power', exact: true }).click();
  await dialog.getByRole('searchbox', { name: 'Search cards to add' }).fill('7 - Combat');
  await dialog.getByRole('button', { name: 'View 7 - Combat', exact: true }).waitFor({ state: 'visible' });
  const restored = await captureBrowserEvidence(tab, directory, 'with-lancelot-restored');
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  return { id: 'unsaved-team-change', status: 'passed', evidence: [removed, restored], cleanup: 'No Save clicked; original fixture reloaded' };
  } catch (error) { await captureBrowserEvidence(tab, directory, 'team-change-failed'); throw error; }
  finally { await tab.reload(); await tab.playwright.getByRole('button', { name: 'Remove Lancelot', exact: true }).waitFor({ state: 'visible' }); }
}
