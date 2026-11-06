import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { Sequelize, type Options } from 'sequelize';
import { ROOT_DIR, type Env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export type DatabaseEnv = Pick<Env, 'DB_DIALECT' | 'DB_STORAGE' | 'DATABASE_URL' | 'DB_LOGGING'>;

/** Resolves the SQLite file path relative to the repository root. */
export function resolveSqliteStorage(storage: string): string {
  if (storage === ':memory:' || isAbsolute(storage)) {
    return storage;
  }
  return resolve(ROOT_DIR, storage);
}

/** Creates the Sequelize connection. The dialect is chosen only by the env file. */
export function createSequelize(env: DatabaseEnv): Sequelize {
  const common: Options = {
    logging: env.DB_LOGGING
      ? (sql: string) => {
          logger.info(sql);
        }
      : false,
    define: { underscored: true },
  };

  if (env.DB_DIALECT === 'postgres') {
    if (env.DATABASE_URL === undefined) {
      throw new Error('DATABASE_URL is required when DB_DIALECT=postgres');
    }
    return new Sequelize(env.DATABASE_URL, { ...common, dialect: 'postgres' });
  }

  const storage = resolveSqliteStorage(env.DB_STORAGE);
  if (storage !== ':memory:') {
    mkdirSync(dirname(storage), { recursive: true });
  }
  // Sequelize enables PRAGMA foreign_keys=ON for SQLite by default.
  return new Sequelize({ ...common, dialect: 'sqlite', storage });
}
