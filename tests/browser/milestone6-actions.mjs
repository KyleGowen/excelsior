import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';
export async function runCardActionCases(tab, { target, evidenceDir, deckId, hostActions = false, mobile = false }) {
 check(target?.verified && target.environment === 'local' && target.frontendSource?.revision, 'Verified local sources required');
 const origin = new URL(target.frontendUrl).origin;
 check(new URL(await tab.url()).origin === origin && new URL(await tab.url()).pathname === '/module-harness.html', 'Intended local harness required');
 const role = (kind,name) => tab.playwright.getByRole(kind,{name,exact:true});
 const wait = locator => locator.waitFor({state:'visible',timeoutMs:15000});
 await wait(role('heading','Independent module harness'));
 await role('checkbox','Use host overlay root').check(); await role('checkbox','Use container layout').check();
 if (await role('checkbox','Use host card actions').count()) await role('checkbox','Use host card actions').setChecked(hostActions);
 else check(!hostActions,'Host action fixture unavailable');
 const initialUrl = await tab.url();
 const outside = await tab.playwright.evaluate(() => ({html:document.documentElement.getAttribute('style'),body:document.body.getAttribute('style'),classes:document.documentElement.className}));
 const results=[];const started=Date.now();
 for(const source of ['database','collection','deck']) {
  const result={id:`${hostActions?'host':'default'}-${source}-card-actions`,status:'passed',evidence:[]};
  try {
   const select = async label => {await role('button',label).click();await wait(role('button',label).and(tab.playwright.locator('[aria-pressed="true"]')));};
   if(source==='deck') {await tab.playwright.getByLabel('Local deck ID',{exact:true}).fill(deckId);await select('Deck Builder module');await wait(role('button','Export'));}
   else {await select(source==='database'?'Card Database module':'Collection module');if(source==='collection'){await wait(role('heading','My Collection'));await role('tab','Characters').click();await wait(role('tab','Characters').and(tab.playwright.locator('[aria-selected="true"]')));}await role('searchbox',source==='database'?'Search cards':'Search collection').fill('Lancelot');}
   const trigger=source==='collection'?tab.playwright.getByRole('article').filter({hasText:'ERB 132'}).getByRole('button',{name:'View Lancelot',exact:true}):role('button','View Lancelot');
   await wait(trigger); await trigger.click(); const dialog=role('dialog','Lancelot details');await wait(dialog);
   if(hostActions) {
    await wait(role('button','Host card action'));
    check(await tab.playwright.locator('.db__add-deck,.col__detail-qty').count()===0,'Default mutation controls were not replaced');
    await role('button','Host card action').click();await tab.getAXState({emit:false});
    const output=await tab.playwright.getByLabel('Host callback result',{exact:true}).textContent();
    check(output.startsWith(`Host received card: ${source}/characters/`) && output.length > `Host received card: ${source}/characters/`.length,'Host action has wrong source/type/identity');
    await role('button','Sign in through host').press('Enter');await tab.getAXState({emit:false});
    const auth=await tab.playwright.getByLabel('Host callback result',{exact:true}).textContent();
    check(auth===output.replace('Host received card:','Host received sign-in request:'),'Sign-in request differs from selected card');
    check(await tab.playwright.getByRole('button',{name:'Log In',exact:true}).count()===0,'Excelsior sign-in appeared');
    result.observed={action:output,authRequest:auth,recordWrites:false,actualAuthentication:'not executed'};
   } else {
    check(await role('button','Host card action').count()===0,'Default host showed a custom action');
    if(source==='database'){check(!await role('button','Log in to add to decks').isEnabled(),'Guest add-to-deck enabled');await wait(role('button','Collection'));}
    if(source==='collection')check(await tab.playwright.locator('.col__detail-qty').count()===1,'Default collection quantity controls missing');
    if(source==='deck')check(await tab.playwright.locator('.card-detail__actions').count()===0,'Readonly deck acquired default actions');
    result.observed={defaultsPreserved:true,recordWrites:false};
   }
   check(await tab.url()===initialUrl,'Card action navigated away from its host');
   result.evidence.push(await captureBrowserEvidence(tab,evidenceDir,result.id));
   if(hostActions)await role('button','Close through host').click();else await dialog.press('Escape');
   await dialog.waitFor({state:'hidden',timeoutMs:15000});
   check(await trigger.evaluate(el=>el===document.activeElement),'Focus was not restored to its card');
   check(await role('region','Host overlay root').evaluate(el=>el.children.length===0),'Closed panel left portal content');
  } catch(error){result.status='failed';result.reason=error.message;try{result.evidence.push(await captureBrowserEvidence(tab,evidenceDir,result.id+'-failure'));}catch{} }
  results.push(result);if(result.status!=='passed')break;
 }
 for(const source of ['database','collection','deck']){const id=`${hostActions?'host':'default'}-${source}-card-actions`;if(!results.some(s=>s.id===id))results.push({id,status:'blocked',reason:'Earlier case failed'});}
 if(results.every(r=>r.status==='passed')) {await role('button','Unmount modules').click();check(await role('region','Host overlay root').evaluate(el=>el.children.length===0),'Unmount left portal');check(JSON.stringify(await tab.playwright.evaluate(()=>({html:document.documentElement.getAttribute('style'),body:document.body.getAttribute('style'),classes:document.documentElement.className})))===JSON.stringify(outside),'Document style changed');}
 const counts=Object.fromEntries(['passed','failed','skipped','blocked'].map(status=>[status,results.filter(s=>s.status===status).length]));const browserErrors=(await tab.dev.logs({levels:['error'],limit:100})).length;
 const report={schema:1,kind:'browser',environment:'local',sourceRevision:target.frontendSource.revision,backendRevision:target.health.revision,target,viewport:mobile?'390x844':'1280x720',method:'CUA live browser automation',scenarios:results,counts,browserErrors,durationSeconds:(Date.now()-started)/1000,status:counts.failed===0&&counts.blocked===0&&browserErrors===0?'passed':'needs review',cleanup:'No application record writes; caller closes tab and resets viewport',acceptance:'Automated only; Kyle acceptance separate',gaps:['Real host login/identity mapping and mutation actions are not executed','Brand/icon/save feedback/full CSS containment remain open','Account and multiple-instance action isolation covered by fictional component tests']};report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}
