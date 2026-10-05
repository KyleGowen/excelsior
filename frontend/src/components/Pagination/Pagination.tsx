import type { CSSProperties } from 'react';
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '../icons';
import { MAX_COLLAPSED_PAGE_SLOTS, normalizePageSlots, type PageSlot } from './paginationUtils';

interface PaginationProps {
  page: number; // 1-based
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function slotKey(slot: PageSlot, index: number): string {
  if (slot.type === 'page') return `page-${slot.value}`;
  if (slot.type === 'ellipsis') return `ellipsis-${index}`;
  return `empty-${index}`;
}

export function Pagination({ page, pageSize, totalItems, onPageChange, className = '' }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const firstItem = totalItems === 0 ? 0 : (current - 1) * pageSize + 1;
  const lastItem = Math.min(current * pageSize, totalItems);
  const slots = normalizePageSlots(current, totalPages);
  const collapsed = totalPages > MAX_COLLAPSED_PAGE_SLOTS;
  const slotSize = totalPages >= 100 ? '44px' : '36px';

  const go = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== current) onPageChange(next);
  };

  const style = { '--pagination-slot-size': slotSize } as CSSProperties;

  return (
    <div className={`pagination ${className}`} style={style}>
      <div className="pagination__controls" role="navigation" aria-label="Pagination">
        <div className="pagination__nav">
          <button
            type="button"
            className="pagination__btn"
            onClick={() => go(1)}
            disabled={current === 1}
            aria-label="First page"
          >
            <IconChevronsLeft />
          </button>
          <button
            type="button"
            className="pagination__btn"
            onClick={() => go(current - 1)}
            disabled={current === 1}
            aria-label="Previous page"
          >
            <IconChevronLeft />
          </button>
        </div>

        <div className={`pagination__pages${collapsed ? ' pagination__pages--collapsed' : ''}`}>
          {slots.map((slot, i) => {
            if (slot.type === 'empty') {
              return (
                <span key={slotKey(slot, i)} className="pagination__slot pagination__slot--empty" aria-hidden="true" />
              );
            }
            if (slot.type === 'ellipsis') {
              return (
                <span key={slotKey(slot, i)} className="pagination__ellipsis" aria-hidden="true">
                  ...
                </span>
              );
            }
            return (
              <button
                key={slotKey(slot, i)}
                type="button"
                className={`pagination__btn pagination__btn--page ${slot.value === current ? 'is-active' : ''}`}
                onClick={() => go(slot.value)}
                aria-current={slot.value === current ? 'page' : undefined}
              >
                {slot.value}
              </button>
            );
          })}
        </div>

        <div className="pagination__nav">
          <button
            type="button"
            className="pagination__btn"
            onClick={() => go(current + 1)}
            disabled={current === totalPages}
            aria-label="Next page"
          >
            <IconChevronRight />
          </button>
          <button
            type="button"
            className="pagination__btn"
            onClick={() => go(totalPages)}
            disabled={current === totalPages}
            aria-label="Last page"
          >
            <IconChevronsRight />
          </button>
        </div>
      </div>
      <div className="pagination__summary">
        Showing {firstItem}-{lastItem} of {totalItems.toLocaleString()}
      </div>
    </div>
  );
}

// Re-export utils for consumers and tests
export { buildPages, normalizePageSlots, MAX_COLLAPSED_PAGE_SLOTS, type PageSlot } from './paginationUtils';
