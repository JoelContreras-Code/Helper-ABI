import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './lib/logger.js';

const env = loadEnv();
const app = createApp(env);

const server = app.listen(env.API_PORT, env.API_HOST, (error?: Error) => {
  if (error) {
    logger.error(`Could not start API on ${env.API_HOST}:${String(env.API_PORT)}`, error);
    process.exit(1);
  }
  logger.info(`API (${env.NODE_ENV}) listening on http://${env.API_HOST}:${String(env.API_PORT)}`);
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
