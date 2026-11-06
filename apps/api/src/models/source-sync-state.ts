import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { SYNC_STATE_STATUSES, type SyncStateStatus } from '../domain/constants.js';
import type { Source } from './source.js';

/** Incremental sync cursor of a source (docs/06-intel-pipeline.md §2). */
export class SourceSyncState extends Model<
  InferAttributes<SourceSyncState>,
  InferCreationAttributes<SourceSyncState>
> {
  declare id: CreationOptional<number>;
  declare sourceId: ForeignKey<Source['id']>;
  declare lastAttemptAt: Date | null;
  declare lastSuccessAt: Date | null;
  declare lastSeenPublishedAt: Date | null;
  declare cursor: string | null;
  declare status: CreationOptional<SyncStateStatus>;
  declare lastError: string | null;
  declare consecutiveFailures: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): typeof SourceSyncState {
    SourceSyncState.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        lastAttemptAt: { type: DataTypes.DATE, allowNull: true },
        lastSuccessAt: { type: DataTypes.DATE, allowNull: true },
        lastSeenPublishedAt: { type: DataTypes.DATE, allowNull: true },
        cursor: { type: DataTypes.STRING(500), allowNull: true },
        status: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: 'idle',
          validate: { isIn: [[...SYNC_STATE_STATUSES]] },
        },
        lastError: { type: DataTypes.TEXT, allowNull: true },
        consecutiveFailures: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, tableName: 'source_sync_states', underscored: true },
    );
    return SourceSyncState;
  }
}
