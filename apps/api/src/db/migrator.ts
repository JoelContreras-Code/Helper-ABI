import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { QueryInterface, Sequelize } from 'sequelize';
import { memoryStorage, SequelizeStorage, Umzug, type MigrationFn, type UmzugStorage } from 'umzug';
import type { Database } from '../models/index.js';

/** Signature of a schema migration file (src/migrations). */
export type Migration = MigrationFn<QueryInterface>;

/** Context received by seeders (src/seeders). */
export interface SeedContext {
  db: Database;
  nodeEnv: string;
}
export type Seeder = MigrationFn<SeedContext>;

interface StepModule<T> {
  up: MigrationFn<T>;
  down?: MigrationFn<T>;
}

/** Same shape as Umzug's logger option; undefined silences it (tests). */
export type UmzugLogger =
  Record<'info' | 'warn' | 'error' | 'debug', (event: Record<string, unknown>) => void> | undefined;

/** src/ when running with tsx/vitest, dist/ when running compiled code. */
const CODE_DIR = resolve(import.meta.dirname, '..');

/**
 * Lists step files (.ts or .js) of a folder, sorted by name. The extension is
 * removed from the name so the same history works from src/ and dist/.
 */
function loadSteps<T>(folder: string) {
  const dir = join(CODE_DIR, folder);
  return readdirSync(dir)
    .filter(
      (file) => /\.(ts|js)$/.test(file) && !file.endsWith('.d.ts') && !file.includes('.test.'),
    )
    .sort()
    .map((file) => {
      const path = join(dir, file);
      const name = file.replace(/\.(ts|js)$/, '');
      const load = async () => (await import(pathToFileURL(path).href)) as StepModule<T>;
      return {
        name,
        path,
        up: async ({ context }: { context: T }) => {
          await (await load()).up({ name, path, context });
        },
        down: async ({ context }: { context: T }) => {
          const step = await load();
          if (!step.down) {
            throw new Error(`Step ${name} cannot be undone (no down function)`);
          }
          await step.down({ name, path, context });
        },
      };
    });
}

/** Schema migrations. History is stored in the SequelizeMeta table. */
export function createMigrator(sequelize: Sequelize, logger?: UmzugLogger) {
  return new Umzug<QueryInterface>({
    migrations: loadSteps<QueryInterface>('migrations'),
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' }),
    logger,
  });
}

export type SeedKind = 'base' | 'dev';

/**
 * Seeders.
 * - base: approved real data; idempotent upserts that run every time (no history).
 * - dev: dummy data; history stored in SequelizeDevSeeds so it can be undone.
 */
export function createSeeder(db: Database, kind: SeedKind, nodeEnv: string, logger?: UmzugLogger) {
  const storage: UmzugStorage =
    kind === 'dev'
      ? new SequelizeStorage({ sequelize: db.sequelize, tableName: 'SequelizeDevSeeds' })
      : memoryStorage();
  return new Umzug<SeedContext>({
    migrations: loadSteps<SeedContext>(`seeders/${kind}`),
    context: { db, nodeEnv },
    storage,
    logger,
  });
}
