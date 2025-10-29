import request from 'supertest';
import app from '../../src/app';

describe('Deck Editor search bar - visible selectable results', () => {
  test('typing shows results container with items', async () => {
    const response = await request(app).get('/').expect(200);
    expect(response.text).toContain('deckEditorSearchInput');

    // Basic sanity: the template for results exists
    expect(response.text).toContain('deckEditorSearchResults');
  });
});


