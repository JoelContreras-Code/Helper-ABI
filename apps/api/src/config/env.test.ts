import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const TOKEN = 'x'.repeat(32);

describe('parseEnv', () => {
  it('applies safe defaults (localhost only, SQLite)', () => {
    const env = parseEnv({ INGEST_TOKEN: TOKEN });
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      API_HOST: '127.0.0.1',
      API_PORT: 4000,
      WEB_ORIGIN: 'http://127.0.0.1:5173',
      DB_DIALECT: 'sqlite',
      DB_LOGGING: false,
    });
  });

  it('requires an ingest token of at least 32 characters', () => {
    expect(() => parseEnv({})).toThrow(/INGEST_TOKEN/);
    expect(() => parseEnv({ INGEST_TOKEN: 'short' })).toThrow(/INGEST_TOKEN/);
  });

  it('coerces numbers and booleans from strings', () => {
    const env = parseEnv({ INGEST_TOKEN: TOKEN, API_PORT: '4100', DB_LOGGING: 'true' });
    expect(env.API_PORT).toBe(4100);
    expect(env.DB_LOGGING).toBe(true);
  });

  it('rejects an invalid port or web origin', () => {
    expect(() => parseEnv({ INGEST_TOKEN: TOKEN, API_PORT: '99999' })).toThrow(/API_PORT/);
    expect(() => parseEnv({ INGEST_TOKEN: TOKEN, WEB_ORIGIN: 'not-a-url' })).toThrow(/WEB_ORIGIN/);
  });

  it('requires DATABASE_URL when using PostgreSQL', () => {
    expect(() => parseEnv({ INGEST_TOKEN: TOKEN, DB_DIALECT: 'postgres' })).toThrow(/DATABASE_URL/);
  });
});
