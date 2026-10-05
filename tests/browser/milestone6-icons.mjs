import { captureBrowserEvidence, check, writeBrowserReport } from '../helpers/browserEvidence.mjs';

/** Read-only live harness update check; default module/detail state must survive host changes. */
export async function runIconUpdateCase(tab,{target,evidenceDir,mobile=false}) {
 check(target?.verified&&target.environment==='local'&&target.frontendSource?.revision,'Verified local sources required');
 check(new URL(await tab.url()).origin===new URL(target.frontendUrl).origin&&new URL(await tab.url()).pathname==='/module-harness.html','Intended local harness required');
 const role=(kind,name)=>tab.playwright.getByRole(kind,{name,exact:true});
 const wait=locator=>locator.waitFor({state:'visible',timeoutMs:15000});
 const result={id:'host-icons-update-preserves-state',status:'passed',evidence:[]};const started=Date.now();
 try {
  await wait(role('heading','Independent module harness'));
  await role('checkbox','Use host overlay root').check();await role('checkbox','Use container layout').check();
  await role('checkbox','Use host card actions').uncheck();await role('checkbox','Use host brand and icons').check();
  await role('button','Card Database module').click();
  const search=role('searchbox','Search cards');await wait(search);await search.fill('Lancelot');await wait(tab.playwright.getByText('Showing 1-1 of 1',{exact:true}));
  const card=role('button','View Lancelot');await wait(card);await card.click();
  const dialog=role('dialog','Lancelot details');await wait(dialog);
  await role('checkbox','Use host brand and icons').uncheck();await tab.getAXState({emit:false});
  check(await dialog.isVisible(),'Removing icon configuration discarded the detail');
  check(await search.evaluate(el=>el.value)==='Lancelot','Removing icon configuration discarded the search');
  check(await tab.playwright.locator('[data-module-icon]').count()===0,'Removing icon configuration left custom icons');
  check(await role('note','Fictional host brand').count()===0,'Removing brand left host chrome');
  check(await tab.playwright.locator('[role="dialog"] .slideout__close svg').count()===1,'Default close SVG was not restored');
  result.evidence.push(await captureBrowserEvidence(tab,evidenceDir,'icons-omitted-open-detail'));
  await role('checkbox','Use host brand and icons').check();await tab.getAXState({emit:false});
  check(await dialog.isVisible()&&await search.evaluate(el=>el.value)==='Lancelot','Reapplying icons discarded module state');
  await wait(role('note','Fictional host brand'));
  check(await tab.playwright.locator('[role="dialog"] [data-module-icon="close"]').count()===1,'Reapplying icons did not update portal');
  result.evidence.push(await captureBrowserEvidence(tab,evidenceDir,'icons-restored-open-detail'));
  await dialog.press('Escape');await dialog.waitFor({state:'hidden',timeoutMs:15000});
  check(await card.evaluate(el=>document.activeElement===el),'Icon update lost focus restoration');
  await role('button','Unmount modules').press('Enter');await wait(role('button','Unmount modules').and(tab.playwright.locator('[aria-pressed="true"]')));
  await role('region','Independent Card Database').waitFor({state:'hidden',timeoutMs:15000});
  check(await role('region','Host overlay root').evaluate(el=>el.children.length===0),'Unmount left owned portal content');
  check(await tab.playwright.locator('[data-module-icon]').count()===0,'Unmount left owned decorative icons');
  result.observed={searchPreserved:true,detailPreserved:true,defaultSVGRestored:true,portalUpdated:true,focusRestored:true,unmountClean:true,recordsChanged:false};
 } catch(error){result.status='failed';result.reason=error.message;try{result.evidence.push(await captureBrowserEvidence(tab,evidenceDir,'icons-update-failure'));}catch{}}
 const browserErrors=(await tab.dev.logs({levels:['error'],limit:100})).length;
 const report={schema:1,kind:'browser',environment:'local',sourceRevision:target.frontendSource.revision,backendRevision:target.health.revision,target,viewport:mobile?'390x844':'1280x720',method:'CUA live browser automation',scenarios:[result],counts:{passed:result.status==='passed'?1:0,failed:result.status==='failed'?1:0,skipped:0,blocked:0},browserErrors,status:result.status==='passed'&&browserErrors===0?'passed':'needs review',durationSeconds:(Date.now()-started)/1000,cleanup:'Read-only; caller closes test-owned tab and resets viewport',acceptance:'Automated only; Kyle acceptance separate',gaps:['Save feedback/full CSS containment/nested host routes remain open','Real host assets, account mappings and identity changes are not exercised']};report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}
