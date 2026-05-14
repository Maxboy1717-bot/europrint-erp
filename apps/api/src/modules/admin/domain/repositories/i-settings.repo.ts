/**
 * @module i-settings.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { SystemSettings } from '../entities/system-settings.entity';

export interface ISettingsRepo {
  getSettings(): Promise<SystemSettings | null>;
  save(settings: SystemSettings): Promise<SystemSettings>;
}

export const SETTINGS_REPO = Symbol('ISettingsRepo');
