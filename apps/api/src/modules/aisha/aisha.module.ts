/**
 * @module aisha.module
 * @description Voice-only AI assistant for the Director. Integrates with all
 * 55 business modules via the tool registry. Lives inside the Director
 * Dashboard (not a standalone page). Provides full data provenance for every
 * answer (which tool, which source table, when queried).
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AishaConfig } from './config/aisha.config';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    EventEmitterModule,
    ScheduleModule.forRoot(),
  ],
  providers: [AishaConfig],
  controllers: [],
  exports: [AishaConfig],
})
export class AishaModule {}
