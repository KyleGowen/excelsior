import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from '../icons';
import './SlideOutPanel.css';

interface SlideOutPanelProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Which edge the panel slides from. */
  side?: 'right' | 'bottom' | 'top';
  /** Viewport-fixed (default) or positioned within a relative ancestor. */
  position?: 'fixed' | 'absolute';
  /** Width for the right variant. */
  width?: number;
  className?: string;
  /** Accessible label when no visible title. */
  ariaLabel?: string;
  /** Whether this panel should respond to Escape. Disable when a child overlay owns dismissal. */
  closeOnEscape?: boolean;
}

/**
 * Accessible slide-out drawer. Right side on desktop, can be a bottom sheet.
 * Closes on Escape and backdrop click; restores focus to the trigger on close.
 * On mobile the right variant becomes full-width.
 */
export function SlideOutPanel({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  position = 'fixed',
  width = 380,
  className = '',
  ariaLabel,
  closeOnEscape = true,
}: SlideOutPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeOnEscapeRef = useRef(closeOnEscape);
  closeOnEscapeRef.current = closeOnEscape;

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscapeRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    // Move focus into the panel.
    const t = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`slideout${position === 'absolute' ? ' slideout--absolute' : ''}`}
      role="presentation"
    >
      <div className="slideout__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`slideout__panel slideout__panel--${side} ${className}`}
        style={side === 'right' ? { width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        <div className="slideout__header">
          <div className="slideout__title">{title}</div>
          <button type="button" className="slideout__close" onClick={onClose} aria-label="Close panel">
            <IconClose />
          </button>
        </div>
        <div className="slideout__body">{children}</div>
        {footer ? <div className="slideout__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
