import type { Seeder } from '../../db/migrator.js';

/**
 * DUMMY data to try the panel. Everything is prefixed with DUMMY_ and lives in
 * its own fake source, so `pnpm db:seed:undo:dev` removes it cleanly.
 */
export const DUMMY_SOURCE_KEY = 'dummy_source';

const DUMMY_ITEMS = [
  {
    externalId: 'DUMMY_001',
    title: 'DUMMY_ Notas de parche de ejemplo',
    contentType: 'patch_notes',
    primaryCategory: 'patch_notes',
    daysAgo: 1,
  },
  {
    externalId: 'DUMMY_002',
    title: 'DUMMY_ Evento de ejemplo',
    contentType: 'announcement',
    primaryCategory: 'events',
    daysAgo: 3,
  },
  {
    externalId: 'DUMMY_003',
    title: 'DUMMY_ Video de ejemplo sobre munición',
    contentType: 'video',
    primaryCategory: 'ammo_guides',
    daysAgo: 5,
  },
  {
    externalId: 'DUMMY_004',
    title: 'DUMMY_ Aviso de sanciones de ejemplo',
    contentType: 'announcement',
    primaryCategory: 'bans_notices',
    daysAgo: 8,
  },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export const up: Seeder = async ({ context: { db, nodeEnv } }) => {
  if (nodeEnv === 'production') {
    throw new Error('Dummy seeders are not allowed in production');
  }
  const { Source, IntelItem, IntelItemTag } = db.models;

  await db.sequelize.transaction(async (transaction) => {
    const source = await Source.create(
      {
        key: DUMMY_SOURCE_KEY,
        name: 'DUMMY_ Fuente de prueba',
        baseUrl: 'https://example.com/',
        sourceType: 'official',
        trustLevel: 'E',
        accessMethod: 'manual',
        gameVersion: 'PC',
        region: null,
        language: 'es',
        status: 'deprecated',
        notes: 'Dummy data for local testing only.',
      },
      { transaction },
    );

    for (const item of DUMMY_ITEMS) {
      const publishedAt = new Date(Date.now() - item.daysAgo * DAY_MS);
      const created = await IntelItem.create(
        {
          sourceId: source.id,
          externalId: item.externalId,
          canonicalUrl: `https://example.com/${item.externalId.toLowerCase()}`,
          title: item.title,
          description: 'Contenido ficticio para probar la interfaz.',
          contentExcerpt: null,
          contentType: item.contentType,
          primaryCategory: item.primaryCategory,
          language: 'es',
          authorOrChannel: 'DUMMY_',
          publishedAt,
          retrievedAt: new Date(),
          gameVersion: null,
          season: null,
          contentHash: `dummy-${item.externalId}`,
          thumbnailUrl: null,
          metadataJson: { dummy: true },
        },
        { transaction },
      );
      await IntelItemTag.create(
        { intelItemId: created.id, tag: 'dummy', assignedBy: 'operator' },
        { transaction },
      );
    }
  });
};

export const down: Seeder = async ({ context: { db } }) => {
  const { Source, IntelItem } = db.models;
  await db.sequelize.transaction(async (transaction) => {
    const source = await Source.findOne({ where: { key: DUMMY_SOURCE_KEY }, transaction });
    if (!source) return;
    // Tags are removed by ON DELETE CASCADE.
    await IntelItem.destroy({ where: { sourceId: source.id }, transaction });
    await source.destroy({ transaction });
  });
};
