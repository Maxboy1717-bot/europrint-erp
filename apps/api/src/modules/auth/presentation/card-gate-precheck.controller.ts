/**
 * @module card-gate-precheck.controller
 * @description EP-ORG-003 / A29 — read-only PRE-CHECK for the card login-gate.
 *
 *   The card login-gate (`CARD_LOGIN_GATE_ENABLED`, enforced in
 *   `login.service.ts`, default OFF) blocks any active user that has NO active
 *   position-card (`users.card_id` NULL AND no live `employee_cards` row) —
 *   EXCEPT the system roles super_admin / admin / director, which always pass.
 *
 *   Flipping that flag ON is an OWNER decision (Q8 vision-lock). Before the
 *   owner flips it, they MUST know the blast radius: how many currently-active
 *   users would be locked out the moment the gate turns ON. This endpoint
 *   surfaces exactly that — a 401-surge guard / safe-activation pre-check.
 *
 *   This controller is intentionally SEPARATE from auth.controller.ts and
 *   login.service.ts (A4 done — those must not change). It only READS; it never
 *   mutates a user, a card, or the flag. Admin-gated.
 *
 *   NOTE: login.service.ts is NOT modified by A29 — the gate enforcement was
 *   already built (A4). A29 adds only the safe-activation pre-check below.
 */

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { CardGatePrecheckService } from '../application/services/card-gate-precheck.service';

/**
 * Diagnostic surface for the card login-gate. Mounted under `/auth/card-gate`
 * so it sits next to the auth domain (same throttle/audit decorators) yet stays
 * in its own controller class (file isolation — Q-31).
 *
 * Admin-only: the result reveals how many users would lose access, so it is
 * gated to the system roles that can actually flip `CARD_LOGIN_GATE_ENABLED`.
 */
@Roles('admin', 'super_admin', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth/card-gate')
export class CardGatePrecheckController {
  private readonly logger = new Logger(CardGatePrecheckController.name);

  constructor(
    private readonly precheck: CardGatePrecheckService,
    private readonly config: ConfigService,
  ) {}

  /**
   * GET /auth/card-gate/precheck
   *
   * Returns the blast radius of turning the card login-gate ON, computed
   * against LIVE data with the exact same rule `login.service.ts` enforces:
   *   blocked = active user, role NOT in {super_admin, admin, director},
   *             AND no active card (card_id NULL AND 0 live employee_cards).
   *
   * `gateEnabled` echoes the current flag so the caller can tell whether the
   * gate is already live or still pending an owner decision.
   */
  @Get('precheck')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Karta login-gate pre-check (yoqishdan oldin nechta aktiv user kartasiz qoladi)',
    description:
      'Read-only. CARD_LOGIN_GATE_ENABLED ni YOQISHdan oldin egasi ko\'radi: ' +
      'gate YOQILSA nechta aktiv user 401 oladi (kartasiz). ' +
      'super_admin/admin/director har doim ichkarida (bypass). Hech narsa o\'zgartirmaydi.',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin/super_admin/director only' })
  async precheckGate() {
    this.logger.log('Card login-gate pre-check requested');
    const summary = unwrapOrThrow(await this.precheck.summarize());
    const gateEnabled = this.config.get<string>('CARD_LOGIN_GATE_ENABLED') === 'true';
    return { gateEnabled, ...summary };
  }
}
