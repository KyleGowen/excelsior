import express from 'express';
import { createServer } from 'node:http';
import request from 'supertest';

describe('Supertest HTTP isolation', () => {
  it('binds each temporary server to the loopback address used by its client', async () => {
    const app = express();
    app.get('/address', (req, res) => res.json({ address: req.socket.localAddress }));
    for (let index = 0; index < 100; index += 1) {
      await request(app).get('/address').expect(200, { address: '127.0.0.1' });
    }
  });

  it('keeps a shared server open until overlapping requests finish, then closes it', async () => {
    const server = createServer((req, res) => {
      if (req.url === '/slow') setTimeout(() => res.end('slow'), 20);
      else res.end('fast');
    });
    try {
      await Promise.all([
        request(server).get('/slow').expect(200, 'slow'),
        request(server).get('/fast').expect(200, 'fast'),
      ]);
      expect(server.listening).toBe(false);
    } finally {
      if (server.listening) await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
    }
  });

  it('persists agent cookies while keeping anonymous requests isolated', async () => {
    const app = express();
    app.get('/login', (_req, res) => res.cookie('session', 'fictional').sendStatus(200));
    app.get('/cookie', (req, res) => res.json({ cookie: req.headers.cookie ?? null }));
    const signedIn = request.agent(app);
    const anonymous = request.agent(app);
    await signedIn.get('/login').expect(200);
    await signedIn.get('/cookie').expect(200, { cookie: 'session=fictional' });
    await anonymous.get('/cookie').expect(200, { cookie: null });
    await request(app).get('/cookie').expect(200, { cookie: null });
  });
});
