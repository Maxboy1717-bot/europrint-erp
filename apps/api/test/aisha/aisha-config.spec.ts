/**
 * @module aisha-config.spec
 * @description AishaConfig allows graceful degradation: keys are optional,
 * but `isFullyConfigured()` returns false until they're all set. Tests
 * exercise the optional-loading + missingKeys() reporting paths.
 */

import { ConfigService } from '@nestjs/config';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';

function makeCfg(map: Record<string, string | undefined>): ConfigService {
  return { get: (k: string) => map[k] } as unknown as ConfigService;
}

const FULL = {
  ANTHROPIC_API_KEY:      'sk-ant-XXXX',
  OPENAI_API_KEY:         'sk-XXXX',
  ELEVENLABS_API_KEY:     'el-XXXX',
  ELEVENLABS_VOICE_ID:    'voice-1',
  PICOVOICE_ACCESS_KEY:   'pv-XXXX',
  GOOGLE_AI_API_KEY:      'g-XXXX',
  AISHA_DIRECTOR_USER_ID: '1',
};

describe('AishaConfig', () => {
  it('loads all keys when fully configured', () => {
    const cfg = new AishaConfig(makeCfg(FULL));
    expect(cfg.anthropicKey).toBe('sk-ant-XXXX');
    expect(cfg.isFullyConfigured()).toBe(true);
    expect(cfg.missingKeys()).toEqual([]);
  });

  it('applies default wake sensitivity when env missing', () => {
    const cfg = new AishaConfig(makeCfg(FULL));
    expect(cfg.wakeSensitivity).toBeCloseTo(0.7);
  });

  it('applies default daily budget when env missing', () => {
    const cfg = new AishaConfig(makeCfg(FULL));
    expect(cfg.dailyBudgetUSD).toBeCloseTo(5);
  });

  it('reports missing keys without throwing', () => {
    const partial = { ...FULL, ANTHROPIC_API_KEY: undefined };
    const cfg = new AishaConfig(makeCfg(partial));
    expect(cfg.isFullyConfigured()).toBe(false);
    expect(cfg.missingKeys()).toContain('ANTHROPIC_API_KEY');
  });

  it('reports missing director id when 0', () => {
    const partial = { ...FULL, AISHA_DIRECTOR_USER_ID: undefined };
    const cfg = new AishaConfig(makeCfg(partial));
    expect(cfg.missingKeys()).toContain('AISHA_DIRECTOR_USER_ID');
  });
});
