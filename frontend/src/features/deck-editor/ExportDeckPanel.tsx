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
  onClose,
}: ExportDeckPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const exportData = useMemo(() => {
    if (loading) return null;
    return buildDeckExportJson(input);
  }, [loading, input]);

  const jsonString = useMemo(
    () => (exportData ? JSON.stringify(exportData, null, 2) : ''),
    [exportData],
  );

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setCopyError(null);
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    }
  }, [open]);

  useEffect(
    () => () => {
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
      }
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    if (!jsonString) return;
    setCopyError(null);
    try {
      await copyTextToClipboard(jsonString);
      setCopied(true);
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      setCopyError('Could not copy automatically. Select the JSON above and copy manually.');
    }
  }, [jsonString]);

  return (
    <SlideOutPanel
      open={open}
      onClose={onClose}
      title="Export deck"
      ariaLabel="Export deck JSON"
      width={600}
      className="export-deck-panel"
      footer={
        <div className="export-deck-panel__footer">
          <button
            type="button"
            className={`btn export-deck-panel__copy-btn${copied ? ' is-success' : ''}`}
            onClick={() => void handleCopy()}
            disabled={loading || !jsonString}
          >
            <IconCopy />
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          {copyError ? <p className="export-deck-panel__error">{copyError}</p> : null}
        </div>
      }
    >
      <p className="export-deck-panel__helper">
        Copy this JSON to import the deck elsewhere.
      </p>
      {loading ? (
        <LoadingState label="Loading card data…" />
      ) : (
        <pre className="export-deck-panel__json">{jsonString}</pre>
      )}
    </SlideOutPanel>
  );
}
