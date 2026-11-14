import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlideOutPanel } from '../../components/SlideOutPanel';
import { LoadingState } from '../../components/LoadingState';
import { IconCopy } from '../../components/icons';
import { Link as LinkIcon } from 'lucide-react';
import {
  buildDeckExportJson,
  type BuildDeckExportJsonInput,
} from '../../lib/decks/buildDeckExportJson';

export interface ExportDeckPanelProps {
  open: boolean;
  input: BuildDeckExportJsonInput;
  shareUrl?: string | undefined;
  temporaryLink?: boolean;
  onPrepareLink?: (() => Promise<void>) | undefined;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onClose: () => void;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let ok: boolean;
  try {
    ok = document.execCommand('copy');
  } finally {
    textarea.remove();
  }
  if (!ok) {
    throw new Error('Copy failed');
  }
}

function CopyDeckLink({ url, temporaryLink, onPrepareLink }: Pick<ExportDeckPanelProps, 'temporaryLink' | 'onPrepareLink'> & { url: string }) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'copied' | 'manual' | 'unavailable'>('idle');
  const selectLink = useCallback((input: HTMLInputElement | null) => {
    input?.focus();
    input?.select();
  }, []);

  async function copyLink() {
    setStatus('pending');
    if (onPrepareLink) {
      try {
        await onPrepareLink();
      } catch {
        setStatus('unavailable');
        return;
      }
    }
    try {
      await copyTextToClipboard(url);
      setStatus('copied');
    } catch {
      setStatus('manual');
    }
  }

  return (
    <div className="export-deck-panel__share">
      <div className="export-deck-panel__share-actions">
        <button className="btn export-deck-panel__share-button" type="button" onClick={() => void copyLink()} disabled={status === 'pending'}>
          <LinkIcon aria-hidden="true" size={16} /> Copy deck link
        </button>
        <span role="status" className={status === 'copied' ? 'export-deck-panel__share-success' : undefined}>
          {status === 'copied' ? 'Deck link copied' : status === 'manual' ? 'Copy the selected link' : status === 'unavailable' ? 'Could not share this deck. Try again.' : ''}
        </span>
      </div>
      {temporaryLink ? (
        <p className="export-deck-panel__share-note">Anyone with the link can view the deck until it expires.</p>
      ) : null}
      {status === 'manual' ? (
        <label className="export-deck-panel__share-url">
          Deck link
          <input ref={selectLink} type="text" readOnly value={url} />
        </label>
      ) : null}
    </div>
  );
}

export function ExportDeckPanel({
  open,
  input,
  shareUrl,
  temporaryLink = false,
  onPrepareLink,
  loading = false,
  error,
  onRetry,
  onClose,
}: ExportDeckPanelProps) {
  const [format, setFormat] = useState<'json' | 'topdeck'>('topdeck');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const copyRequestRef = useRef(0);

  const exportData = useMemo(() => {
    if (loading || error) return null;
    return buildDeckExportJson(input);
  }, [loading, error, input]);

  const jsonString = useMemo(
    () => (exportData ? JSON.stringify(exportData, null, 2) : ''),
    [exportData],
  );

  const topDeckString = useMemo(() => loading || error ? '' : input.topDeck ?? '', [loading, error, input]);
  const exportText = format === 'json' ? jsonString : topDeckString;

  useEffect(() => {
    copyRequestRef.current += 1;
    setCopied(false);
    setCopyError(null);
    if (!open) setFormat('topdeck');
    if (copyTimerRef.current != null) {
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }, [open, exportText]);

  useEffect(
    () => () => {
      copyRequestRef.current += 1;
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
      }
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    if (!exportText) return;
    const request = ++copyRequestRef.current;
    setCopyError(null);
    try {
      await copyTextToClipboard(exportText);
      if (request !== copyRequestRef.current) return;
      setCopied(true);
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      if (request === copyRequestRef.current) {
        setCopyError('Could not copy automatically. Select the text above and copy manually.');
      }
    }
  }, [exportText]);

  return (
    <SlideOutPanel
      open={open}
      onClose={onClose}
      title="Export deck"
      ariaLabel={`Export deck ${format === 'json' ? 'JSON' : 'TopDeck'}`}
      width={600}
      className="export-deck-panel"
      footer={
        <div className="export-deck-panel__footer">
          <button
            type="button"
            className={`btn export-deck-panel__copy-btn${copied ? ' is-success' : ''}`}
            onClick={() => void handleCopy()}
            disabled={loading || !exportText}
          >
            <IconCopy />
            {copied ? 'Copied!' : format === 'json' ? 'Copy JSON' : 'Copy decklist'}
          </button>
          {copyError ? <p className="export-deck-panel__error">{copyError}</p> : null}
        </div>
      }
    >
      {open && shareUrl ? <CopyDeckLink key={shareUrl} url={shareUrl} temporaryLink={temporaryLink} onPrepareLink={onPrepareLink} /> : null}
      <div className="export-deck-panel__formats" role="group" aria-label="Export format">
        {(['json', 'topdeck'] as const).map(option => (
          <button
            key={option}
            type="button"
            className="export-deck-panel__format"
            aria-pressed={format === option}
            disabled={loading}
            onClick={() => setFormat(option)}
          >
            {option === 'json' ? 'JSON' : 'TopDeck'}
          </button>
        ))}
      </div>
      <p className="export-deck-panel__helper">
        {format === 'json' ? 'Copy this JSON to import the deck elsewhere.' : 'Copy this Modern OverPower decklist into your TopDeck event.'}
      </p>
      {error ? (<div role="alert"><p>Could not load the export. Your deck is unchanged.</p><button className="btn" onClick={onRetry}>Retry export</button></div>) : loading ? (
        <LoadingState label="Loading card data…" />
      ) : (
        <pre className="export-deck-panel__json">{exportText || 'No cards to export.'}</pre>
      )}
    </SlideOutPanel>
  );
}
