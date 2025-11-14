import request from 'supertest';
import { Express } from 'express';

export class ApiClient {
  private app: Express;
  private cookies: string[] = [];

  constructor(app: Express) {
    this.app = app;
  }

  // Authentication helpers
  async login(username: string, password: string) {
    const response = await request(this.app)
      .post('/api/auth/login')
      .send({ username, password })
      .expect(200);

    // Extract cookies from response
    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders && Array.isArray(setCookieHeaders)) {
      this.cookies = setCookieHeaders.map((cookie: string) => cookie.split(';')[0]);
    }

    return response.body;
  }

  async logout() {
    const response = await request(this.app)
      .post('/api/auth/logout')
      .set('Cookie', this.cookies)
      .expect(200);

    this.cookies = [];
    return response.body;
  }

  async getCurrentUser() {
    return request(this.app)
      .get('/api/auth/me')
      .set('Cookie', this.cookies)
      .expect(200);
  }

  // Deck management helpers
  async createDeck(deckData: { name: string; description?: string; characters?: string[] }) {
    return request(this.app)
      .post('/api/decks')
      .set('Cookie', this.cookies)
      .send(deckData)
      .expect(201);
  }

  async getDeck(deckId: string) {
    return request(this.app)
      .get(`/api/decks/${deckId}`)
      .set('Cookie', this.cookies)
      .expect(200);
  }

  async updateDeck(deckId: string, deckData: { name?: string; description?: string }) {
    return request(this.app)
      .put(`/api/decks/${deckId}`)
      .set('Cookie', this.cookies)
      .send(deckData)
      .expect(200);
  }

  async deleteDeck(deckId: string) {
    return request(this.app)
      .delete(`/api/decks/${deckId}`)
      .set('Cookie', this.cookies)
      .expect(200);
  }

  async addCardToDeck(deckId: string, cardData: { cardType: string; cardId: string; quantity: number }) {
    const response = await request(this.app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Cookie', this.cookies)
      .send(cardData);
    
    if (response.status !== 200) {
      const errorMsg = response.body?.error || response.body?.message || JSON.stringify(response.body);
      console.error(`❌ Card addition failed: ${response.status}`);
      console.error(`   Request: ${JSON.stringify(cardData)}`);
      console.error(`   Response: ${errorMsg}`);
      throw new Error(`Card addition failed with status ${response.status}: ${errorMsg}`);
    }
    
    expect(response.status).toBe(200);
    return response;
  }

  async removeCardFromDeck(deckId: string, cardData: { cardType: string; cardId: string; quantity: number }) {
    return request(this.app)
      .delete(`/api/decks/${deckId}/cards`)
      .set('Cookie', this.cookies)
      .send(cardData)
      .expect(200);
  }

  // Generic request helper
  async request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: any) {
    const methodLower = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
    let req = request(this.app)[methodLower](path).set('Cookie', this.cookies);
    
    if (data) {
      req = req.send(data);
    }
    
    return req;
  }
}
