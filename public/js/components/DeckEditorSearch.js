
    /**
     * DeckEditorSearch Component
     * ------------------------------------------
     * Encapsulated search UI for the Deck Editor. Provides debounced search across
     * all card families using CardSearchService, renders a dropdown of results,
     * and exposes a simple callback for selection.
     *
     * Usage:
     *   const component = new DeckEditorSearch({
     *       input: document.getElementById('deckEditorSearchInput'),
     *       results: document.getElementById('deckEditorSearchResults'),
     *       onSelect: ({ id, type, name, alternateImage }) => addCardToDeckFromSearch(id, type, name, alternateImage),
     *       debounceMs: 300,
     *       minChars: 2,
     *       maxResults: 20
     *   });
     *   component.mount();
     *
     * Public options:
     *   - input: HTMLInputElement for user typing (required)
     *   - results: HTMLElement container for rendered dropdown (required)
     *   - onSelect: function({ id, type, name }) invoked when a result is clicked
     *   - minChars: minimum characters before searching (default: 2)
     *   - debounceMs: delay before querying (default: 300)
     *   - maxResults: maximum number of results to display (default: 20)
     *   - searchService: optional custom service with search(term) -> normalized array
     *
     * Rendering contract:
     *   - The component writes item markup into `results` and toggles its display.
     *   - `.deck-editor-search-results` must be absolutely positioned with a
     *     high z-index, and its parents must not clip overflow. See
     *     public/css/deck-editor-search.css for the canonical rules and
     *     tests/unit/deck-editor-search-css-rules.test.ts for safeguards.
     *
     * Normalized result shape:
     *   { id: string, name: string, type: string, image: string, character?: string, alternateImage?: string }
     *
     * Accessibility & Keyboard Navigation (future work):
     *   - The component is structured to support arrow key navigation and Enter
     *     selection in a future enhancement without changing the public API.
     */
(function(global) {
    class DeckEditorSearch {
        constructor(options = {}) {
            this.input = options.input || document.getElementById('deckEditorSearchInput');
            this.resultsEl = options.results || document.getElementById('deckEditorSearchResults');
            this.onSelect = options.onSelect || function() {};
            this.minChars = options.minChars || 2;
            this.debounceMs = options.debounceMs || 300;
            this.searchService = options.searchService || new global.CardSearchService({ maxResults: options.maxResults || 20 });
            this._timeout = null;
            this._bound = false;
        }

        mount() {
            if (!this.input || !this.resultsEl) return;
            if (this._bound) return;
            this._bound = true;

            this.input.addEventListener('input', this._handleInput);
            this.input.addEventListener('focus', this.showResults);
            this.input.addEventListener('blur', this._handleBlur);
            document.addEventListener('click', this._handleDocClick);
        }

        unmount() {
            if (!this._bound) return;
            this._bound = false;
            this.input.removeEventListener('input', this._handleInput);
            this.input.removeEventListener('focus', this.showResults);
            this.input.removeEventListener('blur', this._handleBlur);
            document.removeEventListener('click', this._handleDocClick);
        }

        clear() {
            if (this.input) this.input.value = '';
            this.hideResults();
        }

        // Bound arrow methods to preserve context
        _handleInput = (e) => {
            const term = (e.target.value || '').trim().toLowerCase();
            if (term.length < this.minChars) { this.hideResults(); return; }
            if (this._timeout) clearTimeout(this._timeout);
            this._timeout = setTimeout(async () => {
                const results = await this.searchService.search(term);
                this.render(results);
            }, this.debounceMs);
        };

        _handleBlur = () => {
            setTimeout(() => this.hideResults(), 200);
        };

        _handleDocClick = (e) => {
            if (!e.target.closest('.deck-editor-search-container')) {
                this.hideResults();
            }
        };

        showResults = () => {
            if (this.resultsEl) {
                this.resultsEl.style.display = 'block';
            }
        };

        hideResults = () => {
            if (this.resultsEl) this.resultsEl.style.display = 'none';
        };

        render(results) {
            if (!this.resultsEl) return;
            if (!Array.isArray(results) || results.length === 0) {
                this.resultsEl.innerHTML = '<div class="deck-editor-search-result">No cards found</div>';
                this.showResults();
                return;
            }

            const html = results.map(card => {
                const alternateImage = card.alternateImage || '';
                const escapedAlternateImage = alternateImage.replace(/"/g, '&quot;').replace(/'/g, "\\'");
                return `
                <div class="deck-editor-search-result"
                     data-id="${card.id}"
                     data-type="${card.type}"
                     data-name="${(card.name || '').replace(/'/g, "\\'")}"
                     data-alternate-image="${escapedAlternateImage}">
                    <div class="deck-editor-search-result-image" style="background-image: url('${card.image}')"></div>
                    <div class="deck-editor-search-result-info">
                        <div class="deck-editor-search-result-name">${card.name}</div>
                        <div class="deck-editor-search-result-type">${typeof global.formatCardType === 'function' ? global.formatCardType(card.type) : card.type}</div>
                        ${card.character ? `<div class="deck-editor-search-result-character">${card.character}</div>` : ''}
                    </div>
                </div>
            `;
            }).join('');

            this.resultsEl.innerHTML = html;
            this.resultsEl.querySelectorAll('.deck-editor-search-result').forEach(el => {
                el.addEventListener('click', () => {
                    const id = el.getAttribute('data-id');
                    const type = el.getAttribute('data-type');
                    const name = el.getAttribute('data-name');
                    const alternateImage = el.getAttribute('data-alternate-image') || null;
                    this.onSelect({ id, type, name, alternateImage: alternateImage && alternateImage.length > 0 ? alternateImage : null });
                    this.clear();
                });
            });
            this.showResults();
        }
    }

    global.DeckEditorSearch = DeckEditorSearch;
})(window);


