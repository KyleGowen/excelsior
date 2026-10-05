/// <reference path="../../../frontend/src/vite-env.d.ts" />
import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ModuleHostProvider,type ModuleHost,createModuleApi} from '../../../frontend/src/modules';
import {SlideOutPanel} from '../../../frontend/src/components/SlideOutPanel';
import {scopeNativeStyles} from '../../../frontend/src/modules/nativeStyles';
import {activeElement} from '../../../frontend/src/lib/layout/activeElement';
let container:HTMLDivElement;let root:ReturnType<typeof createRoot>;let host:ModuleHost;
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.append(container);root=createRoot(container);host={api:createModuleApi(),identity:{user:null,isGuest:true,isAdmin:false},onOpenDeck:()=>{},onBack:()=>{},onHome:()=>{},styles:{mode:'isolated'},appearance:{tokens:{'--font-size-base':'1rem'}}};});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const mount=async(children:React.ReactNode)=>{await act(async()=>root.render(<ModuleHostProvider host={host}>{children}</ModuleHostProvider>));};
it('contains tokens/reset/root sizing and uses its container rather than document rem/viewport units',()=>{
 const css=scopeNativeStyles(':root{--font:1rem} body,#root{height:100vh} @media (min-width:1201px){.a{width:90vw}}');
 expect(css).toContain(':host');expect(css).toContain('var(--module-root-font-size, 16px)');expect(css).toContain('100cqh');expect(css).toContain('90cqw');expect(css).toContain('@container (min-width: 1201px)');expect(css).not.toMatch(/:root|#root|\bbody\b/);
});
it('puts only its stylesheet and controls in its own shadow root and keeps token updates mounted',async()=>{
 const marker=document.createElement('style');marker.textContent='button{color:purple}';document.head.append(marker);
 await mount(<input aria-label="Local draft" defaultValue="retained"/>);
 const node=container.querySelector('.module-style-boundary')!;const shadow=node.shadowRoot!;
 expect(shadow.querySelector('style')).not.toBeNull();expect(container.querySelector('input')).toBeNull();
 const input=shadow.querySelector('input')!;input.value='Edited locally';
 host={...host,appearance:{tokens:{'--font-size-base':'2rem'}}};await mount(<input aria-label="Local draft" defaultValue="retained"/>);
 expect(container.querySelector('.module-style-boundary')).toBe(node);expect(shadow.querySelector('input')).toBe(input);expect(input.value).toBe('Edited locally');expect(document.head.contains(marker)).toBe(true);
 expect((shadow.querySelector('.module-appearance') as HTMLElement).style.getPropertyValue('--font-size-base')).toContain('var(--module-root-font-size');
 await mount(null);expect(shadow.querySelector('[aria-label="Local draft"]')).toBeNull();marker.remove();
});
function PanelFixture(){const[open,setOpen]=useState(false);return <><button onClick={()=>setOpen(true)}>Open fixture panel</button><SlideOutPanel open={open} onClose={()=>setOpen(false)} ariaLabel="Native focus fixture"><button>Only action</button></SlideOutPanel></>;}
it('places overlays inside the native surface, traps focus there and restores the actual shadow trigger',async()=>{
 await mount(<PanelFixture/>);const shadow=container.querySelector('.module-style-boundary')!.shadowRoot!;const trigger=shadow.querySelector('button')!;trigger.focus();
 await act(async()=>trigger.click());await act(async()=>{await new Promise(r=>setTimeout(r,5));});
 const panel=shadow.querySelector('[role="dialog"]')!;expect(panel.closest('[aria-label="Native module overlay root"]')).not.toBeNull();expect(activeElement()).toBe(panel);
 await act(async()=>panel.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,composed:true})));
 expect(shadow.querySelector('[role="dialog"]')).toBeNull();expect(activeElement()).toBe(trigger);
});
it('keeps separate surfaces and disposes only the removed instance',async()=>{
 await act(async()=>root.render(<><ModuleHostProvider host={host}><button>Left</button></ModuleHostProvider><ModuleHostProvider host={{...host,appearance:{tokens:{'--color-text':'red'}}}}><button>Right</button></ModuleHostProvider></>));
 const nodes=container.querySelectorAll('.module-style-boundary');expect(nodes).toHaveLength(2);expect(nodes[0].shadowRoot?.textContent).toContain('Left');expect(nodes[1].shadowRoot?.textContent).toContain('Right');
 await act(async()=>root.render(<ModuleHostProvider host={host}><button>Left</button></ModuleHostProvider>));expect(container.querySelectorAll('.module-style-boundary')).toHaveLength(1);expect(document.querySelector('[aria-label="Native module overlay root"]')).toBeNull();
});
