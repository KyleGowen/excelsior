// Deck tiles renderer
// Extracted from public/index.html to reduce inline script size.

(function initDeckTilesRenderer() {
    window.DeckSelection = window.DeckSelection || {};

    window.DeckSelection.displayDecks = async function displayDecks(decks) {
        const deckList = document.getElementById('deck-list');

        if (decks.length === 0) {
            deckList.innerHTML = `
                    <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
                        <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
                    </div>
                `;
            return;
        }

        // Check if current user is guest
        const isGuest = isGuestUser();

        // No need to fetch character data or individual deck data anymore
        // The metadata columns now contain all the information we need

        // Create the deck cards HTML
        const deckCardsHTML = decks.map(deck => {
            // Quick validation check for display using metadata
            let validationStatus = '';
            if (deck.metadata.is_limited) {
                validationStatus = '<span class="deck-validation-badge limited">Limited</span>';
            } else if (deck.metadata.is_valid) {
                validationStatus = '<span class="deck-validation-badge success">✅ Legal</span>';
            } else {
                validationStatus = '<span class="deck-validation-badge error">Not Legal</span>';
            }

            // Deck list preview cards (thumbnails only; no character/location name rows)
            const cards = Array.isArray(deck.cards) ? deck.cards : [];
            const characterCards = cards.filter(card => card.type === 'character').slice(0, 4);
            const locationCard = cards.find(card => card.type === 'location');
            const missionCard = cards.find(card => card.type === 'mission');

            // Character preview: always 4 slots (empty placeholders if missing)
            const characterPreviewHtml = (() => {
                let html = '';
                for (let i = 0; i < 4; i++) {
                    const card = characterCards[i];
                    if (!card) {
                        html += '<div class="deck-character-card-display empty">Empty</div>';
                        continue;
                    }
                    const imagePath = window.DeckSelection.getDeckCardImagePath(card);
                    const title = card.name || 'Unknown Character';
                    if (imagePath) {
                        html += `<div class="deck-character-card-display" style="background-image: url('${imagePath}')" title="${title}"></div>`;
                    } else {
                        html += `<div class="deck-character-card-display empty">?</div>`;
                    }
                }
                return `
                        <div class="deck-character-display">
                            <div class="deck-character-cards-row">
                                ${html}
                            </div>
                        </div>
                    `;
            })();

            // Location preview: separate card (with space from characters)
            const locationPreviewHtml = (() => {
                if (!locationCard) {
                    return `<div class="deck-tile-preview-card deck-tile-location-preview deck-tile-preview-card--empty" title="No location selected"></div>`;
                }
                const imagePath = window.DeckSelection.getDeckCardImagePath(locationCard);
                const title = locationCard.name ? `Location: ${locationCard.name}` : 'Location';
                if (!imagePath) {
                    return `<div class="deck-tile-preview-card deck-tile-location-preview deck-tile-preview-card--empty" title="${title}"></div>`;
                }
                return `<div class="deck-tile-preview-card deck-tile-location-preview" style="background-image: url('${imagePath}')" title="${title}"></div>`;
            })();

            // Mission preview: first mission card in the deck (if any)
            const missionPreviewHtml = (() => {
                if (!missionCard) {
                    return `<div class="deck-tile-preview-card deck-tile-mission-preview deck-tile-preview-card--empty" title="No mission selected"></div>`;
                }
                const imagePath = window.DeckSelection.getDeckCardImagePath(missionCard);
                const title = missionCard.name ? `Mission: ${missionCard.name}` : 'Mission';
                if (!imagePath) {
                    return `<div class="deck-tile-preview-card deck-tile-mission-preview deck-tile-preview-card--empty" title="${title}"></div>`;
                }
                return `<div class="deck-tile-preview-card deck-tile-mission-preview" style="background-image: url('${imagePath}')" title="${title}"></div>`;
            })();

            const updatedDate = window.DeckSelection.formatDeckTimestamp(deck.metadata.lastModified);
            const createdDate = window.DeckSelection.formatDeckTimestamp(deck.metadata.created);

            const { deckTileBackgroundClass, deckTileBackgroundStyle } =
                window.DeckSelection.getDeckTileBackgroundInfo(deck?.metadata?.background_image_path);

            return `
                    <div class="deck-card deck-tile deck-tile--compact${deckTileBackgroundClass}"${deckTileBackgroundStyle} onclick="editDeck('${deck.metadata.id}')">
                        <div class="deck-tile-main">
                            <div class="deck-tile-header">
                                <h4 class="deck-tile-title">${deck.metadata.name}</h4>
                            </div>

                            <div class="deck-tile-previews">
                                <div class="deck-tile-characters" aria-label="Characters preview">
                                    ${characterPreviewHtml}
                                </div>
                                <div class="deck-tile-location" aria-label="Location preview">
                                    ${locationPreviewHtml}
                                </div>
                                <div class="deck-tile-mission" aria-label="Mission preview">
                                    ${missionPreviewHtml}
                                </div>
                            </div>
                        </div>

                        <div class="deck-tile-side" onclick="event.stopPropagation()">
                            <div class="deck-tile-menu">
                                <button class="deck-tile-menu-button" type="button" aria-haspopup="true" aria-expanded="false"
                                        onclick="toggleDeckTileMenu(event, '${deck.metadata.id}')"
                                        title="Actions">
                                    ⋯
                                </button>
                                <div class="deck-tile-menu-dropdown" id="deckTileMenu-${deck.metadata.id}" role="menu">
                                    <button class="deck-tile-menu-item" type="button" role="menuitem"
                                            onclick="editDeck('${deck.metadata.id}')">Edit</button>
                                    <button class="deck-tile-menu-item" type="button" role="menuitem"
                                            onclick="viewDeck('${deck.metadata.id}')">View</button>
                                    ${isGuest
                                        ? '<button class="deck-tile-menu-item deck-tile-menu-item--danger" type="button" role="menuitem" disabled title="Guests may not delete decks">Delete</button>'
                                        : `<button class="deck-tile-menu-item deck-tile-menu-item--danger" type="button" role="menuitem" onclick="deleteDeck('${deck.metadata.id}')">Delete</button>`
                                    }
                                </div>
                            </div>

                            <div class="deck-tile-side-meta" aria-label="Deck stats">
                                <div class="deck-tile-side-legality" aria-label="Legality">
                                    ${validationStatus}
                                </div>
                                <div class="deck-tile-side-item">
                                    <span class="deck-tile-side-left">
                                        <span class="deck-tile-side-icon" aria-hidden="true">
                                            <img src="/public/resources/images/icons/threat.png" alt="" class="deck-tile-side-icon-img">
                                        </span>
                                        <span class="deck-tile-side-label">Threat</span>
                                    </span>
                                    <span class="deck-tile-side-value">${deck.metadata.threat || 0}</span>
                                </div>
                                <div class="deck-tile-side-item">
                                    <span class="deck-tile-side-left">
                                        <span class="deck-tile-side-icon" aria-hidden="true">
                                            <img src="/public/resources/images/icons/cards.svg" alt="" class="deck-tile-side-icon-img">
                                        </span>
                                        <span class="deck-tile-side-label">Cards</span>
                                    </span>
                                    <span class="deck-tile-side-value">${deck.metadata.cardCount || 0}</span>
                                </div>
                                <div class="deck-tile-side-item">
                                    <span class="deck-tile-side-left">
                                        <span class="deck-tile-side-icon" aria-hidden="true">
                                            <img src="/public/resources/images/icons/updated.svg" alt="" class="deck-tile-side-icon-img">
                                        </span>
                                        <span class="deck-tile-side-label">Updated</span>
                                    </span>
                                    <span class="deck-tile-side-value">${updatedDate}</span>
                                </div>
                                <div class="deck-tile-side-item">
                                    <span class="deck-tile-side-left">
                                        <span class="deck-tile-side-icon" aria-hidden="true">
                                            <img src="/public/resources/images/icons/created.svg" alt="" class="deck-tile-side-icon-img">
                                        </span>
                                        <span class="deck-tile-side-label">Created</span>
                                    </span>
                                    <span class="deck-tile-side-value">${createdDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
        }).join('');

        // Set the deck list HTML
        deckList.innerHTML = deckCardsHTML;
    };
})();

