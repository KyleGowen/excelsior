import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';
/** Local-only, read-only native-container cases; the caller verifies UI/API/fixture identity. */
export async function runContainerCases(tab, { target, evidenceDir, deckId, deckName }) {
 check(target?.verified && target.environment === 'local', 'Verified local target required');
 const url = new URL(await tab.url());
 check(url.origin === new URL(target.frontendUrl).origin && url.pathname === '/module-harness.html', 'Use the intended local harness');
 const role = (kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
 const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
 const select = async name => { await role('button', name).click(); await wait(role('button', name).and(tab.playwright.locator('[aria-pressed="true"]'))); };
 const root = () => tab.playwright.locator('.module-layout-container');
 const setWidth = async (width, mode) => { await role('combobox', 'Host container width').selectOption(String(width)); await wait(root().and(tab.playwright.locator(`[data-layout-mode="${mode}"]`))); };
 const documentState = () => tab.playwright.evaluate(() => ({ width: document.documentElement.clientWidth, htmlClass: document.documentElement.className, bodyStyle: document.body.getAttribute('style') }));
 const before = await documentState();
 check(before.width > 1120, 'Desktop container scenario requires viewport wider than1120px');
 const scenarios = [];
 const run = async (id, action) => {
  if (scenarios.some(s => s.status !== 'passed')) { scenarios.push({ id, status: 'blocked', reason: 'Earlier container case failed' }); return; }
  const result = { id, status: 'passed', evidence: [] };
  const capture = async suffix => { const item = await captureBrowserEvidence(tab, evidenceDir, `${id}-${suffix}`); result.evidence.push(item); };
  try { result.observed = await action(capture); await capture('result'); }
  catch (error) { result.status = 'failed'; result.reason = error.message; await capture('failure'); }
  scenarios.push(result);
 };
 const assertPanel = async (dialog, capture, label = 'panel') => {
  check(await dialog.evaluate(e => !!e.closest('[aria-label="Host overlay root"]')), 'Panel outside declared host root');
  await capture(label);
  const geometry = await dialog.evaluate(e => { const p=e.getBoundingClientRect(); const r=e.closest('[aria-label="Host overlay root"]').getBoundingClientRect(); return { panel:{left:p.left,right:p.right,top:p.top,bottom:p.bottom}, root:{left:r.left,right:r.right,top:r.top,bottom:r.bottom}, contained:p.left>=r.left-1&&p.right<=r.right+1&&p.top>=r.top-1&&p.bottom<=r.bottom+1 }; });
  check(geometry.contained, 'Panel escaped host bounds'); return geometry;
 };
 await role('checkbox','Use container layout').check(); await role('checkbox','Use host overlay root').check();
 await role('textbox','Local deck ID').fill(deckId);
 check(await role('checkbox','Read-only deck').evaluate(e=>e.checked), 'Keep fixture read-only');
 await run('container-only-resize', async () => {
  await select('Card Database module'); await setWidth(1120,'desktop');
  await role('searchbox','Search cards').fill('Lancelot'); await wait(role('button','View Lancelot'));
  await setWidth(390,'mobile');
  check(await role('searchbox','Search cards').evaluate(e=>e.value==='Lancelot'), 'Resize lost search input');
  const narrow=await root().evaluate(e=>({width:e.getBoundingClientRect().width,scrollWidth:e.scrollWidth}));
  check(Math.abs(narrow.width-390)<1&&narrow.scrollWidth<=391, 'Narrow Database overflowed container');
  await setWidth(1120,'desktop'); check(await role('searchbox','Search cards').evaluate(e=>e.value==='Lancelot'), 'Wide resize lost state');
  check(JSON.stringify(await documentState())===JSON.stringify(before), 'Container changed document layout or viewport');
  return { narrow, wide:1120, viewportUnchanged:true, searchPreserved:true };
 });
 await run('container-detail-keyboard', async capture => {
  await setWidth(390,'mobile'); await role('button','View Lancelot').click(); const panel=role('dialog','Lancelot details'); await wait(panel);
  await wait(panel.getByRole('img',{name:'Lancelot',exact:true}));
  check(await panel.getByRole('img',{name:'Lancelot',exact:true}).evaluate(e=>e.complete&&e.naturalWidth>0), 'Artwork did not load');
  const geometry=await assertPanel(panel,capture); await role('button','Close panel').press('Shift+Tab');
  const controls=await panel.getByRole('button').and(tab.playwright.locator(':enabled')).all();
  check(await controls.at(-1).evaluate(e=>document.activeElement===e), 'Focus did not wrap');
  await panel.press('Escape'); await panel.waitFor({state:'hidden'});
  check(await role('button','View Lancelot').evaluate(e=>document.activeElement===e), 'Focus not restored'); return {geometry,focusWrapped:true,focusRestored:true};
 });
 await run('container-readonly-deck', async capture => {
  await select('Deck Builder module'); await wait(role('heading',deckName));
  check(await role('button','Save').count()===0, 'Read-only fixture exposed Save');
  await wait(role('button','Draw Hand').and(tab.playwright.locator(':enabled'))); await role('button','Draw Hand').click();
  const drawn=role('dialog','Drawn Hand'); await wait(drawn); check(await drawn.getByRole('button').count()===10,'Draw must have8cards');
  const geometry=await assertPanel(drawn,capture,'draw-panel'); await role('button','Close panel').click(); await role('button','Export').click();
  const exported=role('dialog','Export deck JSON'); await wait(exported); await assertPanel(exported,capture,'export-panel');
  const values=await exported.evaluate(e=>{const x=JSON.parse(e.querySelector('pre').textContent);return {cards:x.total_cards,threat:x.total_threat};});
  check(values.cards===8&&values.threat===18, 'Fixture export changed'); await role('button','Close panel').click();
  return {geometry,drawCount:8,exported:values,recordsChanged:false};
 });
 await run('container-collection-read', async capture => {
  await select('Collection module'); await wait(role('heading','My Collection')); await role('tab','Characters').click();
  await wait(role('tab','Characters').and(tab.playwright.locator('[aria-selected="true"]')));
  await wait(role('button','View Angry Mob (Middle Ages)'));
  await capture('unfiltered');
  const full=await root().evaluate(e=>({width:e.getBoundingClientRect().width,scrollWidth:e.scrollWidth}));
  check(full.scrollWidth<=391,`Full Collection overflowed: ${JSON.stringify(full)}`);
  await role('button','Next page').click(); await wait(role('button','First page').and(tab.playwright.locator(':enabled')));
  await role('button','First page').click(); await wait(role('button','First page').and(tab.playwright.locator(':disabled')));
  await role('searchbox','Search collection').fill('Lancelot'); await wait(role('button','View Lancelot'));
  // Check settled geometry after capturing the rendered view; retain early failures.
  await capture('settled');
  const bounds=await root().evaluate(e=>({width:e.getBoundingClientRect().width,scrollWidth:e.scrollWidth}));
  check(bounds.scrollWidth<=391,`Collection overflowed narrow host: ${JSON.stringify(bounds)}`); return {full,bounds,paginationRoundTrip:true,recordsChanged:false};
 });
 await run('container-disposal', async () => {
  // Collection retains printing identity; target the observed ERB132 printing.
  await tab.playwright.getByRole('article').filter({hasText:'ERB 132'}).getByRole('button',{name:'View Lancelot',exact:true}).click(); await wait(role('dialog','Lancelot details')); await select('Unmount modules');
  check(await role('dialog','Lancelot details').count()===0,'Unmount left dialog'); check(await role('region','Host overlay root').evaluate(e=>e.children.length===0),'Unmount left portal children');
  await select('Card Database module'); await wait(role('searchbox','Search cards')); await wait(root().and(tab.playwright.locator('[data-layout-mode="mobile"]')));
  check(JSON.stringify(await documentState())===JSON.stringify(before),'Unmount/remount changed document'); return {portalCleared:true,remounted:true,documentUnchanged:true};
 });
 const browserErrors=(await tab.dev.logs({levels:['error'],limit:100})).length;
 const counts=Object.fromEntries(['passed','failed','skipped','blocked'].map(status=>[status,scenarios.filter(s=>s.status===status).length]));
 const report={schema:1,kind:'browser',environment:'local',sourceRevision:target.sourceRevision,target,method:'CUA live browser automation',scenarios,counts,browserErrors,status:counts.failed===0&&counts.blocked===0&&browserErrors===0?'passed':'needs review',cleanup:'Read-only fictional fixture; no Save/quantity writes. Viewport unchanged; panels cleared on unmount; preview retained.',acceptance:'Kyle acceptance pending for container slice',gaps:['No full CSS containment/global reset or theme/brand/auth/action isolation claimed.','Multiple independent width instances, observer cleanup and local preference isolation covered by component tests, not this live subset.','No production container/OAuth/light theme/account writes tested.']};
 report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}
