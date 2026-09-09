import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bulkDeleteSavedDatabaseViews,
  createSavedDatabaseView,
  deleteSavedDatabaseView,
  SAVED_DATABASE_VIEW_NAME_MAX_LENGTH,
  updateSavedDatabaseView,
  type SavedDatabaseView,
  type SavedDatabaseViewDeleteResult,
  type SavedDatabaseViewList,
  type SavedDatabaseViewMutation,
  type SavedDatabaseViewStateV1,
} from '../../../lib/api/savedDatabaseViews';
import { ApiError } from '../../../lib/api/client';
import {
  IconBookmark,
  IconCheck,
  IconClose,
  IconDatabase,
  IconEdit,
  IconMoreHorizontal,
  IconPin,
  IconTrash,
} from '../../../components/icons';
import { Checkbox } from '../../../components/Checkbox';
import './SavedDatabaseViewsPanel.css';

export const SAVED_DATABASE_VIEWS_QUERY_KEY = ['saved-database-views'] as const;

export interface SavedViewCreateRequest {
  id: number;
  viewState: SavedDatabaseViewStateV1;
}

interface EditorState {
  key: number;
  kind: 'create' | 'rename';
  name: string;
  sourceId?: string;
  viewState?: SavedDatabaseViewStateV1;
  error?: string;
}

interface ConfirmState {
  kind: 'single' | 'bulk';
  ids: string[];
}

interface SavedDatabaseViewsPanelProps {
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
  data: SavedDatabaseViewList | undefined;
  isLoading: boolean;
  loadError: boolean;
  createRequest: SavedViewCreateRequest | null;
  activeViewId: string | null;
  onRecall: (view: SavedDatabaseView) => Promise<void>;
}

function compareViews(a: SavedDatabaseView, b: SavedDatabaseView): number {
  const created = b.createdAt.localeCompare(a.createdAt);
  return created || b.id.localeCompare(a.id);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'That action could not be completed.';
}

