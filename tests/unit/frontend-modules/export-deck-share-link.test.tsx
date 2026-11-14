import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ExportDeckPanel } from '../../../frontend/src/features/deck-editor/ExportDeckPanel';
import { exportDeckFixture } from '../../../frontend/src/stories/exportDeckFixture';

const shareUrl = 'https://excelsior.cards/users/example-owner/decks/example-deck';
const input = { deck: exportDeckFixture, topDeck: 'Example TopDeck decklist' };
const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const writeText = jest.fn<Promise<void>, [string]>();
let container: HTMLDivElement;
let root: Root;

async function render(url?: string, loading = false, prepare?: () => Promise<void>) {
  await act(async () => root.render(
    <ExportDeckPanel open shareUrl={url} input={input} loading={loading} temporaryLink={Boolean(prepare)} onPrepareLink={prepare} onClose={() => {}} />,
  ));
}

function button(label: string) {
  return Array.from(container.querySelectorAll('button')).find(el => el.textContent?.trim() === label);
}

async function click(label: string) {
  const target = button(label);
  if (!target) throw new Error(`Missing button: ${label}`);
  await act(async () => target.click());
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
});

it('copies a saved deck URL while decklist data is loading', async () => {
  await render(shareUrl, true);
  expect(button('Copy decklist')?.disabled).toBe(true);
  await click('Copy deck link');
  expect(writeText).toHaveBeenCalledWith(shareUrl);
  expect(container.querySelector('[role=status]')?.textContent).toBe('Deck link copied');
});

it('selects the URL for manual copying when clipboard access fails', async () => {
  writeText.mockRejectedValueOnce(new Error('Clipboard denied'));
  await render(shareUrl);
  // Wait for the slide-out to take focus before simulating an action inside it.
  await act(async () => new Promise(resolve => setTimeout(resolve, 0)));
  await click('Copy deck link');
  const field = container.querySelector<HTMLInputElement>('input');
  expect(field?.value).toBe(shareUrl);
  expect(field?.readOnly).toBe(true);
  expect(document.activeElement).toBe(field);
  expect(field?.selectionStart).toBe(0);
  expect(field?.selectionEnd).toBe(shareUrl.length);
  expect(container.querySelector('[role=status]')?.textContent).toBe('Copy the selected link');
});

it('offers document exports when the host supplies no shareable link', async () => {
  await render();
  expect(button('Copy deck link')).toBeUndefined();
  await click('Copy decklist');
  expect(writeText).toHaveBeenLastCalledWith(input.topDeck);
  await click('JSON');
  await click('Copy JSON');
  expect(JSON.parse(writeText.mock.calls.at(-1)?.[0] ?? '')).toEqual(exportDeckFixture);
});

it('enables sharing before copying a temporary Guest link', async () => {
  const guestUrl = 'https://excelsior.cards/users/guest-account/decks/guest_1ccc190f-37c5-4dd1-a226-b30c65ae04be';
  const prepare = jest.fn(async () => { expect(writeText).not.toHaveBeenCalled(); });
  await render(guestUrl, false, prepare);
  await click('Copy deck link');
  expect(prepare).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith(guestUrl);
  expect(container.textContent).toContain('Anyone with the link can view the deck until it expires.');
});

it('keeps the copy action available to retry when sharing fails', async () => {
  const prepare = jest.fn().mockRejectedValueOnce(new Error('Share request failed')).mockResolvedValueOnce(undefined);
  await render(shareUrl, false, prepare);
  await click('Copy deck link');
  expect(writeText).not.toHaveBeenCalled();
  expect(container.querySelector('[role=status]')?.textContent).toBe('Could not share this deck. Try again.');
  await click('Copy deck link');
  expect(writeText).toHaveBeenCalledWith(shareUrl);
});
