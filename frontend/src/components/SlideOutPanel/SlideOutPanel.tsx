import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from '../icons';
import { createPortal } from 'react-dom';
import { useOverlayHost } from '../../lib/layout/OverlayHostProvider';
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
  const overlayHost = useOverlayHost();
  const portalRoot = overlayHost?.root;
  const effectivePosition = portalRoot ? (overlayHost?.position ?? 'absolute') : position;
  const modal = overlayHost?.modal ?? true;
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeOnEscapeRef = useRef(closeOnEscape);
  closeOnEscapeRef.current = closeOnEscape;

  useEffect(() => {
    if (!open) return;
    const owner = portalRoot?.ownerDocument ?? document;
    previouslyFocused.current = owner.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      // Independent host panels must not dismiss an unrelated module's panel.
      if (portalRoot && (!panel || !panel.contains(owner.activeElement))) return;
      if (e.key === 'Escape' && closeOnEscapeRef.current) onCloseRef.current();
      if (portalRoot && modal && panel && e.key === 'Tab') {
        const controls = Array.from(panel.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')).filter(element =>
          !element.matches(':disabled, [tabindex="-1"]') && !element.closest('[hidden], [aria-hidden="true"]') &&
          getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden');
        const first = controls[0]; const last = controls.at(-1);
        if (!first || !last) { e.preventDefault(); panel.focus(); }
        else if (e.shiftKey && (owner.activeElement === first || owner.activeElement === panel)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (owner.activeElement === last || owner.activeElement === panel)) { e.preventDefault(); first.focus(); }
      }
    };
    owner.addEventListener('keydown', onKey);
    // Move focus into the panel.
    const t = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);
    return () => {
      owner.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      if (previouslyFocused.current?.isConnected) previouslyFocused.current.focus();
    };
  }, [open, portalRoot, modal]);

  if (!open) return null;

  const content = (
    <div
      className={`slideout${effectivePosition === 'absolute' ? ' slideout--absolute' : ''}${portalRoot ? ' slideout--host' : ''}`}
      role="presentation"
    >
      <div className="slideout__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`slideout__panel slideout__panel--${side} ${className}`}
        style={side === 'right' ? { width } : undefined}
        role="dialog"
        aria-modal={modal}
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
  return portalRoot ? createPortal(content, portalRoot) : content;
}
