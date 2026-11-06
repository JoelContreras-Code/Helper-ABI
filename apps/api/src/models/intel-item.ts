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
import {
  CATEGORIES,
  CONTENT_TYPES,
  PROCESSING_STATUSES,
  VERIFICATION_STATUSES,
  type Category,
  type ContentType,
  type ProcessingStatus,
  type VerificationStatus,
} from '../domain/constants.js';
import type { IntelItemTag } from './intel-item-tag.js';
import type { Source } from './source.js';

/** External content collected from a source (news, patch notes, videos...). */
export class IntelItem extends Model<
  InferAttributes<IntelItem>,
  InferCreationAttributes<IntelItem>
> {
  declare id: CreationOptional<number>;
  declare sourceId: ForeignKey<Source['id']>;
  declare externalId: string;
  declare canonicalUrl: string;
  declare title: string;
  declare description: string | null;
  declare contentExcerpt: string | null;
  declare contentType: ContentType;
  declare primaryCategory: CreationOptional<Category>;
  declare language: string | null;
  declare authorOrChannel: string | null;
  declare publishedAt: Date | null;
  declare retrievedAt: Date;
  declare gameVersion: string | null;
  declare season: string | null;
  declare verificationStatus: CreationOptional<VerificationStatus>;
  declare processingStatus: CreationOptional<ProcessingStatus>;
  declare contentHash: string;
  declare thumbnailUrl: string | null;
  declare metadataJson: Record<string, unknown> | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare source?: NonAttribute<Source>;
  declare tags?: NonAttribute<IntelItemTag[]>;

  static initModel(sequelize: Sequelize): typeof IntelItem {
    IntelItem.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        externalId: { type: DataTypes.STRING(255), allowNull: false },
        canonicalUrl: { type: DataTypes.STRING(1000), allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        contentExcerpt: { type: DataTypes.TEXT, allowNull: true },
        contentType: {
          type: DataTypes.STRING(24),
          allowNull: false,
          validate: { isIn: [[...CONTENT_TYPES]] },
        },
        primaryCategory: {
          type: DataTypes.STRING(32),
          allowNull: false,
          defaultValue: 'other',
          validate: { isIn: [[...CATEGORIES]] },
        },
        language: { type: DataTypes.STRING(16), allowNull: true },
        authorOrChannel: { type: DataTypes.STRING(200), allowNull: true },
        publishedAt: { type: DataTypes.DATE, allowNull: true },
        retrievedAt: { type: DataTypes.DATE, allowNull: false },
        gameVersion: { type: DataTypes.STRING(32), allowNull: true },
        season: { type: DataTypes.STRING(64), allowNull: true },
        verificationStatus: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: 'pending',
          validate: { isIn: [[...VERIFICATION_STATUSES]] },
        },
        processingStatus: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: 'new',
          validate: { isIn: [[...PROCESSING_STATUSES]] },
        },
        contentHash: { type: DataTypes.STRING(64), allowNull: false },
        thumbnailUrl: { type: DataTypes.STRING(1000), allowNull: true },
        metadataJson: { type: DataTypes.JSON, allowNull: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, tableName: 'intel_items', underscored: true },
    );
    return IntelItem;
  }
}
