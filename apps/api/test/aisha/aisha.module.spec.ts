/**
 * @module aisha.module.spec
 * @description Smoke test: AishaModule compiles inside a NestJS TestingModule.
 * Works whether or not API keys are configured (graceful degradation).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { AishaModule } from '../../src/modules/aisha/aisha.module';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';

const mockI18n = { t: jest.fn().mockResolvedValue('msg'), translate: jest.fn().mockResolvedValue('msg') };

/** Fake global module that makes I18nService and JwtService available everywhere. */
@Global()
@Module({
  providers: [
    { provide: I18nService, useValue: mockI18n },
    { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
  ],
  exports: [I18nService, JwtService],
})
class TestInfraModule {}

describe('AishaModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TestInfraModule,
        AishaModule,
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();
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
