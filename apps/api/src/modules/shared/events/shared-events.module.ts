/**
 * @module shared-events.module
 * @description Global module that wires the CQRS → EventEmitter2 bridge so that
 * cross-mechanism Triggers (e.g. CQRS-published DealWonEvent → @OnEvent listener)
 * actually fire. Imported once in AppModule.
 */

import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBridgeService } from './event-bridge.service';

@Global()
@Module({
  imports: [CqrsModule, EventEmitterModule],
  providers: [EventBridgeService],
  exports: [EventBridgeService],
})
export class SharedEventsModule {}
