import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('applies safe defaults (localhost only)', () => {
    const env = parseEnv({});
    expect(env).toEqual({
      NODE_ENV: 'development',
      API_HOST: '127.0.0.1',
      API_PORT: 4000,
      WEB_ORIGIN: 'http://127.0.0.1:5173',
    });
  });

  it('coerces the port from a string', () => {
    expect(parseEnv({ API_PORT: '4100' }).API_PORT).toBe(4100);
  });

  it('rejects an invalid port', () => {
    expect(() => parseEnv({ API_PORT: '99999' })).toThrow(/API_PORT/);
  });

  it('rejects an invalid web origin', () => {
    expect(() => parseEnv({ WEB_ORIGIN: 'not-a-url' })).toThrow(/WEB_ORIGIN/);
  });
});
