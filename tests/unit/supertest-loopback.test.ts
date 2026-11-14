import { createServer } from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import request from 'supertest';

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
