import type { WhereOptions } from 'sequelize';
import type { Database, IntelItem } from '../models/index.js';
import type { ListIntelQuery } from '../validators/intel.js';
import { serializeIntelItem } from './serializers.js';

/** Paginated list of collected items, newest first (items without date last). */
export async function listIntel(db: Database, query: ListIntelQuery) {
  const { IntelItem, Source, IntelItemTag } = db.models;
  const where: WhereOptions<IntelItem> = {};
  if (query.category) {
    where.primaryCategory = query.category;
  }

  const { rows, count } = await IntelItem.findAndCountAll({
    where,
    include: [
      {
        model: Source,
        as: 'source',
        attributes: ['key', 'name', 'trustLevel'],
        required: query.source !== undefined,
        ...(query.source !== undefined ? { where: { key: query.source } } : {}),
      },
      { model: IntelItemTag, as: 'tags', attributes: ['tag'] },
    ],
    order: [
      ['publishedAt', 'DESC NULLS LAST'],
      ['id', 'DESC'],
    ],
    limit: query.limit,
    offset: query.offset,
    distinct: true,
  });

  return {
    items: rows.map(serializeIntelItem),
    total: count,
    limit: query.limit,
    offset: query.offset,
  };
}
