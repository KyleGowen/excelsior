import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Uniform scale so the full drawn hand fits in the panel width (desktop/tablet only).
 * Returns 1 on layout-mobile — the two-column grid scrolls in the panel body instead.
 */
export function useDrawHandScale(
  rowRef: RefObject<HTMLElement | null>,
  cardCount: number,
): number {
  const { isMobile } = useLayoutMode();
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el || cardCount === 0) {
      setScale(1);
      return;
    }

    const update = () => {
      if (isMobile) {
        setScale(1);
        return;
      }
      const parsed = parseFloat(getComputedStyle(el).getPropertyValue('--deck-editor-portrait-col'));
      const baseWidth = Number.isFinite(parsed) && parsed > 0 ? parsed : 210;
      const inner = el.firstElementChild;
      const gapSource = inner instanceof HTMLElement ? inner : el;
      const gap =
        parseFloat(getComputedStyle(gapSource).columnGap || getComputedStyle(gapSource).gap) ||
        16;
      const available = el.clientWidth;
      const needed =
        cardCount * baseWidth + Math.max(0, cardCount - 1) * gap;
      setScale(needed > 0 && available > 0 ? Math.min(1, available / needed) : 1);
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);

    update();

    return () => {
      ro.disconnect();
    };
  }, [cardCount, rowRef, isMobile]);

  return scale;
}
