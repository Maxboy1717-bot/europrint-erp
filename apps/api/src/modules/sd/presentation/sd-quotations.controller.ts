import {
  AuditInterceptor } from '@common/interceptors/audit.interceptor';import { safeInt } from '../../hr/common/db-rows';import {
Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  SdCreateQuotationSchema, SdCreateQuotationDto,
  SdCreateContractSchema, SdCreateContractDto,
  SdCalculatePriceSchema, SdCalculatePriceDto,
} from './dto/sd-quotations.dto';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SdQuotationsService } from '../application/sd-quotations.service';

const SD_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Roles(...SD_ROLES)
@Controller('sd')
export class SdQuotationsController {
  private readonly logger = new Logger(SdQuotationsController.name);

  constructor(private readonly svc: SdQuotationsService) {}

  @Get('quotations')
  async listQuotations(
    @Query('customerId') customerId?: string, @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rListQuotations = await this.svc.listQuotations(
      customerId ? safeInt(customerId, 0) : null,
      status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListQuotations);
    return _rListQuotations.data;
  }

  @Post('quotations')
  @UsePipes(new ZodValidationPipe(SdCreateQuotationSchema))
  async createQuotation(@Body() body: SdCreateQuotationDto) {
    return unwrapOrThrow(await this.svc.createQuotation(body));
  }

  @Get('contracts')
  async listContracts(
    @Query('customerId') customerId?: string, @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rListContracts = await this.svc.listContracts(
      customerId ? safeInt(customerId, 0) : null,
      status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListContracts);
    return _rListContracts.data;
  }

  @Post('contracts')
  @UsePipes(new ZodValidationPipe(SdCreateContractSchema))
  async createContract(@Body() body: SdCreateContractDto) {
    return unwrapOrThrow(await this.svc.createContract(body));
  }

  @Get('price-formulas')
  async listPriceFormulas(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listPriceFormulas(safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Post('calculate-price')
  @UsePipes(new ZodValidationPipe(SdCalculatePriceSchema))
  async calculatePrice(@Body() body: SdCalculatePriceDto) {
    const _rCalculatePrice = await this.svc.calculatePrice(
      safeInt(body.product_id, 0),
      safeInt(body.quantity, 1),
      body.formula_id ? safeInt(body.formula_id, 0) : null,
    );
    assertOk(_rCalculatePrice);
    return _rCalculatePrice.data;
  }

  @Get('kpi/team')
  async getKpiTeam(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getKpiTeam(period ?? null));
  }

  @Get('kpi-targets')
  async getKpiTargets(@Query('managerId') managerId?: string) {
    return unwrapOrThrow(await this.svc.getKpiTargets(managerId ? safeInt(managerId, 0) : null));
  }

  @Get('reports/funnel')
  async getFunnelReport(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getFunnelReport(period ?? null));
  }

  @Post('quotations/:id/convert-to-order')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  async convertToOrder(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.convertToOrder(id));
  }

  @Post('quotations/:id/convert')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  async convertQuotation(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.convertToOrder(id));
  }

  @Post('quotations/:id/send')
  async sendQuotation(@Param('id') id: string) { return { id, sent: true }; }

  @Patch('quotations/:id/approve')
  async approveQuotation(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, approved: true }; }

  @Patch('quotations/:id')
  async updateQuotation(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Patch('contracts/:id/sign')
  async signContract(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, signed: true }; }

  @Patch('kpi-targets/:id')
  async updateKpiTarget(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Patch('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, cancelled: true }; }

  @Patch('payments/:id/mark-paid')
  async markPaymentPaid(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, paid: true }; }
}
