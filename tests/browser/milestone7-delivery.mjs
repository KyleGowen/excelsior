import {check,captureBrowserEvidence,writeBrowserReport} from '../helpers/browserEvidence.mjs';
const role=(tab,kind,name)=>tab.playwright.getByRole(kind,{name,exact:true});
const wait=locator=>locator.waitFor({state:'visible',timeoutMs:15000});
/** Real, explicitly selected read-only local checks of the compiled artifact consumer. */
export async function runBuiltDelivery({tab,target,evidenceDir,viewport,dimensions,mobile=false}) {
 check(target.verified && target.environment==='local' && target.sourceTreeFingerprint,'Verified local checkout/proxy/data target required');
 const consumerUrl=await tab.url();const consumer=new URL(consumerUrl);check(['localhost','127.0.0.1'].includes(consumer.hostname)&&consumer.pathname==='/delivery-proof/','Select the loopback built consumer before running');
 const report={kind:'browser',schema:1,environment:'local',sourceRevision:target.sourceRevision,sourceFingerprint:target.sourceTreeFingerprint,target,consumerUrl,actor:'Guest / public read-only fixture',method:'CUA live browser; compiled module consumer; real local API',scenarios:[],evidence:[],acceptance:'Automated evidence only; Kyle acceptance pending',gaps:['Private same-repository delivery only; no package publishing, LRG installation or production host proof','Light theme and OAuth remain unverified','Forced unload/browser crash recovery is not guaranteed']};
 const capture=async name=>report.evidence.push(await captureBrowserEvidence(tab,evidenceDir,name));
 const done=id=>report.scenarios.push({id,status:'passed'});
 try {
  await viewport.set(dimensions);
  await tab.reload();await wait(role(tab,'heading','Card Database'));
  const actual=await tab.playwright.evaluate(()=>({width:document.documentElement.clientWidth,height:document.documentElement.clientHeight}));check(actual.width===dimensions.width&&actual.height===dimensions.height,'Actual consumer viewport differs');report.dimensions=actual;
  await role(tab,'combobox','Consumer surface width').selectOption(mobile?'390':'1120');
  const first=role(tab,'region','Built module');
  await first.getByRole('searchbox',{name:'Search cards',exact:true}).fill('Lancelot');await wait(first.getByRole('button',{name:'View Lancelot',exact:true}));
  await first.getByRole('button',{name:'View Lancelot',exact:true}).click();const detail=role(tab,'dialog','Lancelot details');await wait(detail);
  await capture('compiled-card-detail');
  const style=await tab.playwright.evaluate(()=>{const surface=document.querySelector('.module-style-boundary').shadowRoot;return {bodyFont:getComputedStyle(document.body).fontFamily,moduleFont:getComputedStyle(surface.querySelector('.module-appearance')).fontFamily,fontLoaded:document.fonts.check('16px Poppins'),images:[...surface.querySelectorAll('img')].map(img=>({src:img.currentSrc||img.src,loaded:img.complete&&img.naturalWidth>0})),sheets:document.styleSheets.length,base:location.pathname};});
  check(style.bodyFont==='Georgia, serif'&&style.moduleFont.includes('Poppins')&&style.fontLoaded,'Declared host font/CSS contract failed');check(style.images.some(i=>i.loaded&&!i.src.startsWith('data:')),'Host-resolved catalog image not loaded');check(style.base==='/delivery-proof/','Consumer base path lost');report.assetFontEvidence=style;
  await role(tab,'button','Close panel').press('Escape');await detail.waitFor({state:'hidden',timeoutMs:15000});done('compiled-exports-base-path-declared-fonts-images-overlay');
  if(!mobile){await role(tab,'combobox','Consumer surface width').selectOption('390');check((await first.getByRole('searchbox',{name:'Search cards'}).evaluate(el=>el.value))==='Lancelot','Resizing lost consumer input');await role(tab,'combobox','Consumer surface width').selectOption('720');}
  await role(tab,'checkbox','Second built module').check();const second=role(tab,'region','Second built module');await wait(second.getByRole('heading',{name:'Card Database',exact:true}));
  const read=()=>tab.playwright.evaluate(()=>[...document.querySelectorAll('.module-style-boundary')].map(node=>{const s=node.shadowRoot;return {font:getComputedStyle(s.querySelector('.module-appearance')).fontFamily,search:s.querySelector('[aria-label="Search cards"]').value,images:[...s.querySelectorAll('img')].map(img=>img.currentSrc||img.src)};}));
  const before=await read();check(before.length===2&&before[0].font.includes('Poppins')&&before[1].font.includes('Georgia')&&before[0].search==='Lancelot'&&before[1].search==='','Compiled instances share input/fonts');
  await role(tab,'checkbox','Alternate asset contract').check();await capture('independent-assets-fonts');const alternate=await read();check(alternate[0].images.some(src=>src.startsWith('data:image/')),'First instance did not use explicit placeholder contract');check(alternate[1].images.some(src=>!src.startsWith('data:')),'Second instance inherited first asset override');
  await role(tab,'checkbox','Alternate asset contract').uncheck();await role(tab,'checkbox','Second built module').uncheck();check(await role(tab,'region','Second built module').count()===0,'Second compiled surface survived disposal');done('independent-assets-fonts-state-responsive-disposal');
  await role(tab,'button','Deck Builder').click();await wait(role(tab,'button','Export'));await wait(role(tab,'button','Draw Hand').and(tab.playwright.locator(':enabled')));
  check(await role(tab,'button','Save').count()===0&&await role(tab,'textbox','Deck name').count()===0,'Read-only consumer gained writes');
  await role(tab,'button','Draw Hand').click();await wait(role(tab,'dialog','Drawn Hand'));check(await role(tab,'dialog','Drawn Hand').getByRole('button').count()===10,'Server draw does not contain the expected eight cards');await capture('compiled-server-draw');await role(tab,'button','Close panel').click();
  await role(tab,'button','Export').click();await wait(role(tab,'dialog','Export deck JSON').getByRole('button',{name:'Copy to clipboard',exact:true}).and(tab.playwright.locator(':enabled')));
  const json=JSON.parse(await role(tab,'dialog','Export deck JSON').locator('pre').textContent());check(json.total_cards===8&&json.total_threat===18&&json.limited===true&&json.cards.power_cards.length===5&&json.cards.special_cards.Lancelot.length===3,'Server export differs from characterized fixture');report.exportAssertions={cards:json.total_cards,threat:json.total_threat,limited:json.limited,powers:json.cards.power_cards.length,specials:json.cards.special_cards.Lancelot.length};await capture('compiled-server-export');await role(tab,'button','Close panel').click();done('compiled-readonly-server-draw-export');
  await role(tab,'button','Collection').click();await wait(role(tab,'heading','My Collection'));await capture('compiled-collection');check(await role(tab,'button','Save').count()===0,'Collection retained deck editor');await role(tab,'button','Card Database').click();await wait(first.getByRole('heading',{name:'Card Database',exact:true}));done('compiled-route-callbacks-collection-return');
 } catch(error) {report.scenarios.push({id:'built-delivery',status:'failed',reason:String(error)});try{await capture('failure');}catch{}}
 report.browserErrors=await tab.dev.logs({levels:['error'],limit:20});await viewport.reset();report.cleanup={applicationRecords:'unchanged; selected operations read-only/stateless',viewport:'reset',tab:'caller closes or retains identified preview'};report.counts={passed:report.scenarios.filter(s=>s.status==='passed').length,failed:report.scenarios.filter(s=>s.status==='failed').length,blocked:Math.max(0,4-report.scenarios.filter(s=>s.status==='passed').length),skipped:0};report.status=report.counts.passed===4&&report.counts.failed===0&&report.browserErrors.length===0?'passed':'needs review';report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}

