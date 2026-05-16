/**
 * @module aisha.module.spec
 * @description Smoke test: AishaModule compiles inside a NestJS TestingModule.
 * Works whether or not API keys are configured (graceful degradation).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AishaModule } from '../../src/modules/aisha/aisha.module';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';

describe('AishaModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AishaModule],
    }).compile();
  });

  afterAll(async () => {
    await module?.close();
  });

  it('compiles', () => {
    expect(module).toBeDefined();
  });

  it('provides AishaConfig', () => {
    const cfg = module.get(AishaConfig);
    expect(cfg).toBeInstanceOf(AishaConfig);
  });
});
