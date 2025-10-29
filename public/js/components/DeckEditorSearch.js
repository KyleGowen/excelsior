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
            console.log('🔍 DeckEditorSearch.mount: binding listeners');

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
            console.log('🔍 DeckEditorSearch.input:', term);
            if (term.length < this.minChars) { this.hideResults(); return; }
            if (this._timeout) clearTimeout(this._timeout);
            this._timeout = setTimeout(async () => {
                console.log('🔍 DeckEditorSearch.search: starting for term', term);
                const results = await this.searchService.search(term);
                console.log('🔍 DeckEditorSearch.search: results', results?.length);
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
                console.log('🔍 DeckEditorSearch.showResults: display=block');
            }
        };

        hideResults = () => {
            if (this.resultsEl) this.resultsEl.style.display = 'none';
        };

        render(results) {
            if (!this.resultsEl) return;
            if (!Array.isArray(results) || results.length === 0) {
                console.log('🔍 DeckEditorSearch.render: no results');
                this.resultsEl.innerHTML = '<div class="deck-editor-search-result">No cards found</div>';
                this.showResults();
                return;
            }

            const html = results.map(card => `
                <div class="deck-editor-search-result"
                     data-id="${card.id}"
                     data-type="${card.type}"
                     data-name="${(card.name || '').replace(/'/g, "\\'")}">
                    <div class="deck-editor-search-result-image" style="background-image: url('${card.image}')"></div>
                    <div class="deck-editor-search-result-info">
                        <div class="deck-editor-search-result-name">${card.name}</div>
                        <div class="deck-editor-search-result-type">${typeof global.formatCardType === 'function' ? global.formatCardType(card.type) : card.type}</div>
                        ${card.character ? `<div class="deck-editor-search-result-character">${card.character}</div>` : ''}
                    </div>
                </div>
            `).join('');

            this.resultsEl.innerHTML = html;
            console.log('🔍 DeckEditorSearch.render: injected items =', results.length, 'html length =', this.resultsEl.innerHTML.length);
            this.resultsEl.querySelectorAll('.deck-editor-search-result').forEach(el => {
                el.addEventListener('click', () => {
                    const id = el.getAttribute('data-id');
                    const type = el.getAttribute('data-type');
                    const name = el.getAttribute('data-name');
                    this.onSelect({ id, type, name });
                    this.clear();
                });
            });
            this.showResults();
        }
    }

    global.DeckEditorSearch = DeckEditorSearch;
})(window);


