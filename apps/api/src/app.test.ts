import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import type { Database } from './models/index.js';
import {
  apiClient,
  createTestDb,
  startServer,
  testEnv,
  WEB_ORIGIN,
  type TestServer,
} from './test/helpers.js';

let db: Database;
let server: TestServer;
let request: ReturnType<typeof apiClient>;

beforeAll(async () => {
  db = await createTestDb();
  server = await startServer(createApp({ env: testEnv(), db }));
  request = apiClient(server.baseUrl);
});

afterAll(async () => {
  await server.close();
  await db.sequelize.close();
});

describe('API app', () => {
  it('GET /api/health reports ok', async () => {
    const response = await request('GET', '/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'helper-abi-api' });
    expect(typeof response.body.time).toBe('string');
  });

  it('returns JSON 404 for unknown routes', async () => {
    const response = await request('GET', '/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'not_found' });
  });

  it('allows CORS only for the configured web origin', async () => {
    const allowed = await request('GET', '/api/health', { headers: { Origin: WEB_ORIGIN } });
    expect(allowed.headers.get('access-control-allow-origin')).toBe(WEB_ORIGIN);

    const other = await request('GET', '/api/health', {
      headers: { Origin: 'http://evil.example' },
    });
    expect(other.headers.get('access-control-allow-origin')).not.toBe('http://evil.example');
  });

  it('sets security headers (helmet) and hides the framework', async () => {
    const response = await request('GET', '/api/health');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-powered-by')).toBeNull();
  });

  it('rejects non-JSON write requests (cross-site form protection)', async () => {
    const response = await request('POST', '/api/sync-jobs', {
      body: 'trigger=manual',
      headers: { 'content-type': 'text/plain' },
    });
    expect(response.status).toBe(415);
    expect(response.body).toEqual({ error: 'unsupported_media_type' });
  });

  it('answers malformed JSON with a clean 400', async () => {
    const response = await request('POST', '/api/sync-jobs', { body: '{"trigger":' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid_json' });
  });
});
