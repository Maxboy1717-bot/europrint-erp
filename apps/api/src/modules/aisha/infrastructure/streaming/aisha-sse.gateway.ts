/**
 * @module aisha-sse.gateway
 * @description Server-Sent Events endpoint that streams text deltas + tool
 * results to the AishaPanel as they happen. Uses Fastify's raw reply because
 * Nest's interceptors otherwise buffer the response.
 */

import { Controller, Sse, Param, UseGuards, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import type { StreamEvent } from '../../application/llm/claude.service';

@Controller('api/aisha/stream')
@UseGuards(JwtAuthGuard)
export class AishaSseGateway {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  push(conversationId: string, event: StreamEvent): void {
    const subj = this.streams.get(conversationId);
    if (!subj) return;
    subj.next({ data: event, type: event.kind });
    if (event.kind === 'done' || event.kind === 'error') {
      subj.complete();
      this.streams.delete(conversationId);
    }
  }

  @Sse(':conversationId')
  stream(@Param('conversationId') conversationId: string): Observable<MessageEvent> {
    const subj = new Subject<MessageEvent>();
    this.streams.set(conversationId, subj);
    return subj.asObservable();
  }

  activeStreams(): number {
    return this.streams.size;
  }
}
