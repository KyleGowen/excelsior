import {check,captureBrowserEvidence,writeBrowserReport} from '../helpers/browserEvidence.mjs';
const role=(tab,kind,name)=>tab.playwright.getByRole(kind,{name,exact:true});
const wait=locator=>locator.waitFor({state:'visible',timeoutMs:15000});
/** Only a caller-confirmed empty, isolated local Guest collection may be edited. */
export async function runCollectionRecovery({tab,target,evidenceDir,emptyOwnedGuestConfirmed}) {
 check(target?.verified&&target.environment==='local'&&emptyOwnedGuestConfirmed,'Verified local target and empty owned Guest fixture required');
 check(new URL(await tab.url()).origin===new URL(target.frontendUrl).origin,'Wrong local origin');
 const report={schema:1,kind:'browser',environment:'local',sourceRevision:target.sourceRevision,inputFingerprint:target.sourceTreeFingerprint,actor:'isolated Guest',method:'CUA live browser; real API with explicitly selected local delay/outage injection',scenarios:[],evidence:[],cleanup:{applicationRecords:'pending; restore only the run-owned local printing to zero'},acceptance:'Automated only; Kyle acceptance pending',gaps:['Device outage injection is not a real network disconnect','No production writes or production validation']};
 const capture=async name=>report.evidence.push(await captureBrowserEvidence(tab,evidenceDir,name));
 const done=id=>report.scenarios.push({id,status:'passed'});
 let changed=false;
 const mode=role(tab,'combobox','Local Collection request mode');
 const tile=tab.playwright.getByRole('article').filter({hasText:'LancelotERB 132'});
 const quantity=tile.getByRole('textbox',{name:'Quantity',exact:true});
 const readTotals=()=>tab.playwright.locator('.col__stats').evaluate(el=>({total:el.querySelector('strong').textContent,busy:el.getAttribute('aria-busy')}));
 const current=n=>wait(tab.playwright.locator('.col__stats strong').filter({hasText:new RegExp('^'+n+'$')}).first());
 const locate=async()=>{await role(tab,'button','Collection module').click();await wait(role(tab,'heading','My Collection'));await role(tab,'tab','Characters').click();await role(tab,'searchbox','Search collection').fill('Lancelot');await wait(tile);check(await tile.count()===1,'Select one unambiguous baseline printing');};
 try{
  await locate();await current(0);check(await quantity.getAttribute('value')==='0','Fixture printing was already owned');await capture('empty-before');done('empty-server-evaluation');
  await mode.selectOption('slow-collection');await quantity.fill('2');await quantity.press('Enter');changed=true;
  const pending=await readTotals();check(pending.busy==='true'&&pending.total==='—','Slow evaluation presented invented or stale totals');check(await tile.count()===1,'Reevaluation unmounted the settled Guest grid');await capture('slow-current-input');await current(2);check(await quantity.getAttribute('value')==='2','Local input differs after evaluation');done('slow-current-totals-preserved-grid');
  await mode.selectOption('offline-collection');await quantity.fill('3');await quantity.press('Enter');await wait(role(tab,'heading','Collection unavailable'));check((await readTotals()).total==='—','Failed evaluation invented a total');await capture('outage-retained-input');done('failed-evaluation-explicit-unavailable');
  await mode.selectOption('online');await role(tab,'button','Retry collection').click();await current(3);check(await quantity.getAttribute('value')==='3','Reconnection lost device-local quantity');await capture('reconnected-current-totals');done('reconnect-retry-retained-quantities');
  await role(tab,'button','Unmount modules').click();await role(tab,'heading','My Collection').waitFor({state:'hidden',timeoutMs:15000});await locate();await current(3);check(await quantity.getAttribute('value')==='3','Remount lost local quantities');done('repeated-mount-current-evaluation');
  await quantity.fill('0');await quantity.press('Enter');await current(0);changed=false;report.cleanup.applicationRecords='run-owned device printing restored to zero; no saved deck/collection writes';await capture('restored-empty');done('scoped-guest-cleanup');
 }catch(error){report.scenarios.push({id:'collection-recovery',status:'failed',reason:error.message});try{await capture('failure');}catch{}}
 finally{
  if(changed)try{await mode.selectOption('online');if(await role(tab,'button','Retry collection').count())await role(tab,'button','Retry collection').click();await locate();await quantity.fill('0');await quantity.press('Enter');await current(0);report.cleanup.applicationRecords='restored run-owned printing after failure';}catch{report.cleanup.applicationRecords='BLOCKED: run-owned printing cleanup required';}
 }
 const evidence=await tab.playwright.getByLabel('Local request evidence',{exact:true}).getAttribute('data-request-evidence');
 if(evidence)report.requestEvidence=JSON.parse(evidence);
 report.browserErrorCount=(await tab.dev.logs({levels:['error'],limit:50})).length;
 report.counts={passed:report.scenarios.filter(s=>s.status==='passed').length,failed:report.scenarios.filter(s=>s.status==='failed').length,skipped:0,blocked:Math.max(0,6-report.scenarios.filter(s=>s.status==='passed').length-report.scenarios.filter(s=>s.status==='failed').length)};
 report.status=report.counts.passed===6&&report.counts.failed===0&&report.browserErrorCount===0&&!report.cleanup.applicationRecords.startsWith('BLOCKED')?'passed':'needs review';
 report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}

