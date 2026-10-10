import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { SlideOutPanel } from '../../components/SlideOutPanel';
import { IconImport } from '../../components/icons';
import {
  DEFAULT_IMPORTED_DECK_NAME,
  formatUnresolvedImportError,
  importDeckFromJson,
  parseImportDeckInput,
  type ImportDeckResult,
  type ImportDeckFormat,
} from '../../lib/decks/importDeckFromJson';
import type { ImportDeckJson } from '../../lib/decks/importTypes';
import './ImportDeckPanel.css';

export interface ImportDeckPanelProps {
  open: boolean;
  isGuest: boolean;
  onClose: () => void;
  onSuccess: (deckId: string, userId: string) => void;
}

function deckNameFromParsedJson(data: ImportDeckJson): string {
  return data.name?.trim() || DEFAULT_IMPORTED_DECK_NAME;
}

export function ImportDeckPanel({ open, isGuest, onClose, onSuccess }: ImportDeckPanelProps) {
  const [deckText, setDeckText] = useState('');
  const [format, setFormat] = useState<ImportDeckFormat>('topdeck');
  const [deckName, setDeckName] = useState(DEFAULT_IMPORTED_DECK_NAME);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDeckText('');
      setFormat('topdeck');
      setDeckName(DEFAULT_IMPORTED_DECK_NAME);
      setBusy(false);
      setError(null);
    }
  }, [open]);

  const handleDeckTextChange = useCallback((value: string) => {
    setDeckText(value);
    setError(null);
    if (format !== 'json' || !value.trim()) return;
    try {
      const parsed = parseImportDeckInput(value, format);
      if (typeof parsed !== 'string') setDeckName(deckNameFromParsedJson(parsed));
    } catch {
      // Keep the entered name while JSON is incomplete.
    }
  }, [format]);

  const selectFormat = (next: ImportDeckFormat) => {
    setFormat(next);
    setError(null);
  };

  const handleFailure = (result: Extract<ImportDeckResult, { ok: false }>) => {
    if (result.code === 'unresolved') {
      setError(`${result.message}\n\n${formatUnresolvedImportError(result.unresolved)}`);
      return;
    }
    setError(result.message);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !deckText.trim()) return;

    setBusy(true);
    setError(null);

    let exportData: ImportDeckJson | string;
    try {
      exportData = parseImportDeckInput(deckText, format);
    } catch (err) {
      setBusy(false);
      setError((err as Error)?.message || 'Invalid decklist');
      return;
    }

    const result = await importDeckFromJson({
      exportData,
      deckName: deckName.trim() || DEFAULT_IMPORTED_DECK_NAME,
      isGuest,
    });

    setBusy(false);

    if (!result.ok) {
      handleFailure(result);
      return;
    }

    onSuccess(result.deckId, result.userId);
  };

  return (
    <SlideOutPanel
      open={open}
      onClose={onClose}
      title="Import deck"
      ariaLabel="Import deck from JSON or TopDeck"
      width={480}
      className="import-deck-panel"
      footer={
        <div className="import-deck-panel__footer">
          <button
            type="submit"
            form="import-deck-form"
            className="btn btn-primary import-deck-panel__submit"
            disabled={busy || !deckText.trim()}
          >
            <IconImport />
            {busy ? 'Importing…' : 'Import deck'}
          </button>
        </div>
      }
    >
      <div className="import-deck-panel__formats" role="group" aria-label="Import format">
        {(['json', 'topdeck'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className="import-deck-panel__format"
            aria-pressed={format === option}
            disabled={busy}
            onClick={() => selectFormat(option)}
          >
            {option === 'json' ? 'JSON' : 'TopDeck'}
          </button>
        ))}
      </div>
      <p className="import-deck-panel__helper">
        {format === 'json'
          ? 'Paste exported deck JSON below to create a new deck.'
          : 'Paste a TopDeck decklist below to create a new deck.'}
      </p>

      {error ? (
        <div className="import-deck-panel__error" role="alert">
          {error}
        </div>
      ) : null}

      <form id="import-deck-form" className="import-deck-panel__form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="import-deck-panel__field import-deck-panel__field--name">
          <span>Deck name</span>
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder={DEFAULT_IMPORTED_DECK_NAME}
            maxLength={100}
            disabled={busy}
          />
        </label>

        <label className="import-deck-panel__field import-deck-panel__field--json">
          <span>{format === 'json' ? 'Deck JSON' : 'TopDeck decklist'}</span>
          <div className="import-deck-panel__json-wrap">
            <textarea
              className="import-deck-panel__textarea"
              value={deckText}
              onChange={(e) => handleDeckTextChange(e.target.value)}
              placeholder={format === 'json' ? 'Paste exported deck JSON here…' : 'Paste TopDeck text here…'}
              disabled={busy}
              spellCheck={false}
            />
          </div>
        </label>
      </form>
    </SlideOutPanel>
  );
}
