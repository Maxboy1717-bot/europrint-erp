/**
 * @module pos-printer-config-v2.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { PRINTER_DEFAULT_PORT } from '@common/constants/app.constants';
import { Controller, Post, Param, HttpCode, HttpStatus, UseGuards, UseInterceptors, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { throwFromError, assertOk } from '@common/http-result';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PosPrinterConfigService } from '../application/services/pos-printer-config.service';
import { LabelService } from '../application/services/label.service';

@ApiTags('POS — Printer Config v2')
@ApiBearerAuth()
@Roles('admin', 'manager', 'warehouse', 'pos_manager')
@UseGuards(RolesGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('v2/pos/printer-config')
export class PosPrinterConfigV2Controller {
  constructor(
    private readonly svc: PosPrinterConfigService,
    private readonly labelService: LabelService,
    private readonly i18n: I18nService,
  ) {}

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Printer ulanishini tekshirish (v2 alias)' })
  async testConnection(@Param('id', ParseIntPipe) id: number) {
    const _rRow = await this.svc.getForTest(id);
    assertOk(_rRow);
    const row = _rRow.data;
    assertFound(row, await this.i18n.t('errors.printerConfigNotFoundById'));
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