/** Caller owns the fictional account and initial one-printing fixture; login is ordinary UI. */
export async function runSavedCollectionRoundTrip({tab,target,fixture,evidenceDir}) {
 check(target?.verified&&target.environment==='local'&&fixture?.ownedFixture,'Verified local target and owned fictional account required');
 const origin=new URL(target.frontendUrl).origin;
 const report={schema:1,kind:'browser',environment:'local',sourceRevision:target.sourceRevision,inputFingerprint:target.sourceTreeFingerprint,actor:'fictional account',method:'CUA live browser; saved Collection writes and fresh server reads',scenarios:[],evidence:[],acceptance:'Automated only; Kyle acceptance separate',cleanup:{applicationRecords:'pending'},gaps:['No production validation or real OAuth']};
 const capture=async name=>report.evidence.push(await captureBrowserEvidence(tab,evidenceDir,name));
 const done=id=>report.scenarios.push({id,status:'passed'});
 const collection=origin+'/users/'+fixture.userId+'/collection';
 const qty=role(tab,'textbox','Quantity');
 const totals=n=>wait(tab.playwright.locator('.col__stats strong').filter({hasText:new RegExp('^'+n+'$')}).first());
 let changed=false;
 try {
  await tab.goto(origin+'/home');await wait(role(tab,'button','Guest'));await role(tab,'button','Guest').click();await role(tab,'menuitem','Log In').click();await role(tab,'textbox','Email or Username').fill(fixture.username);await role(tab,'textbox','Password Show password').fill(fixture.password);await role(tab,'button','Log In').click();await wait(role(tab,'button',fixture.username));
  await tab.goto(collection);await wait(role(tab,'heading','My Collection'));await role(tab,'checkbox','Owned only').check();await wait(qty);await totals(1);check(await qty.getAttribute('value')==='1','Initial fixture quantity mismatch');done('saved-view-current-input');
  await qty.fill('3');await qty.press('Enter');changed=true;await totals(3);await capture('saved-current-three');await tab.reload();await wait(role(tab,'heading','My Collection'));await role(tab,'checkbox','Owned only').check();await wait(qty);await totals(3);check(await qty.getAttribute('value')==='3','Reload did not preserve saved printing');done('saved-quantity-reload');
  await role(tab,'link','Database').click();await wait(role(tab,'heading','Card Database'));await tab.back();await wait(role(tab,'heading','My Collection'));await role(tab,'checkbox','Owned only').check();await wait(qty);await totals(3);check(await qty.getAttribute('value')==='3','Normal navigation returned stale quantity');done('saved-navigation-current-view');
  await qty.fill('1');await qty.press('Enter');await totals(1);changed=false;await capture('saved-restored-one');report.cleanup.applicationRecords='owned saved printing restored to initial quantity one';done('saved-scoped-cleanup');
 }catch(error){report.scenarios.push({id:'saved-collection',status:'failed',reason:error.message});try{await capture('failure');}catch{}}
 finally {
  if(changed)try{await tab.goto(collection);await wait(role(tab,'heading','My Collection'));await role(tab,'checkbox','Owned only').check();await wait(qty);await qty.fill('1');await qty.press('Enter');await totals(1);report.cleanup.applicationRecords='owned printing restored after failure';}catch{report.cleanup.applicationRecords='BLOCKED: restore owned printing from private manifest';}
  try{await tab.goto(origin+'/home');await wait(role(tab,'button',fixture.username));await role(tab,'button',fixture.username).click();await role(tab,'menuitem','Log Out').click();await wait(role(tab,'button','Guest'));report.cleanup.browser='Guest Home';}catch{report.cleanup.browser='BLOCKED: inspect test-owned session';}
 }
 report.browserErrorCount=(await tab.dev.logs({levels:['error'],limit:50})).length;
 report.counts={passed:report.scenarios.filter(s=>s.status==='passed').length,failed:report.scenarios.filter(s=>s.status==='failed').length,blocked:Math.max(0,4-report.scenarios.length),skipped:0};report.status=report.counts.passed===4&&report.browserErrorCount===0&&!Object.values(report.cleanup).some(v=>v.startsWith('BLOCKED'))?'passed':'needs review';report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}
