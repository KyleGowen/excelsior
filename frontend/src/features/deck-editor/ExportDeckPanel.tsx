import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlideOutPanel } from '../../components/SlideOutPanel';
import { LoadingState } from '../../components/LoadingState';
import { IconCopy } from '../../components/icons';
import {
  buildDeckExportJson,
  type BuildDeckExportJsonInput,
} from '../../lib/decks/buildDeckExportJson';

export interface ExportDeckPanelProps {
  open: boolean;
  input: BuildDeckExportJsonInput;
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
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!ok) {
    throw new Error('Copy failed');
  }
}

export function ExportDeckPanel({
  open,
  input,
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
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          {copyError ? <p className="export-deck-panel__error">{copyError}</p> : null}
        </div>
      }
    >
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
