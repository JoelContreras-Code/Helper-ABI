import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { parseEnv } from './config/env.js';

const WEB_ORIGIN = 'http://127.0.0.1:5173';
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = createApp(parseEnv({ NODE_ENV: 'test', WEB_ORIGIN }));
  server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => {
      resolve(instance);
    });
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${String(port)}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) =>
    server.close(() => {
      resolve();
    }),
  );
});

describe('API app', () => {
  it('GET /api/health reports ok', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 'ok', service: 'helper-abi-api' });
    expect(typeof body.time).toBe('string');
  });

  it('returns JSON 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });

  it('allows CORS only for the configured web origin', async () => {
    const allowed = await fetch(`${baseUrl}/api/health`, { headers: { Origin: WEB_ORIGIN } });
    expect(allowed.headers.get('access-control-allow-origin')).toBe(WEB_ORIGIN);

    const other = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://evil.example' },
    });
    expect(other.headers.get('access-control-allow-origin')).not.toBe('http://evil.example');
  });

  it('sets security headers (helmet) and hides the framework', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-powered-by')).toBeNull();
  });
});
