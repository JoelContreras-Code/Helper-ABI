import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from 'sequelize';
import { SYNC_RESULT_STATUSES, type SyncResultStatus } from '../domain/constants.js';
import type { Source } from './source.js';
import type { SyncJob } from './sync-job.js';

/** Outcome of one source inside a sync job. */
export class SyncJobResult extends Model<
  InferAttributes<SyncJobResult>,
  InferCreationAttributes<SyncJobResult>
> {
  declare id: CreationOptional<number>;
  declare syncJobId: ForeignKey<SyncJob['id']>;
  declare sourceId: ForeignKey<Source['id']>;
  declare status: SyncResultStatus;
  declare itemsCreated: CreationOptional<number>;
  declare itemsUpdated: CreationOptional<number>;
  declare duplicatesSkipped: CreationOptional<number>;
  declare error: string | null;
  declare durationMs: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare source?: NonAttribute<Source>;

  static initModel(sequelize: Sequelize): typeof SyncJobResult {
    SyncJobResult.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        status: {
          type: DataTypes.STRING(16),
          allowNull: false,
          validate: { isIn: [[...SYNC_RESULT_STATUSES]] },
        },
        itemsCreated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        itemsUpdated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        duplicatesSkipped: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        error: { type: DataTypes.TEXT, allowNull: true },
        durationMs: { type: DataTypes.INTEGER, allowNull: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, tableName: 'sync_job_results', underscored: true },
    );
    return SyncJobResult;
  }
}