function ConfirmDialog({
  count,
  onCancel,
  onConfirm,
  busy,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);
  busyRef.current = busy;
  onCancelRef.current = onCancel;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) onCancelRef.current();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)')];
      if (!focusable.length) return;
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
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="saved-views-confirm" role="presentation">
      <button
        type="button"
        className="saved-views-confirm__backdrop"
        aria-label="Cancel deletion"
        onClick={onCancel}
        disabled={busy}
      />
      <div ref={dialogRef} className="saved-views-confirm__dialog" role="dialog" aria-modal="true" aria-labelledby="saved-views-confirm-title">
        <h2 id="saved-views-confirm-title">Delete {count === 1 ? 'saved view' : `${count} saved views`}?</h2>
        <p>This cannot be undone. Your database cards and filters are not affected.</p>
        <div className="saved-views-confirm__actions">
          <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn saved-views-confirm__delete" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SavedDatabaseViewsPanel({
  open,
  isMobile,
  onClose,
  data,
  isLoading,
  loadError,
  createRequest,
  activeViewId,
  onRecall,
}: SavedDatabaseViewsPanelProps) {
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const processedCreateRequestRef = useRef(0);
  const editorKeyRef = useRef(0);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [recallingId, setRecallingId] = useState<string | null>(null);
  const editorRef = useRef(editor);
  const confirmRef = useRef(confirm);
  const menuOpenIdRef = useRef(menuOpenId);
  const onCloseRef = useRef(onClose);
  const createRequestRef = useRef(createRequest);
  editorRef.current = editor;
  confirmRef.current = confirm;
  menuOpenIdRef.current = menuOpenId;
  onCloseRef.current = onClose;
  createRequestRef.current = createRequest;

  const views = data?.views ?? [];
  const pinned = useMemo(() => views.filter((view) => view.isPinned).sort(compareViews), [views]);
  const unpinned = useMemo(() => views.filter((view) => !view.isPinned).sort(compareViews), [views]);

  const writeMutationResult = (result: SavedDatabaseViewMutation, insert: boolean) => {
    queryClient.setQueryData<SavedDatabaseViewList>(SAVED_DATABASE_VIEWS_QUERY_KEY, (previous) => {
      const current = previous?.views ?? [];
      const without = current.filter((view) => view.id !== result.view.id);
      return { views: insert ? [result.view, ...without] : [...without, result.view], count: result.count, max: result.max };
    });
  };

  const writeDeleteResult = (result: SavedDatabaseViewDeleteResult, ids: string[]) => {
    const removed = new Set(ids);
    queryClient.setQueryData<SavedDatabaseViewList>(SAVED_DATABASE_VIEWS_QUERY_KEY, (previous) => ({
      views: (previous?.views ?? []).filter((view) => !removed.has(view.id)),
      count: result.count,
      max: result.max,
    }));
  };

  const createMutation = useMutation({
    mutationFn: ({ name, viewState }: { name: string; viewState: SavedDatabaseViewStateV1 }) =>
      createSavedDatabaseView(name, viewState),
  });
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateSavedDatabaseView(id, { name }),
  });
  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) => updateSavedDatabaseView(id, { isPinned }),
  });
  const deleteMutation = useMutation({ mutationFn: deleteSavedDatabaseView });
  const bulkDeleteMutation = useMutation({ mutationFn: bulkDeleteSavedDatabaseViews });
  const isEditing = createMutation.isPending || renameMutation.isPending;
  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (confirmRef.current) return;
      if (event.key === 'Escape' && !editorRef.current && !confirmRef.current && !menuOpenIdRef.current) {
        onCloseRef.current();
      }
      if (!isMobile || event.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )];
      if (!focusable.length) return;
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
    document.addEventListener('keydown', onKey);
    if (isMobile && !createRequestRef.current) panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      previousFocusRef.current?.focus?.();
    };
  }, [isMobile, open]);

  useEffect(() => {
    if (!open || !createRequest || createRequest.id === processedCreateRequestRef.current) return;
    processedCreateRequestRef.current = createRequest.id;
    editorKeyRef.current += 1;
    setEditor({ key: editorKeyRef.current, kind: 'create', name: '', viewState: createRequest.viewState });
    setSelectionMode(false);
    setPanelError(null);
  }, [createRequest, open]);

  useEffect(() => {
    if (!editor) return;
    window.setTimeout(() => {
      inputRef.current?.focus();
      if (editor.kind !== 'create') inputRef.current?.select();
    }, 0);
  }, [editor?.key]);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(`[data-saved-view-menu="${menuOpenId}"]`)) setMenuOpenId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpenId(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpenId]);

  if (!open) return null;

  const updateEditorName = (name: string) => setEditor((current) => current ? { ...current, name, error: undefined } : current);

  const submitEditor = async () => {
    if (!editor || isEditing) return;
    const name = editor.name.trim();
    if (!name) {
      setEditor({ ...editor, error: 'Enter a name for this saved view.' });
      inputRef.current?.focus();
      return;
    }
    setPanelError(null);
    try {
      if (editor.kind === 'create' && editor.viewState) {
        const result = await createMutation.mutateAsync({ name, viewState: editor.viewState });
        writeMutationResult(result, true);
      } else if (editor.kind === 'rename' && editor.sourceId) {
        const result = await renameMutation.mutateAsync({ id: editor.sourceId, name });
        writeMutationResult(result, false);
      }
      setEditor(null);
      void queryClient.invalidateQueries({ queryKey: SAVED_DATABASE_VIEWS_QUERY_KEY });
    } catch (error) {
      const message = errorMessage(error);
      setEditor({ ...editor, name: editor.name, error: message });
      if (error instanceof ApiError && error.code === 'SAVED_DATABASE_VIEW_LIMIT_REACHED') {
        void queryClient.invalidateQueries({ queryKey: SAVED_DATABASE_VIEWS_QUERY_KEY });
      }
      inputRef.current?.focus();
    }
  };

  const beginRename = (view: SavedDatabaseView) => {
    editorKeyRef.current += 1;
    setEditor({ key: editorKeyRef.current, kind: 'rename', sourceId: view.id, name: view.name });
    setMenuOpenId(null);
  };

  const togglePinned = async (view: SavedDatabaseView) => {
    setMenuOpenId(null);
    setPanelError(null);
    try {
      const result = await pinMutation.mutateAsync({ id: view.id, isPinned: !view.isPinned });
      writeMutationResult(result, false);
      void queryClient.invalidateQueries({ queryKey: SAVED_DATABASE_VIEWS_QUERY_KEY });
    } catch (error) {
      setPanelError(errorMessage(error));
    }
  };

  const performDelete = async () => {
    if (!confirm || isDeleting) return;
    setPanelError(null);
    try {
      if (confirm.kind === 'single') {
        const result = await deleteMutation.mutateAsync(confirm.ids[0]);
        writeDeleteResult(result, confirm.ids);
      } else {
        const result = await bulkDeleteMutation.mutateAsync(confirm.ids);
        writeDeleteResult(result, confirm.ids);
      }
      setConfirm(null);
      setSelectedIds(new Set());
      setSelectionMode(false);
      void queryClient.invalidateQueries({ queryKey: SAVED_DATABASE_VIEWS_QUERY_KEY });
    } catch (error) {
      setPanelError(errorMessage(error));
      setConfirm(null);
    }
  };

  const recall = async (view: SavedDatabaseView) => {
    setRecallingId(view.id);
    setPanelError(null);
    try {
      await onRecall(view);
    } catch (error) {
      setPanelError(errorMessage(error));
    } finally {
      setRecallingId(null);
    }
  };

  const renderEditor = (rowId?: string) => {
    if (!editor || (editor.kind === 'rename' && editor.sourceId !== rowId)) return null;
    if (editor.kind !== 'rename' && rowId !== undefined) return null;
    return (
      <div className="saved-views__row saved-views__row--editor">
        <IconDatabase className="saved-views__row-icon" />
        <div className="saved-views__editor-body">
          <input
            ref={inputRef}
            value={editor.name}
            maxLength={SAVED_DATABASE_VIEW_NAME_MAX_LENGTH}
            aria-label={editor.kind === 'rename' ? 'Rename saved view' : 'Name saved view'}
            aria-invalid={Boolean(editor.error)}
            onChange={(event) => updateEditorName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submitEditor();
              if (event.key === 'Escape' && !isEditing) setEditor(null);
            }}
          />
          {editor.error ? <span className="saved-views__inline-error" role="alert">{editor.error}</span> : null}
        </div>
        <button type="button" className="saved-views__editor-action" onClick={() => void submitEditor()} disabled={isEditing} aria-label="Confirm name"><IconCheck /></button>
        <button type="button" className="saved-views__editor-action" onClick={() => setEditor(null)} disabled={isEditing} aria-label="Cancel naming"><IconClose /></button>
      </div>
    );
  };

  const renderRow = (view: SavedDatabaseView) => {
    if (editor?.kind === 'rename' && editor.sourceId === view.id) return <div key={view.id}>{renderEditor(view.id)}</div>;
    const selected = selectedIds.has(view.id);
    return (
      <div key={view.id} className={`saved-views__row${activeViewId === view.id ? ' is-active' : ''}`}>
        {selectionMode ? (
          <Checkbox
            className="saved-views__select"
            label={`Select ${view.name}`}
            hideLabel
            checked={selected}
            onChange={(checked) => setSelectedIds((current) => {
              const next = new Set(current);
              if (checked) next.add(view.id); else next.delete(view.id);
              return next;
            })}
          />
        ) : null}
        <button
          type="button"
          className="saved-views__recall"
          onClick={() => void recall(view)}
          disabled={recallingId === view.id}
          aria-label={`Recall ${view.name}`}
        >
          <IconDatabase className="saved-views__row-icon" />
          <span>{recallingId === view.id ? 'Recalling…' : view.name}</span>
        </button>
        {!selectionMode ? (
          <div className="saved-views__menu-wrap" data-saved-view-menu={view.id}>
            <button
              type="button"
              className="saved-views__more"
              aria-label={`Actions for ${view.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpenId === view.id}
              onClick={() => setMenuOpenId((current) => current === view.id ? null : view.id)}
            ><IconMoreHorizontal /></button>
            {menuOpenId === view.id ? (
              <div className="saved-views__menu" role="menu">
                <button type="button" role="menuitem" onClick={() => beginRename(view)}><IconEdit /> Rename</button>
                <button type="button" role="menuitem" onClick={() => void togglePinned(view)}><IconPin /> {view.isPinned ? 'Unpin' : 'Pin'}</button>
                <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenuOpenId(null); setConfirm({ kind: 'single', ids: [view.id] }); }}><IconTrash /> Delete</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const allSelected = views.length > 0 && selectedIds.size === views.length;
  const panel = (
    <aside
      id="saved-database-views-panel"
      ref={panelRef}
      className={`saved-views__panel saved-views__panel--${isMobile ? 'mobile' : 'desktop'}`}
      role={isMobile ? 'dialog' : 'complementary'}
      aria-modal={isMobile ? true : undefined}
      aria-labelledby="saved-views-heading"
      tabIndex={isMobile ? -1 : undefined}
    >
      <header className="saved-views__header">
        <div><h2 id="saved-views-heading">Saved views</h2><p>{data ? `${data.count} of ${data.max}` : 'Personal database shortcuts'}</p></div>
        <button type="button" className="saved-views__close" onClick={onClose} aria-label="Close saved views"><IconClose /></button>
      </header>

      <div className="saved-views__toolbar">
        {selectionMode ? (
          <>
            <button type="button" disabled={allSelected} onClick={() => setSelectedIds(new Set(views.map((view) => view.id)))}>Select all</button>
            <button type="button" disabled={selectedIds.size === 0} onClick={() => setSelectedIds(new Set())}>Clear selection</button>
            <span aria-live="polite">{selectedIds.size} selected</span>
            <button type="button" className="is-danger" disabled={selectedIds.size === 0} onClick={() => setConfirm({ kind: 'bulk', ids: [...selectedIds] })}>Delete selected</button>
            <button type="button" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}>Cancel</button>
          </>
        ) : views.length > 0 ? (
          <button type="button" onClick={() => { setEditor(null); setSelectionMode(true); }}>Manage</button>
        ) : null}
      </div>

      <div className="saved-views__body">
        {panelError ? <div className="saved-views__panel-error" role="alert">{panelError}</div> : null}
        {isLoading ? <p className="saved-views__status">Loading saved views…</p> : null}
        {loadError ? <p className="saved-views__panel-error" role="alert">Saved views could not be loaded. Your database is still available.</p> : null}
        {!isLoading && !loadError ? (
          <>
            {pinned.length > 0 ? (
              <section className="saved-views__section" aria-labelledby="saved-views-pinned-heading">
                <h3 id="saved-views-pinned-heading"><IconPin /> Pinned</h3>
                <div className="saved-views__list">{pinned.map(renderRow)}</div>
              </section>
            ) : null}
            <section className="saved-views__section" aria-labelledby="saved-views-all-heading">
              <h3 id="saved-views-all-heading">Views</h3>
              <div className="saved-views__list">
                {editor?.kind === 'create' ? renderEditor() : null}
                {unpinned.map(renderRow)}
              </div>
            </section>
            {views.length === 0 && !editor ? (
              <div className="saved-views__empty">
                <IconBookmark />
                <h3>No saved views yet</h3>
                <p>Save the current tab and filters here so you can recall them later.</p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </aside>
  );

  return (
    <>
      {isMobile ? (
        <div className="saved-views__drawer" role="presentation">
          <button type="button" className="saved-views__backdrop" aria-label="Close saved views" onClick={onClose} />
          {panel}
        </div>
      ) : panel}
      {confirm ? <ConfirmDialog count={confirm.ids.length} onCancel={() => setConfirm(null)} onConfirm={() => void performDelete()} busy={isDeleting} /> : null}
    </>
  );
}
