/**
 * @module outbox.module
 * @description Global module exposing the OutboxRepository so any command
 * handler can persist domain events transactionally with its aggregate save.
 * The OutboxPublisher drains the table every 10s via @nestjs/schedule.
 *
 * Imported once in AppModule.
 */

import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxRepository } from './outbox.repository';
import { OutboxPublisher } from './outbox-publisher.service';
import { OutboxEventWriter } from './outbox-event-writer.service';

@Global()
@Module({
  // CqrsModule provides EventBus, which OutboxEventWriter subscribes to in
  // onModuleInit to persist every published domain event into domain_events
  // (golden-thread durability — A14). Mirrors SharedEventsModule's wiring.
  imports: [ScheduleModule.forRoot(), CqrsModule],
  providers: [OutboxRepository, OutboxPublisher, OutboxEventWriter],
  exports: [OutboxRepository],
})
export class OutboxModule {}
