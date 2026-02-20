/**
 * Integration Module
 * Bridges the new UI with the existing ArcadeHub
 */

export { UIBridge, bridge } from './Bridge.js';
export { UIMigrator, migrator } from './Migrator.js';

/**
 * Quick start function for easy integration
 * Call this to migrate to the new UI
 */
export async function migrateToNewUI() {
  const { migrator } = await import('./Migrator.js');
  await migrator.migrate();
  return migrator;
}

/**
 * Check if new UI is active
 */
export function isNewUIActive() {
  return document.body.classList.contains('ui-migrated');
}

/**
 * Toggle between old and new UI
 */
export async function toggleUI() {
  const { migrator } = await import('./Migrator.js');
  
  if (migrator.isMigrated()) {
    migrator.rollback();
    return 'old';
  } else {
    await migrator.migrate();
    return 'new';
  }
}
