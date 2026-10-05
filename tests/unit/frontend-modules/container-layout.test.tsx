/// <reference path="../../../frontend/src/vite-env.d.ts" />
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ContainerLayoutModeProvider } from '../../../frontend/src/lib/layout/ContainerLayoutModeProvider';
import { useLayoutMode } from '../../../frontend/src/lib/layout/LayoutModeProvider';

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let defaultWidth: number;
const widths = new WeakMap<Element, number>();
const observers: TestObserver[] = [];
class TestObserver {
 target: Element | undefined;
 disconnected = false;
 constructor(readonly callback: ResizeObserverCallback) { observers.push(this); }
 observe(target: Element) { this.target = target; }
 disconnect() { this.disconnected = true; }
 fire() { this.callback([], this as unknown as ResizeObserver); }
}
function Probe({ name }: { name: string }) {
 const layout = useLayoutMode();
 return <><output aria-label={name}>{layout.isMobile ? 'mobile' : 'desktop'}</output><button onClick={() => layout.setPreferDesktop(!layout.preferDesktop)}>Toggle {name}</button></>;
}
const render = async (value: ReactNode) => { await act(async () => root.render(value)); };
beforeEach(() => {
 (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
 defaultWidth = 1120; observers.length = 0;
 window.ResizeObserver = TestObserver as unknown as typeof ResizeObserver;
 jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function(this: Element) { return { width: widths.get(this) ?? defaultWidth } as DOMRect; });
 container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks(); });
it('chooses layout from its own width and responds to container resize without window resize', async () => {
 await render(<ContainerLayoutModeProvider options={{ mode: 'container' }}><Probe name="A" /></ContainerLayoutModeProvider>);
 expect(container.textContent).toContain('desktop'); const observer = observers[0]!;
 widths.set(observer.target!, 390); await act(async () => observer.fire());
 expect(container.querySelector('[aria-label="A"]')?.textContent).toBe('mobile');
 expect(container.querySelector('.module-layout-container')?.getAttribute('data-layout-mode')).toBe('mobile');
 widths.set(observer.target!, 1120); await act(async () => observer.fire());
 expect(container.querySelector('[aria-label="A"]')?.textContent).toBe('desktop');
});
it('keeps two independently sized host instances independent and leaves document/body untouched', async () => {
 const before = [document.documentElement.className, document.body.getAttribute('style')];
 await render(<><ContainerLayoutModeProvider options={{ mode: 'container' }}><Probe name="A" /></ContainerLayoutModeProvider><ContainerLayoutModeProvider options={{ mode: 'container' }}><Probe name="B" /></ContainerLayoutModeProvider></>);
 widths.set(observers[0]!.target!, 390); await act(async () => observers[0]!.fire());
 expect(container.querySelector('[aria-label="A"]')?.textContent).toBe('mobile'); expect(container.querySelector('[aria-label="B"]')?.textContent).toBe('desktop');
 expect([document.documentElement.className, document.body.getAttribute('style')]).toEqual(before);
});
it('uses an inclusive configurable threshold and updates it without replacing the observer', async () => {
 defaultWidth = 720; const content = (max: number) => <ContainerLayoutModeProvider options={{ mode: 'container', mobileMaxWidth: max }}><Probe name="A" /></ContainerLayoutModeProvider>;
 await render(content(720)); expect(container.querySelector('[aria-label="A"]')?.textContent).toBe('mobile');
 await render(content(719)); expect(container.querySelector('[aria-label="A"]')?.textContent).toBe('desktop'); expect(observers).toHaveLength(1);
});
it('keeps desktop preference local without writing device storage or changing another host', async () => {
 defaultWidth = 390; const stored = localStorage.getItem('preferDesktopLayout'); const listener = jest.fn(); window.addEventListener('layout-mode-change', listener);
 await render(<><ContainerLayoutModeProvider options={{ mode: 'container' }}><Probe name="A" /></ContainerLayoutModeProvider><ContainerLayoutModeProvider options={{ mode: 'container' }}><Probe name="B" /></ContainerLayoutModeProvider></>);
 await act(async () => (container.querySelector('button') as HTMLButtonElement).click());
 expect(container.querySelector('[aria-label="A"]')?.textContent).toBe('desktop'); expect(container.querySelector('[aria-label="B"]')?.textContent).toBe('mobile');
 expect(localStorage.getItem('preferDesktopLayout')).toBe(stored); expect(listener).not.toHaveBeenCalled(); window.removeEventListener('layout-mode-change', listener);
});
it('disconnects on disposal and ignores a queued measurement after unmount', async () => {
 await render(<ContainerLayoutModeProvider options={{ mode: 'container' }}><Probe name="A" /></ContainerLayoutModeProvider>);
 const observer = observers[0]!; await render(null); expect(observer.disconnected).toBe(true);
 await act(async () => observer.fire()); expect(container.children).toHaveLength(0);
});
it('uses safe mobile presentation while a hidden container has zero width', async () => {
 defaultWidth = 0; await render(<ContainerLayoutModeProvider options={{ mode: 'container' }}><Probe name="A" /></ContainerLayoutModeProvider>);
 expect(container.querySelector('[aria-label="A"]')?.textContent).toBe('mobile');
});
it('cleans up the limited window-resize fallback when ResizeObserver is unavailable', async () => {
 window.ResizeObserver = undefined as unknown as typeof ResizeObserver;
 const remove = jest.spyOn(window, 'removeEventListener');
 await render(<ContainerLayoutModeProvider options={{ mode: 'container' }}><Probe name="A" /></ContainerLayoutModeProvider>);
 defaultWidth = 390; await act(async () => window.dispatchEvent(new Event('resize')));
 expect(container.querySelector('[aria-label="A"]')?.textContent).toBe('mobile'); await render(null);
 expect(remove.mock.calls.some(([name]) => name === 'resize')).toBe(true);
});
