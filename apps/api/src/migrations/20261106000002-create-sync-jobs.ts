import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator.js';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('sync_jobs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    trigger: { type: DataTypes.STRING(16), allowNull: false },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'queued' },
    range_from: { type: DataTypes.DATE, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    finished_at: { type: DataTypes.DATE, allowNull: true },
    error: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('sync_jobs', ['status'], { name: 'sync_jobs_status_idx' });

  await queryInterface.createTable('sync_job_results', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    sync_job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'sync_jobs', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    source_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'sources', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    status: { type: DataTypes.STRING(16), allowNull: false },
    items_created: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    items_updated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    duplicates_skipped: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    error: { type: DataTypes.TEXT, allowNull: true },
    duration_ms: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('sync_job_results', ['sync_job_id', 'source_id'], {
    name: 'sync_job_results_job_source_uq',
    unique: true,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('sync_job_results');
  await queryInterface.dropTable('sync_jobs');
};
