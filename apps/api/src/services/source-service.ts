import type { Database } from '../models/index.js';
import { serializeSource } from './serializers.js';

export async function listSources(db: Database) {
  const sources = await db.models.Source.findAll({
    include: [{ model: db.models.SourceSyncState, as: 'syncState' }],
    order: [
      ['trustLevel', 'ASC'],
      ['key', 'ASC'],
    ],
  });
  return sources.map(serializeSource);
}