/** Actual missing local asset, not a mocked component event or absent image input. */
export async function runMissingImageFallback({tab,target,evidenceDir}) {
 check(target?.verified&&target.environment==='local','Verified loopback target required');
 const origin=new URL(await tab.url());check(['localhost','127.0.0.1'].includes(origin.hostname)&&origin.pathname==='/delivery-proof/','Select the local compiled consumer');
 const report={schema:1,kind:'browser',environment:'local',sourceRevision:target.sourceRevision,inputFingerprint:target.sourceTreeFingerprint,actor:'Guest',method:'CUA compiled module; real missing local URL and emitted placeholder fallback',scenarios:[],evidence:[],acceptance:'Automated only; Kyle acceptance separate',cleanup:{applicationRecords:'unchanged'},gaps:['No production asset or external host proof']};
 try {
  await tab.reload();await wait(role(tab,'heading','Card Database'));const first=role(tab,'region','Built module');
  await first.getByRole('searchbox',{name:'Search cards',exact:true}).fill('Lancelot');await wait(first.getByRole('button',{name:'View Lancelot',exact:true}));
  await role(tab,'checkbox','Second built module').check();await wait(role(tab,'region','Second built module').getByRole('heading',{name:'Card Database',exact:true}));
  await role(tab,'checkbox','Missing first-module art').check();
  await tab.getAXState({emit:false});
  const state=await tab.playwright.evaluate(()=>[...document.querySelectorAll('.module-style-boundary')].map(node=>[...node.shadowRoot.querySelectorAll('.card-tile__art img')].map(img=>({src:img.currentSrc||img.src,loaded:img.complete&&img.naturalWidth>0}))));
  check(state[0].some(img=>img.src.startsWith('data:image/webp')&&img.loaded),'Missing first-module art did not load the emitted placeholder');check(state[1].some(img=>!img.src.startsWith('data:')&&img.loaded),'Missing asset override leaked into the second module');
  report.evidence.push(await captureBrowserEvidence(tab,evidenceDir,'missing-art-fallback'));report.scenarios.push({id:'real-missing-image-fallback-and-isolation',status:'passed'});
 }catch(error){report.scenarios.push({id:'real-missing-image-fallback-and-isolation',status:'failed',reason:error.message});}
 finally{try{await role(tab,'checkbox','Missing first-module art').uncheck();await role(tab,'checkbox','Second built module').uncheck();report.cleanup.fixture='missing-image injection and second module disabled';}catch{report.cleanup.fixture='BLOCKED: restore fixture controls';}}
 const errors=await tab.dev.logs({levels:['error'],limit:50});report.expectedMissingAssetErrors=errors.filter(e=>String(e.message).includes('fictional-m8-missing.webp'));report.unexpectedErrors=errors.filter(e=>!String(e.message).includes('fictional-m8-missing.webp'));
 report.counts={passed:report.scenarios.filter(s=>s.status==='passed').length,failed:report.scenarios.filter(s=>s.status==='failed').length,skipped:0,blocked:0};report.status=report.counts.passed===1&&report.unexpectedErrors.length===0&&!String(report.cleanup.fixture).startsWith('BLOCKED')?'passed':'needs review';report.reportPath=await writeBrowserReport(evidenceDir,report);return report;
}
