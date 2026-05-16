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
import { OutboxRepository } from './outbox.repository';
import { OutboxPublisher } from './outbox-publisher.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [OutboxRepository, OutboxPublisher],
  exports: [OutboxRepository],
})
export class OutboxModule {}
