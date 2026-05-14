/**
 * Agent EventBus — barcha agentlar shu servis orqali bir-biri bilan muloqot qiladi.
 * NestJS EventEmitter2 atrofida wrapper — agentlar to'g'ridan-to'g'ri chaqirmaydi.
 */
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AgentEvent<T = unknown> {
  source:    string;        // qaysi agent chiqardi (director, lead-scoring, ...)
  eventName: string;        // stock.critical, production.delayed, ...
  payload:   T;
  timestamp: number;
}

@Injectable()
export class AgentEventBusService {
  private readonly logger = new Logger(AgentEventBusService.name);

  constructor(private readonly emitter: EventEmitter2) {}

  /** Agent voqea chiqaradi */
  emit<T>(eventName: string, payload: T, source: string = 'unknown'): void {
    const event: AgentEvent<T> = { source, eventName, payload, timestamp: Date.now() };
    this.emitter.emit(eventName, event);
    this.logger.debug(`[${source}] -> ${eventName}`);
  }

  /** Asynk emit (background queue uchun) */
  async emitAsync<T>(eventName: string, payload: T, source: string = 'unknown'): Promise<unknown[]> {
    const event: AgentEvent<T> = { source, eventName, payload, timestamp: Date.now() };
    return this.emitter.emitAsync(eventName, event);
  }
}
