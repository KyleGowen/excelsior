import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';
/** Explicit local-only/read-only theme fixtures. The caller owns viewport and verifies both sources. */
export async function runAppearanceCases(tab, { target, evidenceDir, deckId, deckName, mobile = false }) {
 check(target?.verified && target.environment === 'local' && target.frontendSource?.revision, 'Verified local UI and API sources required');
 check(new URL(await tab.url()).origin === new URL(target.frontendUrl).origin && new URL(await tab.url()).pathname === '/module-harness.html', 'Use the intended local harness');
 const role = (kind, name) => tab.playwright.getByRole(kind, { name, exact: true });
 const wait = locator => locator.waitFor({ state: 'visible', timeoutMs: 15000 });
 const select = async name => { await role('button', name).click(); await wait(role('button', name).and(tab.playwright.locator('[aria-pressed="true"]'))); };
 const appearance = () => tab.playwright.locator('.module-appearance');
 const outside = () => tab.playwright.evaluate(() => { const e = document.querySelector('.module-harness__controls'); const c = getComputedStyle(e); return { html: document.documentElement.getAttribute('style'), htmlClass: document.documentElement.className, body: document.body.getAttribute('style'), color: c.color, font: c.fontFamily, token: c.getPropertyValue('--color-text') }; });
 await wait(role('heading', 'Independent module harness'));
 const initial = await outside(); const scenarios = [];
 const run = async (id, action) => {
  if (scenarios.some(s => s.status !== 'passed')) { scenarios.push({ id, status: 'blocked', reason: 'Earlier appearance case failed' }); return; }
  const result = { id, status: 'passed', evidence: [] };
  const capture = async suffix => { await tab.getAXState({ emit: false }); result.evidence.push(await captureBrowserEvidence(tab, evidenceDir, `${id}-${suffix}`)); };
  try { result.observed = await action(capture); await capture('result'); } catch (error) { result.status = 'failed'; result.reason = error.message; await capture('failure'); }
  scenarios.push(result);
 };
 const preset = async value => { await role('combobox', 'Host appearance').selectOption(value); await tab.getAXState({ emit: false }); };
 const assertOutside = async () => check(JSON.stringify(await outside()) === JSON.stringify(initial), 'Theme changed outer host/document styles');
 const panelCheck = async (panel, expectedColor, expectedPadding) => {
  const observed = await panel.evaluate(e => { const c=getComputedStyle(e);const h=getComputedStyle(e.querySelector('.slideout__header'));const p=e.getBoundingClientRect();const r=e.closest('[aria-label="Host overlay root"]').getBoundingClientRect();return {background:c.backgroundColor,font:c.fontFamily,padding:h.paddingTop,inBoundary:!!e.closest('.module-appearance'),contained:p.left>=r.left-1&&p.right<=r.right+1&&p.top>=r.top-1&&p.bottom<=r.bottom+1}; });
  check(observed.background===expectedColor && observed.padding===expectedPadding && observed.inBoundary && observed.contained, `Host panel appearance/bounds differ: ${JSON.stringify(observed)}`); return observed;
 };
 await role('checkbox','Use container layout').check(); await role('checkbox','Use host overlay root').check(); await role('combobox','Host container width').selectOption(mobile?'390':'720'); await role('textbox','Local deck ID').fill(deckId);
 check(await role('checkbox','Read-only deck').evaluate(e=>e.checked), 'Keep fictional fixture read-only');
 await run('theme-default-and-update', async capture => {
  await select('Card Database module'); await preset('default'); await role('searchbox','Search cards').fill('Lancelot'); await wait(role('button','View Lancelot')); await capture('default');
  await preset('paper'); check(await role('searchbox','Search cards').evaluate(e=>e.value==='Lancelot'),'Theme update lost search');
  const observed=await appearance().evaluate(e=>{const c=getComputedStyle(e);return {background:c.backgroundColor,color:c.color,font:c.fontFamily,size:c.fontSize};});
  check(observed.background==='rgb(247, 244, 237)'&&observed.color==='rgb(32, 37, 47)'&&observed.font.includes('Georgia')&&observed.size==='16px','Paper appearance did not apply'); await assertOutside(); return {...observed,searchPreserved:true,outerHostUnchanged:true};
 });
 await run('theme-paper-detail', async capture => {
  await role('button','View Lancelot').click();const panel=role('dialog','Lancelot details');await wait(panel);await capture('settled');
  const observed=await panelCheck(panel,'rgb(255, 253, 248)','20px');const image=panel.getByRole('img',{name:'Lancelot',exact:true});check(await image.evaluate(e=>e.complete&&e.naturalWidth>0),'Card art failed'); await panel.press('Escape');await panel.waitFor({state:'hidden'});check(await role('button','View Lancelot').evaluate(e=>document.activeElement===e),'Focus not restored');return {...observed,imageLoaded:true,focusRestored:true};
 });
 await run('theme-contrast-and-reset', async capture => {
  await preset('contrast');check(await role('searchbox','Search cards').evaluate(e=>e.value==='Lancelot'),'Contrast update lost search');await role('button','View Lancelot').click();const panel=role('dialog','Lancelot details');await wait(panel);await capture('settled');const observed=await panelCheck(panel,'rgb(25, 25, 25)','24px');await panel.press('Escape');await panel.waitFor({state:'hidden'});await preset('default');check(await appearance().evaluate(e=>!e.style.getPropertyValue('--font-sans')&&!e.style.getPropertyValue('--space-4')),'Reset left overrides');check(await role('searchbox','Search cards').evaluate(e=>e.value==='Lancelot'),'Reset lost state');await assertOutside();return {contrast:observed,overridesRemoved:true,searchPreserved:true};
 });
 await run('theme-readonly-deck', async capture => {
  await preset('paper');await select('Deck Builder module');await wait(role('heading',deckName));check(await role('button','Save').count()===0,'Read-only fixture exposed Save');await wait(role('button','Draw Hand').and(tab.playwright.locator(':enabled')));await role('button','Draw Hand').click();const drawn=role('dialog','Drawn Hand');await wait(drawn);check(await drawn.getByRole('button').count()===10,'Draw must have eight cards');await capture('draw');await role('button','Close panel').click();await role('button','Export').click();const exported=role('dialog','Export deck JSON');await wait(exported);await capture('export');const values=await exported.evaluate(e=>{const x=JSON.parse(e.querySelector('pre').textContent);return {cards:x.total_cards,threat:x.total_threat};});check(values.cards===8&&values.threat===18,'Theme changed export');const panel=await panelCheck(exported,'rgb(255, 253, 248)','20px');await role('button','Close panel').click();await assertOutside();return {draw:8,exported:values,panel,recordsChanged:false};
 });
 await run('theme-collection-read', async capture => {
  await select('Collection module');await wait(role('heading','My Collection'));await role('tab','Characters').click();await wait(role('tab','Characters').and(tab.playwright.locator('[aria-selected="true"]')));await role('searchbox','Search collection').fill('Lancelot');await wait(role('button','View Lancelot'));await capture('paper');await preset('contrast');check(await role('searchbox','Search collection').evaluate(e=>e.value==='Lancelot'),'Collection theme update lost search');await wait(role('button','View Lancelot'));await assertOutside();return {searchPreserved:true,quantitiesChanged:false};
 });
 await run('theme-disposal', async () => {
  await select('Card Database module');await role('searchbox','Search cards').fill('Lancelot');await wait(role('button','View Lancelot'));await role('button','View Lancelot').click();await wait(role('dialog','Lancelot details'));await select('Unmount modules');check(await role('dialog','Lancelot details').count()===0,'Unmount left dialog');check(await role('region','Host overlay root').evaluate(e=>e.children.length===0),'Unmount left portal');await preset('paper');await select('Card Database module');await wait(role('searchbox','Search cards'));await assertOutside();return {portalCleared:true,remounted:true,documentUnchanged:true};
 });
 const counts=Object.fromEntries(['passed','failed','skipped','blocked'].map(status=>[status,scenarios.filter(s=>s.status===status).length]));const browserErrors=(await tab.dev.logs({levels:['error'],limit:100})).length;
 const report={schema:1,kind:'browser',environment:'local',sourceRevision:target.frontendSource.revision,backendRevision:target.health.revision,target,method:'CUA live browser automation',viewport:mobile?'390x844':'1280x720',scenarios,counts,browserErrors,status:counts.failed===0&&counts.blocked===0&&browserErrors===0?'passed':'needs review',cleanup:'Read-only local fixture; no application record writes; panels cleared; caller resets viewport/closes temporary tabs.',acceptance:'Automated evidence; Kyle acceptance recorded separately',gaps:['Global CSS/reset/ancestor selectors and viewport media queries are not isolated','External portal roots need host styling','Multiple appearance instances and unsaved state/focus continuity covered by component tests','Fictional host presets are not an exact LRG match or a certified contrast audit','No production theme, OAuth, authenticated writes or fixture mutations tested']};report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}
