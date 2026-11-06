import type { Sequelize } from 'sequelize';
import { IntelItemTag } from './intel-item-tag.js';
import { IntelItem } from './intel-item.js';
import { SourceSyncState } from './source-sync-state.js';
import { Source } from './source.js';
import { SyncJobResult } from './sync-job-result.js';
import { SyncJob } from './sync-job.js';

export { IntelItem, IntelItemTag, Source, SourceSyncState, SyncJob, SyncJobResult };

export interface Models {
  Source: typeof Source;
  SourceSyncState: typeof SourceSyncState;
  SyncJob: typeof SyncJob;
  SyncJobResult: typeof SyncJobResult;
  IntelItem: typeof IntelItem;
  IntelItemTag: typeof IntelItemTag;
}

export interface Database {
  sequelize: Sequelize;
  models: Models;
}

/** Registers every model and its associations on the given connection. */
export function initModels(sequelize: Sequelize): Database {
  const models: Models = {
    Source: Source.initModel(sequelize),
    SourceSyncState: SourceSyncState.initModel(sequelize),
    SyncJob: SyncJob.initModel(sequelize),
    SyncJobResult: SyncJobResult.initModel(sequelize),
    IntelItem: IntelItem.initModel(sequelize),
    IntelItemTag: IntelItemTag.initModel(sequelize),
  };

  Source.hasOne(SourceSyncState, { foreignKey: 'sourceId', as: 'syncState' });
  SourceSyncState.belongsTo(Source, { foreignKey: 'sourceId', as: 'source' });

  SyncJob.hasMany(SyncJobResult, { foreignKey: 'syncJobId', as: 'results' });
  SyncJobResult.belongsTo(SyncJob, { foreignKey: 'syncJobId', as: 'syncJob' });
  SyncJobResult.belongsTo(Source, { foreignKey: 'sourceId', as: 'source' });

  Source.hasMany(IntelItem, { foreignKey: 'sourceId', as: 'intelItems' });
  IntelItem.belongsTo(Source, { foreignKey: 'sourceId', as: 'source' });
  IntelItem.hasMany(IntelItemTag, { foreignKey: 'intelItemId', as: 'tags' });
  IntelItemTag.belongsTo(IntelItem, { foreignKey: 'intelItemId', as: 'intelItem' });

  return { sequelize, models };
}
