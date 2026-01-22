// Deck tile timestamp formatting
// Extracted from public/index.html to reduce inline script size.

(function initDeckTileTimestamps() {
    window.DeckSelection = window.DeckSelection || {};

    window.DeckSelection.formatDeckTimestamp = (value) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
        return d.toLocaleDateString();
    };
})();

