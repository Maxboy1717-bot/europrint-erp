/**
 * @module forecast-ext.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Post, Param, Body, UseGuards, UseInterceptors, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest } from '@common/http-result';
import { z } from 'zod';
import { ForecastService }                       from '../forecast/forecast.service';
import { HoltWintersService }                    from '../forecast/holt-winters.service';
import { CrostonService }                        from '../forecast/croston.service';
import { EnsembleForecastService, EnsembleResult } from '../forecast/ensemble-forecast.service';
import type { CrostonResult }                    from '../forecast/croston.service';
import { ForecastPersistenceService }            from '../forecast/forecast-persistence.service';

const EmaBodyDto = z.object({
  series:  z.array(z.number()).min(2),
  horizon: z.number().int().positive().max(104),
});

const HwBodyDto = z.object({
  series:       z.array(z.number()).min(4),
  horizon:      z.number().int().positive().max(104),
  seasonLength: z.number().int().positive().max(52).default(12),
});

const CrostonBodyDto = z.object({
  series:  z.array(z.number()).min(4),
  horizon: z.number().int().positive().max(104),
  alpha:   z.number().min(0.01).max(0.99).optional(),
  beta:    z.number().min(0.01).max(0.99).optional(),
});

const EnsembleBodyDto = z.object({
  series:       z.array(z.number()).min(2),
  horizon:      z.number().int().positive().max(104),
  seasonLength: z.number().int().positive().max(52).optional(),
});

/** Week-based period: today + i*7 days */
function weekPeriod(i: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + i * 7);
  return d;
}

@ApiTags('Forecast Extended')
@ApiBearerAuth()
@Throttle({ ai: { limit: 20, ttl: 60_000 } })
@Controller('forecast')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class ForecastExtController {
  constructor(
    private readonly forecastSvc:   ForecastService,
    private readonly hwSvc:         HoltWintersService,
    private readonly crostonSvc:    CrostonService,
    private readonly ensembleSvc:   EnsembleForecastService,
    private readonly persistenceSvc: ForecastPersistenceService,
  ) {}

  @Post(':id/ema')
  @RequirePermission('forecast.ext:READ')
  @ApiOperation({ summary: 'EMA (Exponential Moving Average) Forecast' })
  async ema(@Param('id') id: string, @Body() body: unknown) {
    const dto = EmaBodyDto.parse(body);
    const result = await this.forecastSvc.forecastEma(dto.series, dto.horizon);
    return { materialId: id, model: 'ema', ...unwrapOrBadRequest(result) };
  }

  @Post(':id/hw')
  @RequirePermission('forecast.ext:READ')
  @ApiOperation({ summary: 'Holt-Winters Triple Exponential Smoothing Forecast' })
  async hw(@Param('id') id: string, @Body() body: unknown) {
    const dto = HwBodyDto.parse(body);
    const result = await this.hwSvc.autoForecast(dto.series, dto.horizon, dto.seasonLength);
    return { materialId: id, model: 'hw', ...unwrapOrBadRequest(result) };
  }

  @Post(':id/croston')
  @RequirePermission('forecast.ext:READ')
  @ApiOperation({ summary: 'TZ-30: Croston/TSB sporadic demand forecast' })
  async croston(@Param('id') id: string, @Body() body: unknown) {
    const dto = CrostonBodyDto.parse(body);
    const result = await this.crostonSvc.forecast(dto.series, dto.horizon, dto.alpha, dto.beta);
    const data: CrostonResult = unwrapOrBadRequest(result);

    // Persist predicted periods to forecast_series — awaited so failures propagate
    const saveR = await this.persistenceSvc.saveForecast(
      (Array.isArray(data?.predicted) ? data?.predicted : []).map((qty, i) => ({
        materialId: id,
        period:     weekPeriod(i + 1),
        forecastQty: qty,
        method:     'CROSTON' as const,
        alpha:      data.params.alpha,
        metrics:    { mape: data.mape, rmse: data.rmse, mae: 0 },
      })),
    );
    if (!saveR.ok) {
      throw new InternalServerErrorException(`forecast_series yozishda xato: ${saveR.error.message}`);
    }

    return { materialId: id, model: 'croston', ...data };
  }

  @Post(':id/ensemble')
  @RequirePermission('forecast.ext:READ')
  @ApiOperation({ summary: 'TZ-31: MAPE-weighted Ensemble Forecast (EMA+HW+Croston)' })
  async ensemble(@Param('id') id: string, @Body() body: unknown) {
    const dto = EnsembleBodyDto.parse(body);
    const result = await this.ensembleSvc.ensemble(dto.series, dto.horizon, dto.seasonLength);
    const data: EnsembleResult = unwrapOrBadRequest(result);

    // Compute MAPE-weighted ensemble MAPE for persistence (modelMapes weighted by modelWeights)
    const { modelWeights: w, modelMapes: m } = data;
    const totalW = w.ema + w.hw + w.croston;
    const ensembleMape = totalW > 0
      ? (w.ema * m.ema + w.hw * m.hw + w.croston * m.croston) / totalW
      : (m.ema + m.hw + m.croston) / 3;

    // Persist predicted periods to forecast_series — awaited so failures propagate
    const saveR = await this.persistenceSvc.saveForecast(
      (Array.isArray(data?.predicted) ? data?.predicted : []).map((qty, i) => ({
        materialId: id,
        period:     weekPeriod(i + 1),
        forecastQty: qty,
        method:     'ENSEMBLE' as const,
        metrics:    { mape: ensembleMape, rmse: 0, mae: 0 },
      })),
    );
    if (!saveR.ok) {
      throw new InternalServerErrorException(`forecast_series yozishda xato: ${saveR.error.message}`);
    }

    return { materialId: id, model: 'ensemble', ...data };
  }
}
