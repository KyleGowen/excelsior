export interface CardDetailNavigation {
  (delta: number): void;
  (to: '.', options: { state: Record<string, unknown>; replace: boolean }): void;
}

export const CARD_DETAIL_STATE_KEY = 'cardDetailOpen';
export const DECK_CARD_DETAIL_STATE_KEY = 'deckCardDetail';

export interface CardDetailHistoryController {
  attach: (locationState: object | null) => void;
  detach: () => void;
  reset: () => void;
  close: () => void;
}

/**
 * Imperative history controller for card detail overlays. Used by {@link useCardDetailHistory}.
 */
export function createCardDetailHistoryController(
  navigate: CardDetailNavigation,
  onClose: () => void,
  stateKey: string,
): CardDetailHistoryController {
  let historyActive = false;
  let closingFromPop = false;
  let popListener: (() => void) | null = null;

  const detach = () => {
    if (popListener) {
      window.removeEventListener('popstate', popListener);
      popListener = null;
    }
  };

  const attach = (locationState: object | null) => {
    const handlePopState = () => {
      if (!historyActive) return;
      closingFromPop = true;
      historyActive = false;
      onClose();
    };

    if (popListener) {
      window.removeEventListener('popstate', popListener);
    }
    popListener = handlePopState;
    window.addEventListener('popstate', handlePopState);

    if (historyActive) return;

    navigate('.', {
      state: {
        ...(locationState ?? {}),
        [stateKey]: true,
      },
      replace: false,
    });
    historyActive = true;
  };

  const reset = () => {
    historyActive = false;
    closingFromPop = false;
  };

  const close = () => {
    const hadHistory = historyActive;
    historyActive = false;
    onClose();
    if (hadHistory && !closingFromPop) {
      navigate(-1);
    }
    closingFromPop = false;
  };

  return { attach, detach, reset, close };
}
