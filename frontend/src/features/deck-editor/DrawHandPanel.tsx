import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { CardImage } from '../../components/CardImage';
import { isFoilCard } from '../../lib/catalog/foilCatalog';
import { buildFoilSeed } from '../../lib/visual/foilEffect';
import { SlideOutPanel } from '../../components/SlideOutPanel';
import { imagePathFromCard } from '../../lib/images/cardImages';
import type { CatalogCard, CatalogType, DeckCardEntry } from '../../lib/api/types';
import {
  shouldDimDeckCard,
  type KoDimmingContext,
} from '../../lib/decks/simulateKo';
import {
  catalogSlugForDeckType,
  deckCardDisplayName,
  resolveDeckCatalogCard,
  type DeckCardIndex,
} from '../../lib/decks/deckCardCatalog';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { useDrawHandScale } from './useDrawHandScale';
import { deckEditorCardImageLoadingProps } from './deckEditorCardImage';
import type { DrawHandAnalysis } from '../../lib/decks/drawHandAnalysis';
import './DrawHandPanel.css';

function resolveDrawHandImagePath(
  entry: DeckCardEntry,
  catalogCard: CatalogCard | undefined,
): string {
  return entry.defaultImage || imagePathFromCard(catalogCard) || '';
}

function useFinePointer(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);
}

export interface DrawHandPanelProps {
  open: boolean;
  drawnCards: DeckCardEntry[];
  cardIndex: DeckCardIndex;
  koCtx: KoDimmingContext;
  analysis?: DrawHandAnalysis | null;
  closeOnEscape?: boolean;
  onRedraw: () => void;
  onClose: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onCardClick?: (catalogCard: CatalogCard, catalogType: CatalogType, instanceId: string) => void;
}

