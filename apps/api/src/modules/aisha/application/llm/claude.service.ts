/**
 * @module claude.service
 * @description LEGACY shim. The real implementation now lives in
 *   `infrastructure/external/claude.adapter.ts` (`ClaudeAdapter`, which
 *   implements `IClaudePort`). This file is kept so any direct
 *   `ClaudeService` imports continue to compile while consumers migrate to
 *   `@Inject(CLAUDE_PORT) IClaudePort`.
 *
 *   New code MUST inject the port:
 *     constructor(@Inject(CLAUDE_PORT) private readonly claude: IClaudePort) {}
 *
 *   Type re-exports preserve the previous public surface (`StreamEvent`,
 *   `ClaudeMessage`, `ClaudeStreamOpts`) so existing callers don't break.
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { ClaudeAdapter } from '../../infrastructure/external/claude.adapter';
import type {
  ClaudeStreamEvent,
  ClaudeRequest,
  ClaudeMessage as PortClaudeMessage,
} from '../../domain/ports/i-claude-port';

/** @deprecated use `ClaudeStreamEvent` from the port. */
export type StreamEvent = ClaudeStreamEvent;

/** @deprecated use `ClaudeMessage` from the port. */
export type ClaudeMessage = PortClaudeMessage;

/** @deprecated use `ClaudeRequest` from the port. */
export type ClaudeStreamOpts = ClaudeRequest;

interface SdkLike {
  messages: {
    stream(params: Record<string, unknown>): AsyncIterable<Record<string, unknown>>;
  };
}

/**
 * @deprecated New code should `@Inject(CLAUDE_PORT)` and depend on
 *   `IClaudePort`. This class is a thin delegating shim around `ClaudeAdapter`
 *   to keep older imports working. It preserves the original method
 *   signatures (`streamWithTools`, `sendOneShot`, `setSdkForTesting`) so
 *   AIsha tools and the chat controller don't break.
 */
@Injectable()
export class ClaudeService {
  constructor(private readonly adapter: ClaudeAdapter) {}

  setSdkForTesting(sdk: SdkLike): void {
    this.adapter.setSdkForTesting(sdk);
  }

  streamWithTools(opts: ClaudeStreamOpts): AsyncIterable<StreamEvent> {
    return this.adapter.streamWithTools(opts);
  }

  sendOneShot(opts: ClaudeStreamOpts): Promise<Result<string>> {
    return this.adapter.sendOneShot(opts);
  }
}
