import express from 'express';
import { createServer } from 'node:http';
import request from 'supertest';
import type { AddressInfo } from 'node:net';

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

describe('Supertest local transport', () => {
  it('binds temporary listeners to the same IPv4 loopback used by its requests', async () => {
    let bound: AddressInfo | undefined;
    const server = createServer((_req, res) => res.end('intended test server'));
    server.once('listening', () => { bound = server.address() as AddressInfo; });
    try {
      await request(server).get('/').expect(200, 'intended test server');
      // A wildcard bind can share a port with another local process on macOS.
      expect(bound?.address).toBe('127.0.0.1');
      expect(bound?.family).toBe('IPv4');
      expect(server.listening).toBe(false);
    } finally {
      if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });

  it('preserves streamed request bodies while waiting for the temporary listener', async () => {
    const app = express();
    app.use(express.text());
    app.post('/echo', (req, res) => res.send(req.body));
    const pending = request(app).post('/echo').set('Content-Type', 'text/plain');
    pending.write('all assertions ');
    pending.write('preserved');
    await pending.expect(200, 'all assertions preserved');
  });
});
