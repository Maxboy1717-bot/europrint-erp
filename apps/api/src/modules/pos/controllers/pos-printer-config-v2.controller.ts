/**
 * @module pos-printer-config-v2.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { PRINTER_DEFAULT_PORT } from '@common/constants/app.constants';
import { Controller, Post, Param, HttpCode, HttpStatus, UseGuards, UseInterceptors, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { throwFromError, assertOk } from '@common/http-result';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PosPrinterConfigService } from '../services/pos-printer-config.service';
import { LabelService } from '../services/label.service';

@ApiTags('POS — Printer Config v2')
@ApiBearerAuth()
@Roles('admin', 'manager', 'warehouse', 'cashier', 'pos_manager')
@UseGuards(RolesGuard)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('v2/pos/printer-config')
export class PosPrinterConfigV2Controller {
  constructor(
    private readonly svc: PosPrinterConfigService,
    private readonly labelService: LabelService,
  ) {}

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Printer ulanishini tekshirish (v2 alias)' })
  async testConnection(@Param('id', ParseIntPipe) id: number) {
    const _rRow = await this.svc.getForTest(id);
    assertOk(_rRow);
    const row = _rRow.data;
    assertFound(row, 'Config topilmadi');
    const port = (row.printer_port as number) ?? PRINTER_DEFAULT_PORT;
    const ip = row.printer_ip as string;
    const connected = await this.labelService.sendToPrinter('', ip, port);
    return {
      success: connected,
      ip,
      port,
      format: row.print_format,
      message: connected
        ? `Printer ${ip}:${port} — ulanish muvaffaqiyatli`
        : `Printer ${ip}:${port} — ulanmadi`,
    };
  }
}
