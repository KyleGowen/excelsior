import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useLayoutMode } from '../../lib/layout/useLayoutMode';
import {
  OVERPOWER_DISCORD_URL,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_URL,
  submitFeedback,
  type FeedbackCategory,
} from '../../lib/api/feedback';
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronRight,
  IconClose,
  IconExternalLink,
  IconMail,
  IconSend,
  IconSparkles,
} from '../icons';
import { SlideOutPanel } from '../SlideOutPanel';
import './HelpFeedbackFlow.css';

const MAX_FEEDBACK_LENGTH = 4000;

interface HelpFeedbackFlowProps {
  open: boolean;
  onClose: () => void;
}

interface FeedbackDialogProps {
  category: FeedbackCategory;
  onBack: () => void;
  onClose: () => void;
  onSent: () => void;
}

const COPY = {
  bug: {
    title: 'Report a bug',
    label: 'What happened?',
    placeholder: 'Tell us what happened, what you expected, and where you saw it.',
  },
  feature: {
    title: 'Request a feature or change',
    label: 'What would make Excelsior better?',
    placeholder: 'Describe the idea or change you would like to see.',
  },
} as const;

function FeedbackDialog({ category, onBack, onClose, onSent }: FeedbackDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copy = COPY[category];

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), a[href]'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Please enter your feedback.');
      textareaRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitFeedback(category, trimmed);
      onSent();
    } catch (err) {
      setError((err as Error)?.message || 'Could not send feedback. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="feedback-dialog" role="presentation">
      <div className="feedback-dialog__backdrop" onClick={onBack} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="feedback-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        onKeyDown={handleKeyDown}
      >
        <div className="feedback-dialog__header">
          <div>
            <div className="feedback-dialog__eyebrow">Help &amp; feedback</div>
            <h2 id="feedback-dialog-title">{copy.title}</h2>
          </div>
          <button
            type="button"
            className="feedback-dialog__close"
            onClick={onClose}
            aria-label="Close feedback"
          >
            <IconClose />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="feedback-dialog__body">
            <label className="feedback-dialog__label" htmlFor="feedback-message">{copy.label}</label>
            <textarea
              ref={textareaRef}
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={copy.placeholder}
              maxLength={MAX_FEEDBACK_LENGTH}
              rows={7}
              disabled={busy}
            />
            <div className="feedback-dialog__meta">
              <span>{category === 'bug' ? 'Category: Bug report' : 'Category: Feature or change request'}</span>
              <span>{message.length}/{MAX_FEEDBACK_LENGTH}</span>
            </div>
            {error ? <div className="feedback-dialog__error" role="alert">{error}</div> : null}
          </div>
          <div className="feedback-dialog__footer">
            <button type="button" className="btn btn-ghost" onClick={onBack} disabled={busy}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !message.trim()}>
              <IconSend /> {busy ? 'Sending...' : 'Send feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeedbackSentDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const keepFocusInDialog = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      closeRef.current?.focus();
    }
  };

  return (
    <div className="feedback-dialog" role="presentation">
      <div className="feedback-dialog__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="feedback-dialog__panel feedback-dialog__panel--sent"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-sent-title"
        onKeyDown={keepFocusInDialog}
      >
        <div className="feedback-sent__icon"><IconCheck /></div>
        <h2 id="feedback-sent-title">Feedback sent</h2>
        <p>Thanks for helping make Excelsior better.</p>
        <button ref={closeRef} type="button" className="btn btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

export function HelpFeedbackFlow({ open, onClose }: HelpFeedbackFlowProps) {
  const { isMobile } = useLayoutMode();
  const [view, setView] = useState<'help' | FeedbackCategory | 'sent'>('help');

  useEffect(() => {
    if (open) setView('help');
  }, [open]);

  if (!open) return null;

  if (view === 'bug' || view === 'feature') {
    return createPortal(
      <FeedbackDialog
        category={view}
        onBack={() => setView('help')}
        onClose={onClose}
        onSent={() => setView('sent')}
      />,
      document.body
    );
  }

  if (view === 'sent') {
    return createPortal(<FeedbackSentDialog onClose={onClose} />, document.body);
  }

  const title = (
    <div className="help-feedback__heading">
      <span>Help &amp; feedback</span>
      <small>Found a problem or have an idea?</small>
    </div>
  );

  return createPortal(
    <SlideOutPanel
      open
      onClose={onClose}
      side={isMobile ? 'bottom' : 'right'}
      width={460}
      title={title}
      ariaLabel="Help and feedback"
      className="help-feedback__panel"
    >
      <div className="help-feedback">
        <button type="button" className="help-feedback__action" onClick={() => setView('bug')}>
          <span className="help-feedback__action-icon"><IconAlertTriangle /></span>
          <span className="help-feedback__action-copy">
            <strong>Report a bug</strong>
            <small>Tell us what happened and where you saw it.</small>
          </span>
          <IconChevronRight className="help-feedback__chevron" />
        </button>

        <button type="button" className="help-feedback__action" onClick={() => setView('feature')}>
          <span className="help-feedback__action-icon"><IconSparkles /></span>
          <span className="help-feedback__action-copy">
            <strong>Request a feature or change</strong>
            <small>Share an idea that could make Excelsior better.</small>
          </span>
          <IconChevronRight className="help-feedback__chevron" />
        </button>

        <div className="help-feedback__contact-grid">
          <a className="help-feedback__contact" href={SUPPORT_EMAIL_URL}>
            <IconMail />
            <strong>Email support</strong>
            <small>{SUPPORT_EMAIL}</small>
          </a>
          <a className="help-feedback__contact" href={OVERPOWER_DISCORD_URL} target="_blank" rel="noreferrer">
            <IconExternalLink />
            <strong>Message on Discord</strong>
            <small>@GirlsGoneKyle</small>
          </a>
        </div>
      </div>
    </SlideOutPanel>,
    document.body
  );
}
