/**
 * Database command line. Used through the root scripts, e.g. `pnpm db:migrate`.
 *
 *   migrate            apply pending migrations
 *   migrate:undo       revert the last migration (DELETES that migration's tables and data;
 *                      production requires --yes-delete-data)
 *   migrate:status     list executed and pending migrations
 *   seed:base          load approved real data (data/knowledge), idempotent
 *   seed:dev           load DUMMY data (refused in production)
 *   seed:undo:dev      remove DUMMY data
 */
import { loadEnv } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { initModels } from '../models/index.js';
import { createMigrator, createSeeder } from './migrator.js';
import { createSequelize } from './sequelize.js';

const COMMANDS = [
  'migrate',
  'migrate:undo',
  'migrate:status',
  'seed:base',
  'seed:dev',
  'seed:undo:dev',
] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(value: string | undefined): value is Command {
  return COMMANDS.includes(value as Command);
}

const umzugLogger = {
  info: (event: Record<string, unknown>) => {
    const action = typeof event.event === 'string' ? event.event : 'event';
    const name = typeof event.name === 'string' ? event.name : '';
    logger.info(`${action} ${name}`.trim());
  },
  warn: (event: Record<string, unknown>) => {
    logger.warn(JSON.stringify(event));
  },
  error: (event: Record<string, unknown>) => {
    logger.error(JSON.stringify(event));
  },
  debug: () => undefined,
};

async function main(): Promise<void> {
  const command = process.argv[2];
  if (!isCommand(command)) {
    logger.error(`Unknown command "${command ?? ''}". Use one of: ${COMMANDS.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const env = loadEnv();
  const sequelize = createSequelize(env);
  const db = initModels(sequelize);
  logger.info(`Database: ${env.DB_DIALECT} (${env.NODE_ENV})`);

  try {
    const migrator = createMigrator(sequelize, umzugLogger);
    switch (command) {
      case 'migrate': {
        const applied = await migrator.up();
        logger.info(`Migrations applied: ${String(applied.length)}`);
        break;
      }
      case 'migrate:undo': {
        // Reverting a migration drops its tables AND their data.
        if (env.NODE_ENV === 'production' && !process.argv.includes('--yes-delete-data')) {
          throw new Error(
            'Reverting a migration deletes data. In production add --yes-delete-data to confirm.',
          );
        }
        const reverted = await migrator.down();
        logger.info(`Migrations reverted: ${String(reverted.length)}`);
        break;
      }
      case 'migrate:status': {
        const executed = await migrator.executed();
        const pending = await migrator.pending();
        logger.info(
          `Executed (${String(executed.length)}): ${executed.map((m) => m.name).join(', ') || '-'}`,
        );
        logger.info(
          `Pending (${String(pending.length)}): ${pending.map((m) => m.name).join(', ') || '-'}`,
        );
        break;
      }
      case 'seed:base':
      case 'seed:dev':
      case 'seed:undo:dev': {
        const pending = await migrator.pending();
        if (pending.length > 0) {
          throw new Error('There are pending migrations. Run `pnpm db:migrate` first.');
        }
        if (command === 'seed:base') {
          await createSeeder(db, 'base', env.NODE_ENV, umzugLogger).up();
        } else if (command === 'seed:dev') {
          if (env.NODE_ENV === 'production') {
            throw new Error('Dummy seeders are not allowed in production');
          }
          await createSeeder(db, 'dev', env.NODE_ENV, umzugLogger).up();
        } else {
          await createSeeder(db, 'dev', env.NODE_ENV, umzugLogger).down({ to: 0 });
        }
        logger.info(`${command} done`);
        break;
      }
    }
  } catch (error) {
    logger.error(`${command} failed`, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

await main();
