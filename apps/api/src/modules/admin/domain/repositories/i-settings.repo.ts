import { SystemSettings } from '../entities/system-settings.entity';

export interface ISettingsRepo {
  getSettings(): Promise<SystemSettings | null>;
  save(settings: SystemSettings): Promise<SystemSettings>;
}

export const SETTINGS_REPO = Symbol('ISettingsRepo');
