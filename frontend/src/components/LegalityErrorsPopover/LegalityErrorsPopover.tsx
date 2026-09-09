import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import './LegalityErrorsPopover.css';

const LONG_PRESS_DURATION_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

export interface LegalityErrorsPopoverProps {
  errors: string[];
  /** When true, open the errors with a deliberate press-and-hold instead of hover. */
  pressAndHold?: boolean;
  children: ReactNode;
}

export function LegalityErrorsPopover({
  errors,
  pressAndHold = false,
  children,
}: LegalityErrorsPopoverProps) {
  const listId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [pressAndHoldPanelStyle, setPressAndHoldPanelStyle] = useState<CSSProperties>();
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerInteractionRef = useRef(false);
  const suppressNextClickRef = useRef(false);

  const cancelLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  };

  useEffect(() => cancelLongPress, []);

  const positionPressAndHoldPanel = () => {
    const root = rootRef.current;
    if (!root) return;

    const anchor = root.getBoundingClientRect();
    const gutter = 12;
    const gap = 6;
    const width = Math.min(420, window.innerWidth - gutter * 2);
    const left = Math.min(Math.max(anchor.left, gutter), window.innerWidth - width - gutter);
    const top = anchor.bottom + gap;

    setPressAndHoldPanelStyle({
      top,
      left,
      width,
      maxHeight: `min(50dvh, calc(100dvh - ${top}px - var(--bottom-nav-height) - env(safe-area-inset-bottom, 0px) - var(--space-3)))`,
    });
  };

  useEffect(() => {
    if (!pressAndHold || !open) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        rootRef.current?.focus();
      }
    };

    positionPressAndHoldPanel();
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', positionPressAndHoldPanel);
    window.addEventListener('scroll', positionPressAndHoldPanel, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', positionPressAndHoldPanel);
      window.removeEventListener('scroll', positionPressAndHoldPanel, true);
    };
  }, [open, pressAndHold]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (
      !pressAndHold ||
      event.button !== 0 ||
      (event.target as Element).closest('.legality-errors-popover__panel')
    ) {
      return;
    }

    cancelLongPress();
    pointerInteractionRef.current = true;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      pointerStartRef.current = null;
      suppressNextClickRef.current = true;
      positionPressAndHoldPanel();
      setOpen(true);
    }, LONG_PRESS_DURATION_MS);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;

    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (moved > LONG_PRESS_MOVE_TOLERANCE_PX) {
      cancelLongPress();
    }
  };

  const handlePointerEnd = () => {
    cancelLongPress();
    pointerInteractionRef.current = false;
    if (suppressNextClickRef.current) {
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    }
  };

  if (errors.length === 0) {
    return <>{children}</>;
  }

  const list = (
    <ul id={listId} className="legality-errors-popover__list">
      {errors.map((error, index) => (
        <li key={`${index}-${error}`}>{error}</li>
      ))}
    </ul>
  );

  const panel = (
    <div
      ref={pressAndHold ? panelRef : undefined}
      id={panelId}
      className={[
        'legality-errors-popover__panel',
        pressAndHold ? 'legality-errors-popover__panel--press-and-hold' : '',
        open ? 'legality-errors-popover__panel--open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role={pressAndHold ? 'dialog' : 'tooltip'}
      aria-label={pressAndHold ? 'Deck validation errors' : undefined}
      style={pressAndHold ? pressAndHoldPanelStyle : undefined}
    >
      {pressAndHold ? (
        <div className="legality-errors-popover__header">
          <span>{errors.length} legality {errors.length === 1 ? 'issue' : 'issues'}</span>
          <button
            type="button"
            className="legality-errors-popover__close"
            onClick={() => setOpen(false)}
            aria-label="Close deck validation errors"
          >
            Close
          </button>
        </div>
      ) : null}
      {list}
    </div>
  );

  return (
    <>
      <span
        ref={rootRef}
        className={[
          'legality-errors-popover',
          pressAndHold ? 'legality-errors-popover--press-and-hold' : '',
          open ? 'legality-errors-popover--open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        tabIndex={0}
        aria-describedby={listId}
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={pressAndHold ? 'Deck is not legal. Press and hold to view validation errors.' : undefined}
        onMouseEnter={() => {
          if (!pressAndHold) setOpen(true);
        }}
        onMouseLeave={() => {
          if (!pressAndHold) setOpen(false);
        }}
        onFocus={() => {
          if (!pressAndHold || !pointerInteractionRef.current) setOpen(true);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(event) => {
          if (pressAndHold) event.preventDefault();
        }}
        onClickCapture={(event) => {
          if (!suppressNextClickRef.current) return;
          suppressNextClickRef.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {children}
        {pressAndHold ? null : panel}
      </span>
      {pressAndHold ? createPortal(panel, document.body) : null}
    </>
  );
}
