import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { OverlayHostProvider } from '../../../frontend/src/lib/layout/OverlayHostProvider';
import { SlideOutPanel } from '../../../frontend/src/components/SlideOutPanel';

let mountNode: HTMLDivElement;
let portalA: HTMLDivElement;
let portalB: HTMLDivElement;
let trigger: HTMLButtonElement;
let root: ReturnType<typeof createRoot>;
const render = async (element: ReactNode) => { await act(async () => root.render(element)); await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); }); };
const key = (value: string, shiftKey = false) => { const event = new KeyboardEvent('keydown', { key: value, shiftKey, bubbles: true, cancelable: true }); document.activeElement!.dispatchEvent(event); return event; };
const panel = (close: () => void, label = 'Fictional host panel', open = true, closeOnEscape = true) => <SlideOutPanel open={open} onClose={close} ariaLabel={label} closeOnEscape={closeOnEscape}><button>First action</button><button>Last action</button></SlideOutPanel>;
beforeEach(() => {
 (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
 mountNode = document.createElement('div'); portalA = document.createElement('div'); portalB = document.createElement('div'); trigger = document.createElement('button');
 document.body.append(mountNode, portalA, portalB, trigger); root = createRoot(mountNode); trigger.focus();
});
afterEach(async () => { await act(async () => root.unmount()); mountNode.remove(); portalA.remove(); portalB.remove(); trigger.remove(); });
it('preserves inline/default modal placement without a host root', async () => {
 await render(panel(jest.fn()));
 expect(mountNode.querySelector('[role="dialog"]')).not.toBeNull();
 expect(portalA.children).toHaveLength(0);
 expect(mountNode.querySelector('.slideout--absolute')).toBeNull();
 expect(mountNode.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true');
});
it('uses only the supplied portal and leaves document/body attributes unchanged', async () => {
 const before = [document.documentElement.outerHTML.split('>')[0], document.body.outerHTML.split('>')[0]];
 await render(<OverlayHostProvider options={{ root: portalA }}>{panel(jest.fn())}</OverlayHostProvider>);
 expect(portalA.querySelector('.slideout--absolute')).not.toBeNull();
 expect(mountNode.querySelector('[role="dialog"]')).toBeNull(); expect(portalB.children).toHaveLength(0);
 expect([document.documentElement.outerHTML.split('>')[0], document.body.outerHTML.split('>')[0]]).toEqual(before);
});
it('focuses the host panel and restores its connected trigger on close', async () => {
 const content = (open: boolean) => <OverlayHostProvider options={{ root: portalA }}>{panel(jest.fn(), 'Fictional panel', open)}</OverlayHostProvider>;
 await render(content(true)); expect(document.activeElement).toBe(portalA.querySelector('[role="dialog"]'));
 await render(content(false)); expect(portalA.children).toHaveLength(0); expect(document.activeElement).toBe(trigger);
});
it('Escape dismisses only the focused panel across independent roots', async () => {
 const first = jest.fn(); const second = jest.fn();
 await render(<><OverlayHostProvider options={{ root: portalA }}>{panel(first, 'First panel')}</OverlayHostProvider><OverlayHostProvider options={{ root: portalB }}>{panel(second, 'Second panel')}</OverlayHostProvider></>);
 await act(async () => { key('Escape'); }); expect(second).toHaveBeenCalledTimes(1); expect(first).not.toHaveBeenCalled();
 (portalA.querySelector('[role="dialog"]') as HTMLElement).focus();
 await act(async () => { key('Escape'); }); expect(first).toHaveBeenCalledTimes(1); expect(second).toHaveBeenCalledTimes(1);
});
it('wraps Tab/Shift-Tab inside a configured modal panel', async () => {
 await render(<OverlayHostProvider options={{ root: portalA }}>{panel(jest.fn())}</OverlayHostProvider>);
 const buttons = portalA.querySelectorAll<HTMLButtonElement>('button');
 expect(key('Tab').defaultPrevented).toBe(true); expect(document.activeElement).toBe(buttons[0]);
 expect(key('Tab', true).defaultPrevented).toBe(true); expect(document.activeElement).toBe(buttons[2]);
 expect(key('Tab').defaultPrevented).toBe(true); expect(document.activeElement).toBe(buttons[0]);
});
it('permits nonmodal host focus and explicit fixed positioning', async () => {
 await render(<OverlayHostProvider options={{ root: portalA, modal: false, position: 'fixed' }}>{panel(jest.fn())}</OverlayHostProvider>);
 expect(portalA.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('false');
 expect(portalA.querySelector('.slideout--absolute')).toBeNull();
 (portalA.querySelectorAll('button')[2] as HTMLButtonElement).focus(); expect(key('Tab').defaultPrevented).toBe(false);
});
it('removes the portal and keyboard listener when the host unmounts', async () => {
 const close = jest.fn(); const remove = jest.spyOn(document, 'removeEventListener');
 await render(<OverlayHostProvider options={{ root: portalA }}>{panel(close)}</OverlayHostProvider>);
 await render(null); expect(portalA.children).toHaveLength(0); expect(remove.mock.calls.some(([name]) => name === 'keydown')).toBe(true);
 key('Escape'); expect(close).not.toHaveBeenCalled(); remove.mockRestore();
});
it('retains closeOnEscape=false and uses the current close callback', async () => {
 const old = jest.fn(); const current = jest.fn();
 await render(<OverlayHostProvider options={{ root: portalA }}>{panel(old, 'Fictional', true, false)}</OverlayHostProvider>);
 key('Escape'); expect(old).not.toHaveBeenCalled();
 await render(<OverlayHostProvider options={{ root: portalA }}>{panel(current)}</OverlayHostProvider>);
 key('Escape'); expect(current).toHaveBeenCalledTimes(1); expect(old).not.toHaveBeenCalled();
});
it('does not inherit another host portal when a nested host omits options', async () => {
 await render(<OverlayHostProvider options={{ root: portalA }}><OverlayHostProvider>{panel(jest.fn())}</OverlayHostProvider></OverlayHostProvider>);
 expect(mountNode.querySelector('[role="dialog"]')).not.toBeNull(); expect(portalA.children).toHaveLength(0);
});
it('moves an open panel when the declared root changes and clears the old root', async () => {
 const content = (target: HTMLElement) => <OverlayHostProvider options={{ root: target }}>{panel(jest.fn())}</OverlayHostProvider>;
 await render(content(portalA)); await render(content(portalB));
 expect(portalA.children).toHaveLength(0); expect(portalB.querySelector('[role="dialog"]')).not.toBeNull();
 expect(document.activeElement).toBe(portalB.querySelector('[role="dialog"]'));
});
