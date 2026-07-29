import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { afterEach, describe, it } from 'node:test';
import { FirecrawlProvider } from './firecrawlProvider.js';

const servers: Array<{ server: ReturnType<typeof createServer>; port: number }> = [];

afterEach(async () => {
  for (const entry of servers.splice(0)) {
    await new Promise<void>((resolve, reject) => {
      entry.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

describe('FirecrawlProvider', () => {
  it('normalizes host-only URLs and returns parsed content', async () => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><head><title>Test Title</title><meta name="description" content="Test description" /></head><body><h1>Heading</h1><p>Body content</p></body></html>');
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Server did not bind to a port');
    }

    const port = address.port;
    servers.push({ server, port });
    const provider = new FirecrawlProvider();
    const result = await provider.scrape(`127.0.0.1:${port}`);

    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.title, 'Test Title');
    assert.equal(result.description, 'Test description');
    assert.match(result.content ?? '', /Body content/);
  });
});
