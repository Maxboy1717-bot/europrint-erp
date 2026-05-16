import { WakeConfigController } from '../../src/modules/aisha/presentation/controllers/wake-config.controller';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';
import { ForbiddenException } from '@nestjs/common';

function fakeCfg(): AishaConfig {
  return {
    picovoiceKey: 'pv', elevenLabsVoiceId: 'v',
    wakeSensitivity: 0.7, directorUserId: 1,
  } as unknown as AishaConfig;
}

describe('WakeConfigController', () => {
  it('returns access key + ppn URL', () => {
    const ctrl = new WakeConfigController(fakeCfg());
    const r = ctrl.config();
    expect(r.accessKey).toBe('pv');
    expect(r.ppnUrl).toBe('/aisha/assets/aisha.ppn');
  });

  it('forbids non-director from setting sensitivity', () => {
    const ctrl = new WakeConfigController(fakeCfg());
    expect(() => ctrl.setSensitivity({ sensitivity: 0.5 }, { user: { userId: 2 } } as never))
      .toThrow(ForbiddenException);
  });

  it('allows director to set sensitivity', () => {
    const ctrl = new WakeConfigController(fakeCfg());
    const r = ctrl.setSensitivity({ sensitivity: 0.6 }, { user: { userId: 1 } } as never);
    expect(r.sensitivity).toBe(0.6);
  });

  it('rejects out-of-range sensitivity', () => {
    const ctrl = new WakeConfigController(fakeCfg());
    expect(() => ctrl.setSensitivity({ sensitivity: 1.5 }, { user: { userId: 1 } } as never)).toThrow();
  });
});
