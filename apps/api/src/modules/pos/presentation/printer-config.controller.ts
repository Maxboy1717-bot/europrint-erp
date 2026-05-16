/**
 * @module printer-config.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PRINTER_DEFAULT_PORT } from '@common/constants/app.constants';
/**
 * POS — Printer Config Controller
 */
import { Controller, UseGuards, Get, Post, Patch, Body, Param, HttpCode, HttpStatus, ParseIntPipe, Logger, UseInterceptors, NotFoundException , UsePipes,} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { PosCreatePrinterConfigSchema, PosCreatePrinterConfigDto, PosUpdatePrinterConfigSchema, PosUpdatePrinterConfigDto } from '../dto/pos-printer.dto';

import { throwFromError, unwrapOrThrow, assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { LabelService } from '../application/services/label.service';
import { PosPrinterConfigService } from '../application/services/pos-printer-config.service';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('POS — Printer Config')
@ApiBearerAuth()
@Roles('admin', 'manager', 'warehouse')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('pos/printer-config')
export class PrinterConfigController {
  private readonly logger = new Logger(PrinterConfigController.name);
  constructor(
    private readonly labelService: LabelService,
    private readonly svc: PosPrinterConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Printer konfiguratsiyalar ro\'yxati' })
  async getAll() {
    return unwrapOrThrow(await this.svc.getAll());
  }

  @Get('active')
  @ApiOperation({ summary: 'Aktiv printer konfiguratsiyasi' })
  async getActive() {
    const r = await this.labelService.getPrinterConfig();
    const config = r.ok ? r.data : null;
    return config ?? { ip: '', port: PRINTER_DEFAULT_PORT, format: 'ZPL', isConfigured: false };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(PosCreatePrinterConfigSchema))
  @ApiOperation({ summary: 'Yangi printer konfiguratsiya qo\'shish' })
  async create(@Body() body: PosCreatePrinterConfigDto) {
    return unwrapOrThrow(await this.svc.create(body));
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(PosUpdatePrinterConfigSchema))
  @ApiOperation({ summary: 'Printer konfiguratsiyani yangilash' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PosUpdatePrinterConfigDto,
  ) {
    return unwrapOrInternal(await this.svc.update(id, body));
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Printer ulanishini tekshirish' })
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
