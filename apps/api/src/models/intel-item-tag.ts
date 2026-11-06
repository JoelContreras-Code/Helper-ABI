import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { TAG_ASSIGNERS, type TagAssigner } from '../domain/constants.js';
import type { IntelItem } from './intel-item.js';

/** Secondary categories / labels of an intel item. */
export class IntelItemTag extends Model<
  InferAttributes<IntelItemTag>,
  InferCreationAttributes<IntelItemTag>
> {
  declare id: CreationOptional<number>;
  declare intelItemId: ForeignKey<IntelItem['id']>;
  declare tag: string;
  declare assignedBy: TagAssigner;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize): typeof IntelItemTag {
    IntelItemTag.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tag: { type: DataTypes.STRING(48), allowNull: false },
        assignedBy: {
          type: DataTypes.STRING(16),
          allowNull: false,
          validate: { isIn: [[...TAG_ASSIGNERS]] },
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      { sequelize, tableName: 'intel_item_tags', underscored: true },
    );
    return IntelItemTag;
  }
}
