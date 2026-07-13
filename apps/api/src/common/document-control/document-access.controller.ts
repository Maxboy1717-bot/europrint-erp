/**
 * @module document-access.controller
 * @description Document Control STEP 3.3 — FE-observable access events (view of an
 * in-app-rendered document, and Ctrl+C copy — decision #6/#7). The FE calls this after a
 * document renders / on copy. Backend-observable actions (print, export) are logged at their
 * own gated server flows, NOT here, so this endpoint whitelists action to view|copy only.
 *
 * The sensitivity_tier is resolved SERVER-SIDE (never trusted from the client). Global
 * JwtAuthGuard protects it (authenticated users only).
 */

import { Body, Controller, Post, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { DocumentAccessLogService } from './document-access-log.service';

const LogAccessSchema = z.object({
  documentType: z.string().trim().min(1).max(60),
  documentId: z.union([z.string().min(1), z.number()]),
  action: z.enum(['view', 'copy']), // print/export are logged by their own gated flows
});
type LogAccessDto = z.infer<typeof LogAccessSchema>;

interface ReqUser { id?: number; sub?: number; full_name?: string; fullName?: string; role?: string }

@ApiTags('Document Access')
@Controller('document-access')
export class DocumentAccessController {
  constructor(private readonly accessLog: DocumentAccessLogService) {}

  @ApiOperation({ summary: 'Log a FE-observable document access event (view|copy)' })
  @Post('log')
  @HttpCode(HttpStatus.NO_CONTENT)
  async log(
    @Body(new ZodValidationPipe(LogAccessSchema)) body: LogAccessDto,
    @Req() req: { ip?: string; headers?: Record<string, unknown>; user?: ReqUser },
  ): Promise<void> {
    await this.accessLog.logFromReq(req, {
      documentType: body.documentType,
      documentId: body.documentId,
      action: body.action,
    });
  }
}
