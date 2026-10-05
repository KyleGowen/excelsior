/// <reference path="../../../frontend/src/vite-env.d.ts" />
import { act, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { ModuleHostProvider, type ModuleHost, createModuleApi } from '../../../frontend/src/modules';
import { ModuleAppearanceBoundary, type ModuleAppearanceOptions } from '../../../frontend/src/modules/ModuleAppearanceBoundary';
import { useOverlayHost } from '../../../frontend/src/lib/layout/OverlayHostProvider';

let element: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const base: ModuleHost = { api: createModuleApi(), identity: { user: null, isGuest: true, isAdmin: false }, onOpenDeck() {}, onBack() {}, onHome() {} };
const mount = async (node: ReactNode) => { await act(async () => root.render(node)); };
const host = (appearance?: ModuleAppearanceOptions): ModuleHost => ({ ...base, ...(appearance ? { appearance } : {}) });
function DraftProbe() { const [value, setValue] = useState('unsaved fixture'); return <><input aria-label="Draft" value={value} readOnly /><button onClick={() => setValue('changed fixture')}>Change local draft</button></>; }
function PortalProbe() { const overlay = useOverlayHost(); return overlay ? createPortal(<button>Portal action</button>, overlay.root) : null; }
beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; element = document.createElement('div'); document.body.append(element); root = createRoot(element); });
afterEach(async () => { await act(async () => root.unmount()); element.remove(); });
it('preserves ordinary host DOM and adds no appearance boundary when omitted', async () => {
 await mount(<ModuleHostProvider host={base}><DraftProbe /></ModuleHostProvider>);
 expect(element.querySelector('.module-appearance')).toBeNull(); expect(element.firstElementChild?.tagName).toBe('INPUT');
});
it('keeps two instances independent without changing document/body or preference storage', async () => {
 const before = [document.documentElement.getAttribute('style'), document.body.getAttribute('style'), document.documentElement.className, localStorage.length];
 await mount(<><ModuleHostProvider host={host({ tokens: { '--color-text': '#20252f', '--font-sans': 'Georgia, serif' }, colorScheme: 'light' })}><p>Paper</p></ModuleHostProvider><ModuleHostProvider host={host({ tokens: { '--color-text': '#ffffff', '--font-sans': 'Arial, sans-serif' }, colorScheme: 'dark' })}><p>Contrast</p></ModuleHostProvider></>);
 const [paper, contrast] = Array.from(element.querySelectorAll<HTMLDivElement>('.module-appearance'));
 expect(paper!.style.getPropertyValue('--color-text')).toBe('#20252f'); expect(contrast!.style.getPropertyValue('--color-text')).toBe('#ffffff');
 expect(paper!.style.colorScheme).toBe('light'); expect(contrast!.style.colorScheme).toBe('dark');
 expect([document.documentElement.getAttribute('style'), document.body.getAttribute('style'), document.documentElement.className, localStorage.length]).toEqual(before);
});
it('updates and removes token overrides without remounting, losing a draft or moving focus', async () => {
 const view = (appearance: ModuleAppearanceOptions) => <ModuleHostProvider host={host(appearance)}><DraftProbe /></ModuleHostProvider>;
 await mount(view({ tokens: { '--color-text': '#123456', '--space-4': '20px' }, colorScheme: 'light' }));
 await act(async () => (element.querySelector('button') as HTMLButtonElement).click());
 const input = element.querySelector('input')!; input.focus(); const boundary = element.querySelector('.module-appearance');
 await mount(view({ tokens: { '--color-text': '#abcdef' }, colorScheme: 'dark' }));
 expect(element.querySelector('.module-appearance')).toBe(boundary); expect(element.querySelector('input')).toBe(input); expect(input.value).toBe('changed fixture'); expect(document.activeElement).toBe(input);
 expect((boundary as HTMLDivElement).style.getPropertyValue('--space-4')).toBe('');
 await mount(view({})); expect(input.value).toBe('changed fixture'); expect((boundary as HTMLDivElement).style.getPropertyValue('--color-text')).toBe(''); expect((boundary as HTMLDivElement).style.colorScheme).toBe('');
});
it('places a configured portal under its appearance boundary and disposes only its content', async () => {
 let portal: HTMLDivElement | null = null;
 function Fixture({ tokens }: { tokens: ModuleAppearanceOptions }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return <ModuleHostProvider host={{ ...host(tokens), ...(target ? { overlays: { root: target } } : {}) }}><div ref={node => { portal = node; setTarget(node); }} /><PortalProbe /></ModuleHostProvider>;
 }
 await mount(<Fixture tokens={{ tokens: { '--color-text': '#20252f' } }} />); const original = portal!;
 expect(original.querySelector('button')?.textContent).toBe('Portal action'); expect(original.closest('.module-appearance')).not.toBeNull();
 await mount(<Fixture tokens={{ tokens: { '--color-text': '#ffffff' } }} />); expect(portal).toBe(original); expect((original.closest('.module-appearance') as HTMLDivElement).style.getPropertyValue('--color-text')).toBe('#ffffff');
 await mount(null); expect(original.children).toHaveLength(0); expect(document.documentElement.style.getPropertyValue('--color-text')).toBe('');
});
it.each([{ tokens: { '--z-modal': '1' } }, { tokens: { '--color-text': '' } }, { tokens: { '--color-text': 42 } }, { tokens: { '--color-text': 'x'.repeat(513) } }, { tokens: [] }, { colorScheme: 'automatic' }])('rejects unsupported layout/stacking, invalid token maps and invalid values: %j', options => {
 expect(() => ModuleAppearanceBoundary({ options: options as unknown as ModuleAppearanceOptions, children: null })).toThrow();
});
