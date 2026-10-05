import { check, captureBrowserEvidence, writeBrowserReport } from '../helpers/browserEvidence.mjs';
const role=(tab,kind,name)=>tab.playwright.getByRole(kind,{name,exact:true});
const wait=locator=>locator.waitFor({state:'visible',timeoutMs:15000});
/** Live development-native-router checks. No save/clone/collection quantity actions. */
export async function runNativeHostRoutes({tab,target,evidenceDir,viewport,dimensions,deckId}) {
 check(target.verified&&target.environment==='local','Verified local health/source is required');
 check(/^[0-9a-f-]{36}$/i.test(deckId),'Select an existing public fictional fixture');
 const base=new URL('/fictional-host',target.frontendUrl).href;
 const report={schema:1,environment:'local',revision:target.frontendSource?.revision,frontendFingerprint:target.frontendSource?.fingerprint,target,dimensions,actor:'Guest',theme:'fixed dark',method:'live CUA BrowserRouter plus real local HTTP reads',cases:[],records:'unchanged',gaps:['unsaved edit navigation not selected; deck fixture is readonly','forward does not reconstruct a closed card detail; existing module contract','production native host routing not tested']};
 await viewport.set(dimensions); report.stage='setup';
 const capture=name=>captureBrowserEvidence(tab,evidenceDir,name);
 try {
  await tab.goto(base+'/tools/cards'); await wait(role(tab,'heading','Card Database'));
  await role(tab,'link','Host Collection').click(); await wait(role(tab,'heading','My Collection'));
  check((await tab.url()).endsWith('/tools/collection'),'Host Collection URL differs');
  await tab.back(); await wait(role(tab,'heading','Card Database')); check((await tab.url()).endsWith('/tools/cards'),'Back did not restore Cards');
  await tab.forward(); await wait(role(tab,'heading','My Collection'));
  await tab.reload(); await wait(role(tab,'heading','My Collection'));
  await capture('collection-reloaded'); report.cases.push({id:'nested-links-back-forward-deep-reload',status:'passed'});
  await role(tab,'link','Host Deck').click(); await wait(role(tab,'button','Export'));
  check((await tab.url()).endsWith('/tools/decks/'+deckId),'Host Deck route differs');
  await tab.reload(); await wait(role(tab,'button','Export'));
  check((await tab.url()).endsWith('/tools/decks/'+deckId),'Direct deck reload left host route');
  check(await role(tab,'button','Save').count()===0&&await role(tab,'textbox','Deck name').count()===0,'Read-only route exposes editing');
  await wait(role(tab,'button','Draw Hand').and(tab.playwright.locator(':enabled'))); await role(tab,'button','Draw Hand').click(); await wait(role(tab,'dialog','Drawn Hand'));
  check(await role(tab,'dialog','Drawn Hand').getByRole('button').count()===10,'Expected eight drawn cards plus two controls');
  await role(tab,'button','Close panel').click(); await capture('nested-readonly-deck');
  await role(tab,'button','Back to fictional host').click(); await wait(role(tab,'heading','My Collection'));
  report.cases.push({id:'readonly-deck-draw-host-back',status:'passed'});
  await role(tab,'link','Host Cards').click(); await wait(role(tab,'heading','Card Database'));
  await role(tab,'searchbox','Search cards').fill('Lancelot'); await wait(role(tab,'button','View Lancelot').first()); report.stage='detail-reopen'; await role(tab,'button','View Lancelot').first().click(); await wait(role(tab,'dialog','Lancelot details'));
  const images=await role(tab,'dialog','Lancelot details').locator('img').evaluateAll(els=>els.map(img=>({complete:img.complete,width:img.naturalWidth,height:img.naturalHeight})));
  check(images.some(img=>img.complete&&img.width>0&&img.height>0),'Detail artwork not loaded');
  await wait(role(tab,'status','Host detail history').filter({hasText:'Detail entry'})); await capture('nested-card-detail'); report.stage='detail-back'; await tab.back(); await wait(role(tab,'status','Host detail history').filter({hasText:'Route entry'})); await role(tab,'dialog','Lancelot details').waitFor({state:'detached',timeoutMs:15000}); check(await role(tab,'dialog','Lancelot details').count()===0,'Browser Back did not close detail');
  check((await tab.url()).endsWith('/tools/cards'),'Detail Back left nested Cards');
  report.stage='detail-reopen'; await role(tab,'button','View Lancelot').first().click(); await wait(role(tab,'dialog','Lancelot details')); await wait(role(tab,'status','Host detail history').filter({hasText:'Detail entry'})); report.stage='detail-close'; await role(tab,'button','Close panel').click(); await wait(role(tab,'status','Host detail history').filter({hasText:'Route entry'})); await role(tab,'dialog','Lancelot details').waitFor({state:'detached',timeoutMs:15000});
  check((await tab.url()).endsWith('/tools/cards')&&await role(tab,'dialog','Lancelot details').count()===0,'Close left stale detail/route');
  await role(tab,'link','Host Home').click(); await wait(role(tab,'heading','Fictional nested host')); check(await role(tab,'heading','Card Database').count()===0,'Home retains mounted module');
  report.cases.push({id:'detail-back-close-host-home',status:'passed'});
  await tab.goto(base+'/unknown'); await wait(role(tab,'status').filter({hasText:'Unknown fictional host route'}));
  check(await role(tab,'heading','Card Database').count()===0,'Unknown route mounts catalog');
  report.cases.push({id:'unknown-route-explicit',status:'passed'});
 }catch(error){report.cases.push({id:'native-routes',status:'failed',reason:String(error)});report.failure=await capture('failure');}
 finally{report.errors=await tab.dev.logs({levels:['error'],limit:30});await viewport.reset();report.cleanup={applicationRecords:'unchanged; read-only selected actions',viewport:'reset',tab:'caller-owned; close or handoff'};}
 report.status=report.cases.every(x=>x.status==='passed')&&report.errors.length===0?'passed':'failed';report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}
