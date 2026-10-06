import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { SlideOutPanel } from '../../components/SlideOutPanel';
import { IconImport } from '../../components/icons';
import {
  DEFAULT_IMPORTED_DECK_NAME,
  formatUnresolvedImportError,
  importDeckFromJson,
  parseImportDeckJson,
  type ImportDeckResult,
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
  const [jsonText, setJsonText] = useState('');
  const [deckName, setDeckName] = useState(DEFAULT_IMPORTED_DECK_NAME);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setJsonText('');
      setDeckName(DEFAULT_IMPORTED_DECK_NAME);
      setBusy(false);
      setError(null);
    }
  }, [open]);

  const handleJsonChange = useCallback((value: string) => {
    setJsonText(value);
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      const parsed = parseImportDeckJson(trimmed);
      setDeckName(deckNameFromParsedJson(parsed));
    } catch {
      // Keep prior name until JSON is valid enough to parse.
    }
  }, []);

  const handleFailure = (result: Extract<ImportDeckResult, { ok: false }>) => {
    if (result.code === 'unresolved') {
      setError(`${result.message}\n\n${formatUnresolvedImportError(result.unresolved)}`);
      return;
    }
    setError(result.message);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !jsonText.trim()) return;

    setBusy(true);
    setError(null);

    let exportData: ImportDeckJson;
    try {
      exportData = parseImportDeckJson(jsonText);
    } catch (err) {
      setBusy(false);
      setError((err as Error)?.message || 'Invalid JSON');
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
      ariaLabel="Import deck from JSON"
      width={480}
      className="import-deck-panel"
      footer={
        <div className="import-deck-panel__footer">
          <button
            type="submit"
            form="import-deck-form"
            className="btn btn-primary import-deck-panel__submit"
            disabled={busy || !jsonText.trim()}
          >
            <IconImport />
            {busy ? 'Importing…' : 'Import deck'}
          </button>
        </div>
      }
    >
      <p className="import-deck-panel__helper">
        Paste exported deck JSON below to create a new deck.
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
          <span>Deck JSON</span>
          <div className="import-deck-panel__json-wrap">
            <textarea
              className="import-deck-panel__textarea"
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder='Paste exported deck JSON here…'
              disabled={busy}
              spellCheck={false}
            />
          </div>
        </label>
      </form>
    </SlideOutPanel>
  );
}
