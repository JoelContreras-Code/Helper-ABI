import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

/** Repository root (apps/api/src/config -> ../../../..), same depth from dist/config. */
export const ROOT_DIR = resolve(import.meta.dirname, '../../../..');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_HOST: z.string().min(1).default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    WEB_ORIGIN: z.url().default('http://127.0.0.1:5173'),
    INGEST_TOKEN: z
      .string()
      .min(32, 'must be at least 32 characters (run scripts/setup.ps1 to generate one)'),
    DB_DIALECT: z.enum(['sqlite', 'postgres']).default('sqlite'),
    DB_STORAGE: z.string().min(1).default('./data/helper-abi.development.sqlite'),
    DATABASE_URL: z.url().optional(),
    DB_LOGGING: z.stringbool().default(false),
  })
  .refine((env) => env.DB_DIALECT !== 'postgres' || env.DATABASE_URL !== undefined, {
    message: 'DATABASE_URL is required when DB_DIALECT=postgres',
    path: ['DATABASE_URL'],
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Validates raw environment variables. Throws a readable error listing every
 * invalid variable so misconfiguration fails fast at startup.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/**
 * Loads `.env.<NODE_ENV>` from the repository root (if present) into
 * process.env, then validates it. Variables already set in the shell win.
 */
export function loadEnv(): Env {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const envFile = resolve(ROOT_DIR, `.env.${nodeEnv}`);
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
  return parseEnv(process.env);
}
