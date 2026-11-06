import { Router } from 'express';
import { APP_INFO } from '../config/app-info.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: APP_INFO.service,
    version: APP_INFO.version,
    time: new Date().toISOString(),
  });
});
