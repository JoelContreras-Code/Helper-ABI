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
  ACCESS_METHODS,
  SOURCE_STATUSES,
  SOURCE_TYPES,
  TRUST_LEVELS,
  type AccessMethod,
  type SourceStatus,
  type SourceType,
  type TrustLevel,
} from '../domain/constants.js';
import type { SourceSyncState } from './source-sync-state.js';

/** Catalog of information sources (docs/05-sources.md). */
export class Source extends Model<InferAttributes<Source>, InferCreationAttributes<Source>> {
  declare id: CreationOptional<number>;
  declare key: string;
  declare name: string;
  declare baseUrl: string;
  declare sourceType: SourceType;
  declare trustLevel: TrustLevel;
  declare accessMethod: AccessMethod;
  declare gameVersion: string | null;
  declare region: string | null;
  declare language: string | null;
  declare status: CreationOptional<SourceStatus>;
  declare termsReviewed: CreationOptional<boolean>;
  declare automationEnabled: CreationOptional<boolean>;
  declare notes: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare syncState?: NonAttribute<SourceSyncState>;

  static initModel(sequelize: Sequelize): typeof Source {
    Source.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        key: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(160), allowNull: false },
        baseUrl: { type: DataTypes.STRING(500), allowNull: false },
        sourceType: {
          type: DataTypes.STRING(32),
          allowNull: false,
          validate: { isIn: [[...SOURCE_TYPES]] },
        },
        trustLevel: {
          type: DataTypes.STRING(1),
          allowNull: false,
          validate: { isIn: [[...TRUST_LEVELS]] },
        },
        accessMethod: {
          type: DataTypes.STRING(16),
          allowNull: false,
          validate: { isIn: [[...ACCESS_METHODS]] },
        },
        gameVersion: { type: DataTypes.STRING(32), allowNull: true },
        region: { type: DataTypes.STRING(32), allowNull: true },
        language: { type: DataTypes.STRING(16), allowNull: true },
        status: {
          type: DataTypes.STRING(24),
          allowNull: false,
          defaultValue: 'pending_review',
          validate: { isIn: [[...SOURCE_STATUSES]] },
        },
        termsReviewed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        automationEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        notes: { type: DataTypes.TEXT, allowNull: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, tableName: 'sources', underscored: true },
    );
    return Source;
  }

  /** A source may only be fetched automatically when active, reviewed and enabled. */
  get canAutomate(): NonAttribute<boolean> {
    return this.status === 'active' && this.termsReviewed && this.automationEnabled;
  }
}
