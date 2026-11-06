import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createMigrator } from './db/migrator.js';
import { createSequelize } from './db/sequelize.js';
import { logger } from './lib/logger.js';
import { initModels } from './models/index.js';

async function start(): Promise<void> {
  const env = loadEnv();
  const sequelize = createSequelize(env);
  const db = initModels(sequelize);

  await sequelize.authenticate();
  const pending = await createMigrator(sequelize).pending();
  if (pending.length > 0) {
    logger.error(
      `Database has ${String(pending.length)} pending migration(s). Run \`pnpm db:migrate\` first.`,
    );
    await sequelize.close();
    process.exit(1);
  }

  const app = createApp({ env, db });
  const server = app.listen(env.API_PORT, env.API_HOST, (error?: Error) => {
    if (error) {
      logger.error(`Could not start API on ${env.API_HOST}:${String(env.API_PORT)}`, error);
      process.exit(1);
    }
    logger.info(
      `API (${env.NODE_ENV}, ${env.DB_DIALECT}) listening on http://${env.API_HOST}:${String(env.API_PORT)}`,
    );
  });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      void sequelize.close().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error: unknown) => {
  logger.error('API failed to start', error instanceof Error ? error.message : error);
  process.exit(1);
});
