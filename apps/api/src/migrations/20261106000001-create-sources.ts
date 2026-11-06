import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator.js';

// Migrations are frozen snapshots: never import models or constants here.

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('sources', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    key: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    base_url: { type: DataTypes.STRING(500), allowNull: false },
    source_type: { type: DataTypes.STRING(32), allowNull: false },
    trust_level: { type: DataTypes.STRING(1), allowNull: false },
    access_method: { type: DataTypes.STRING(16), allowNull: false },
    game_version: { type: DataTypes.STRING(32), allowNull: true },
    region: { type: DataTypes.STRING(32), allowNull: true },
    language: { type: DataTypes.STRING(16), allowNull: true },
    status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'pending_review' },
    terms_reviewed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    automation_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('source_sync_states', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    source_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'sources', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    last_attempt_at: { type: DataTypes.DATE, allowNull: true },
    last_success_at: { type: DataTypes.DATE, allowNull: true },
    last_seen_published_at: { type: DataTypes.DATE, allowNull: true },
    cursor: { type: DataTypes.STRING(500), allowNull: true },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'idle' },
    last_error: { type: DataTypes.TEXT, allowNull: true },
    consecutive_failures: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('source_sync_states');
  await queryInterface.dropTable('sources');
};