export function DrawHandPanel({
  open,
  drawnCards,
  cardIndex,
  koCtx,
  analysis,
  closeOnEscape = true,
  onRedraw,
  onClose,
  onReorder,
  onCardClick,
}: DrawHandPanelProps) {
  const { isMobile } = useLayoutMode();
  const canDrag = useFinePointer();
  const rowRef = useRef<HTMLDivElement>(null);
  const scale = useDrawHandScale(rowRef, drawnCards.length);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [failedImageSlots, setFailedImageSlots] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (open) {
      setFailedImageSlots(new Set());
    }
  }, [open, drawnCards]);

  const markImageFailed = useCallback((index: number) => {
    setFailedImageSlots((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const rowInnerStyle = useMemo((): CSSProperties | undefined => {
    if (scale >= 1) return undefined;
    return { transform: `scale(${scale})` };
  }, [scale]);

  const handleDragStart = useCallback(
    (index: number) => (e: DragEvent<HTMLDivElement>) => {
      if (!canDrag) return;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    [canDrag],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => (e: DragEvent<HTMLDivElement>) => {
      if (!canDrag || draggedIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    [canDrag, draggedIndex],
  );

  const handleDrop = useCallback(
    (targetIndex: number) => (e: DragEvent<HTMLDivElement>) => {
      if (!canDrag) return;
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        onReorder(draggedIndex, targetIndex);
      }
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [canDrag, draggedIndex, onReorder],
  );

  return (
    <SlideOutPanel
      open={open}
      onClose={onClose}
      side="top"
      position={isMobile ? 'fixed' : 'absolute'}
      className="draw-hand-slideout"
      closeOnEscape={closeOnEscape}
      title={
        <div className="draw-hand__header">
          <span className="draw-hand__header-title">Drawn Hand</span>
          {analysis ? (
            <div
              className="draw-hand__analysis"
              role="status"
              aria-label="Hand analysis"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="draw-hand__analysis-heading">
                <span className="draw-hand__analysis-title">Hand analysis</span>
                <span className="draw-hand__analysis-caption">After duplicate rules</span>
              </div>
              <dl className="draw-hand__metrics">
                <div
                  className="draw-hand__metric draw-hand__metric--venture"
                  title="Informational sum of printed numerical values after duplicate rules"
                >
                  <dt>Venture total</dt>
                  <dd>{analysis.ventureTotal}</dd>
                </div>
                <div
                  className={`draw-hand__metric draw-hand__metric--duplicates${analysis.duplicateCount > 0 ? ' has-duplicates' : ''}`}
                  title="Copies that normal discard rules would not let you keep"
                >
                  <dt>Duplicates</dt>
                  <dd>{analysis.duplicateCount}</dd>
                </div>
              </dl>
            </div>
          ) : null}
          <button type="button" className="btn btn-ghost draw-hand__redraw" onClick={onRedraw}>
            Draw again
          </button>
        </div>
      }
      ariaLabel="Drawn Hand"
    >
      {drawnCards.length === 0 ? (
        <p className="draw-hand__empty">No cards to display.</p>
      ) : (
        <div
          ref={rowRef}
          className={`draw-hand__row${dragOverIndex !== null ? ' draw-hand__row--drag-over' : ''}`}
          style={{ '--draw-hand-scale': scale } as CSSProperties}
        >
          <div className="draw-hand__row-inner" style={rowInnerStyle}>
            {drawnCards.map((entry, index) => {
              const catalogType = catalogSlugForDeckType(entry.type);
              const catalogCard = resolveDeckCatalogCard(entry, cardIndex);
              const imagePath = resolveDrawHandImagePath(entry, catalogCard);
              const cardName = deckCardDisplayName(entry, cardIndex);
              const missingArt = !imagePath;
              const showArtLabel = missingArt || failedImageSlots.has(index);
              const koDimmed = shouldDimDeckCard(entry, catalogCard, koCtx);
              const isEvent = entry.type === 'event';
              const canOpenDetail = Boolean(catalogCard && catalogType && entry.instanceId && onCardClick);
              const isDragging = draggedIndex === index;
              const isDragTarget = dragOverIndex === index && draggedIndex !== index;
              const isDuplicate = Boolean(analysis?.duplicateCardIndexes.has(index));
              const entryIsFoil = Boolean(entry.is_foil || (catalogCard && isFoilCard(catalogCard)));
              const foilSeed = buildFoilSeed(entry.cardId, entry.instanceId);

              return (
                <div
                  key={`${entry.type}:${entry.cardId}:${index}`}
                  className={`draw-hand__slot${isDragging ? ' draw-hand__slot--dragging' : ''}${isDragTarget ? ' draw-hand__slot--drag-target' : ''}`}
                  draggable={canDrag}
                  onDragStart={handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleDrop(index)}
                >
                  <div
                    className={`deck-editor__card draw-hand__card${koDimmed ? ' deck-editor__card--ko-dimmed' : ''}${isDuplicate ? ' draw-hand__card--duplicate' : ''}`}
                  >
                    <div className="deck-editor__card-media">
                      <button
                        type="button"
                        className={`deck-editor__card-img deck-editor__card-img--portrait${isEvent ? ' draw-hand__event-portrait' : ''}`}
                        disabled={!canOpenDetail}
                        onClick={() => {
                          if (catalogCard && catalogType && entry.instanceId && onCardClick) {
                            onCardClick(catalogCard, catalogType, entry.instanceId);
                          }
                        }}
                        aria-label={`${cardName}${isDuplicate ? ', duplicate' : ''}`}
                        title={`${cardName}${isDuplicate ? ' — Duplicate' : ''}`}
                      >
                        {isEvent ? (
                          <span className="draw-hand__event-rotate">
                            <CardImage
                              imagePath={imagePath}
                              alt={cardName}
                              catalogType="events"
                              useThumbnail={false}
                              loading="eager"
                              className="card-image--contain"
                              onImageFailed={() => markImageFailed(index)}
                              isFoil={entryIsFoil}
                              foilSeed={foilSeed}
                            />
                          </span>
                        ) : (
                          <CardImage
                            imagePath={imagePath}
                            alt={cardName}
                            catalogType={catalogType}
                            {...deckEditorCardImageLoadingProps(catalogType)}
                            onImageFailed={() => markImageFailed(index)}
                            isFoil={entryIsFoil}
                            foilSeed={foilSeed}
                          />
                        )}
                      </button>
                      {showArtLabel ? (
                        <p className="draw-hand__missing-art" title={cardName}>
                          {cardName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </SlideOutPanel>
  );
}
