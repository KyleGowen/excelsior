import request from 'supertest';
import { app } from '../../src/test-server';

describe('Deck Editor Search - assets wired for visibility', () => {
  test('index page includes search component scripts and css', async () => {
    const res = await request(app).get('/').expect(200);
    const html = res.text;
    expect(html).toContain('/js/services/CardSearchService.js');
    expect(html).toContain('/js/components/DeckEditorSearch.js');
    expect(html).toContain('/css/deck-editor-search.css');
    expect(html).toContain('deckEditorSearchInput');
    expect(html).toContain('deckEditorSearchResults');
  });
});


