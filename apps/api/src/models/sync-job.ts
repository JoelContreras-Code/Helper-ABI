import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from 'sequelize';
import {
  SYNC_JOB_STATUSES,
  SYNC_TRIGGERS,
  type SyncJobStatus,
  type SyncTrigger,
} from '../domain/constants.js';
import type { SyncJobResult } from './sync-job-result.js';

/** One execution of the intel sync (manual button or scheduled task). */
export class SyncJob extends Model<InferAttributes<SyncJob>, InferCreationAttributes<SyncJob>> {
  declare id: CreationOptional<number>;
  declare trigger: SyncTrigger;
  declare status: CreationOptional<SyncJobStatus>;
  declare rangeFrom: Date | null;
  declare startedAt: Date | null;
  declare finishedAt: Date | null;
  declare error: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare results?: NonAttribute<SyncJobResult[]>;

  static initModel(sequelize: Sequelize): typeof SyncJob {
    SyncJob.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        trigger: {
          type: DataTypes.STRING(16),
          allowNull: false,
          validate: { isIn: [[...SYNC_TRIGGERS]] },
        },
        status: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: 'queued',
          validate: { isIn: [[...SYNC_JOB_STATUSES]] },
        },
        rangeFrom: { type: DataTypes.DATE, allowNull: true },
        startedAt: { type: DataTypes.DATE, allowNull: true },
        finishedAt: { type: DataTypes.DATE, allowNull: true },
        error: { type: DataTypes.TEXT, allowNull: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, tableName: 'sync_jobs', underscored: true },
    );
    return SyncJob;
  }
}
