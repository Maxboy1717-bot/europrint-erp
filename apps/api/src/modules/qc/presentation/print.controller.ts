import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest } from '@common/http-result';
import { z } from 'zod';
import { InkConsumptionService } from '../domain/services/ink-consumption.service';
import { ImpositionService }     from '../domain/services/imposition.service';
import { SpoilageService }       from '../domain/services/spoilage.service';

const InkCoverageDto = z.object({
  c:              z.number().min(0).max(1),
  m:              z.number().min(0).max(1),
  y:              z.number().min(0).max(1),
  k:              z.number().min(0).max(1),
  sheets:         z.number().positive(),
  /** Provide either sheetAreaM2 OR (sheetWidthMm + sheetHeightMm) — not both */
  sheetAreaM2:    z.number().positive().optional(),
  sheetWidthMm:   z.number().positive().optional(),
  sheetHeightMm:  z.number().positive().optional(),
  paperType:      z.enum(['newspaper', 'book', 'premium']).default('book'),
}).refine(
  d => d.sheetAreaM2 !== undefined || (d.sheetWidthMm !== undefined && d.sheetHeightMm !== undefined),
  { message: 'sheetAreaM2 yoki (sheetWidthMm + sheetHeightMm) berilishi kerak' },
);

const ImpositionDto = z.object({
  items: z.array(z.object({
    id:       z.string().min(1),
    width:    z.number().positive(),
    height:   z.number().positive(),
    quantity: z.number().positive().optional(),
  })).min(1),
  sheetWidth:  z.number().positive(),
  sheetHeight: z.number().positive(),
});

const SpoilageDto = z.object({
  defectiveSheets: z.number().min(0),
  totalSheets:     z.number().positive(),
  printType:       z.enum(['4color', '8color']).default('4color'),
  unitCostPaper:   z.number().min(0).default(0),
  unitCostInk:     z.number().min(0).default(0),
  unitCostLabor:   z.number().min(0).default(0),
});

@ApiTags('Print Industry')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('print')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class PrintController {
  constructor(
    private readonly inkSvc:        InkConsumptionService,
    private readonly impositionSvc: ImpositionService,
    private readonly spoilageSvc:   SpoilageService,
  ) {}

  @Post('ink-coverage')
  @RequirePermission('print.production:CALCULATE')
  @ApiOperation({ summary: 'TZ-34: TAC Siyoh Qoplami + Ink Consumption — rate tables, litre output, inventory check' })
  async inkCoverage(@Body() body: unknown) {
    const dto = InkCoverageDto.parse(body);
    const areaOrDims = dto.sheetAreaM2 !== undefined
      ? dto.sheetAreaM2
      : { widthMm: dto.sheetWidthMm ?? 0, heightMm: dto.sheetHeightMm ?? 0 };
    return unwrapOrBadRequest(await this.inkSvc.estimateInkConsumption(
      { c: dto.c, m: dto.m, y: dto.y, k: dto.k },
      dto.sheets,
      areaOrDims,
      dto.paperType,
    ));
  }

  @Post('imposition')
  @RequirePermission('print.production:CALCULATE')
  @ApiOperation({ summary: 'TZ-35: Sheet Imposition / Cutting Stock (FFDH)' })
  async imposition(@Body() body: unknown) {
    const dto = ImpositionDto.parse(body);
    return unwrapOrBadRequest(await this.impositionSvc.pack(
      dto.items,
      dto.sheetWidth,
      dto.sheetHeight,
    ));
  }

  @Get('spoilage/:jobId')
  @RequirePermission('print.spoilage:READ')
  @ApiOperation({ summary: 'TZ-37: Spoilage — ish buyurtmasi bo\'yicha DB dan yuklash' })
  async getSpoilageByJob(@Param('jobId') jobId: string) {
    const data = await this.spoilageSvc.getJobSpoilageData(jobId);
    return unwrapOrBadRequest(await this.spoilageSvc.calculate(
      data.defectiveSheets,
      data.totalSheets,
      data.printType,
      data.unitCostPaper,
      data.unitCostInk,
      data.unitCostLabor,
    ));
  }

  @Post('spoilage')
  @RequirePermission('print.spoilage:CALCULATE')
  @ApiOperation({ summary: 'TZ-37: Spoilage/Waste Rate — custom hisob' })
  async spoilage(@Body() body: unknown) {
    const dto = SpoilageDto.parse(body);
    return unwrapOrBadRequest(await this.spoilageSvc.calculate(
      dto.defectiveSheets,
      dto.totalSheets,
      dto.printType,
      dto.unitCostPaper,
      dto.unitCostInk,
      dto.unitCostLabor,
    ));
  }
}
