import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator.js';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('intel_items', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    source_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'sources', key: 'id' },
      onUpdate: 'CASCADE',
      // Never lose collected history by deleting a source.
      onDelete: 'RESTRICT',
    },
    external_id: { type: DataTypes.STRING(255), allowNull: false },
    canonical_url: { type: DataTypes.STRING(1000), allowNull: false },
    title: { type: DataTypes.STRING(500), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    content_excerpt: { type: DataTypes.TEXT, allowNull: true },
    content_type: { type: DataTypes.STRING(24), allowNull: false },
    primary_category: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'other' },
    language: { type: DataTypes.STRING(16), allowNull: true },
    author_or_channel: { type: DataTypes.STRING(200), allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    retrieved_at: { type: DataTypes.DATE, allowNull: false },
    game_version: { type: DataTypes.STRING(32), allowNull: true },
    season: { type: DataTypes.STRING(64), allowNull: true },
    verification_status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' },
    processing_status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'new' },
    content_hash: { type: DataTypes.STRING(64), allowNull: false },
    thumbnail_url: { type: DataTypes.STRING(1000), allowNull: true },
    metadata_json: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('intel_items', ['source_id', 'external_id'], {
    name: 'intel_items_source_external_uq',
    unique: true,
  });
  await queryInterface.addIndex('intel_items', ['published_at'], {
    name: 'intel_items_published_at_idx',
  });
  await queryInterface.addIndex('intel_items', ['primary_category'], {
    name: 'intel_items_category_idx',
  });

  await queryInterface.createTable('intel_item_tags', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    intel_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'intel_items', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    tag: { type: DataTypes.STRING(48), allowNull: false },
    assigned_by: { type: DataTypes.STRING(16), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('intel_item_tags', ['intel_item_id', 'tag'], {
    name: 'intel_item_tags_item_tag_uq',
    unique: true,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('intel_item_tags');
  await queryInterface.dropTable('intel_items');
};
