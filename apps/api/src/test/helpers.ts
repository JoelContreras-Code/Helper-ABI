import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';
import { parseEnv, type Env } from '../config/env.js';
import { createMigrator } from '../db/migrator.js';
import { createSequelize } from '../db/sequelize.js';
import { initModels, type Database, type Source } from '../models/index.js';

export const TEST_TOKEN = 'test-token-0123456789-abcdefghijklmnopqrstuvwxyz';
export const WEB_ORIGIN = 'http://127.0.0.1:5173';

export function testEnv(overrides: Record<string, string> = {}): Env {
  return parseEnv({
    NODE_ENV: 'test',
    INGEST_TOKEN: TEST_TOKEN,
    DB_STORAGE: ':memory:',
    WEB_ORIGIN,
    ...overrides,
  });
}

/** Fresh in-memory SQLite database with every migration applied. */
export async function createTestDb(): Promise<Database> {
  const db = initModels(createSequelize(testEnv()));
  await createMigrator(db.sequelize).up();
  return db;
}

export async function createTestSource(
  db: Database,
  overrides: Partial<Parameters<typeof db.models.Source.create>[0]> = {},
): Promise<Source> {
  return db.models.Source.create({
    key: 'test_source',
    name: 'Test source',
    baseUrl: 'https://example.com/',
    sourceType: 'official',
    trustLevel: 'A',
    accessMethod: 'api',
    gameVersion: 'PC',
    region: null,
    language: 'en',
    status: 'active',
    termsReviewed: true,
    automationEnabled: true,
    notes: null,
    ...overrides,
  });
}

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

export async function startServer(app: Express): Promise<TestServer> {
  const server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => {
      resolve(instance);
    });
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${String(port)}`,
    close: () =>
      new Promise<void>((resolve) =>
        server.close(() => {
          resolve();
        }),
      ),
  };
}

export interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
  headers: Headers;
}

/** Small JSON client for route tests. */
export function apiClient(baseUrl: string) {
  return async function request(
    method: string,
    path: string,
    options: { body?: unknown; token?: string; headers?: Record<string, string> } = {},
  ): Promise<ApiResponse> {
    const headers: Record<string, string> = { ...options.headers };
    if (options.body !== undefined) headers['content-type'] ??= 'application/json';
    if (options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      ...(options.body !== undefined
        ? { body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) }
        : {}),
    });
    const text = await response.text();
    const body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    return { status: response.status, body, headers: response.headers };
  };
}

/** A valid ingest item; override fields per test. */
export function ingestItem(overrides: Record<string, unknown> = {}) {
  return {
    external_id: 'item-1',
    canonical_url: 'https://example.com/news/1',
    title: 'Patch notes 1.0',
    content_type: 'patch_notes',
    primary_category: 'patch_notes',
    published_at: '2026-11-01T10:00:00Z',
    retrieved_at: '2026-11-06T12:00:00Z',
    ...overrides,
  };
}
