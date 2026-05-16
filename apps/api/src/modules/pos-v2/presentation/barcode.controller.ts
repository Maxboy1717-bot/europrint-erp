/**
 * @module barcode.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertRequired, assertValidated, parseSafe } from '@common/assertions';
import { unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Body, Controller, Get, Inject, Post, Query, UseGuards, Logger, UseInterceptors , BadRequestException, UsePipes,
InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard} from '@shared/guards/roles.guard';
import { CurrentUser} from '@shared/decorators/current-user.decorator';
import { Result, isErr } from '@common/result';
import { GetBarcodeQuery} from '../application/queries/get-barcode.query';
import { IPosV2Repo, StockItemBarcode, POS_V2_REPO} from '../domain/repositories/i-pos-v2.repo';
import { BarcodeDtoSchema, BarcodeDto } from './dto/pos-v2.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
@Roles('admin', 'manager', 'warehouse', 'operator')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Barcode')
@Controller('pos-v2/barcode')
@UseGuards(RolesGuard)
export class BarcodeController {
  private readonly logger = new Logger(BarcodeController.name);
 constructor(private readonly queryBus: QueryBus) {}

 @ApiOperation({ summary: 'Lookup via query' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('lookup')
 async lookupViaQuery(
 @Query('barcode') barcode: string,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<StockItemBarcode | null> {
 assertRequired(barcode, 'Barcode must be at least 2 characters');
 assertValidated(barcode.length >= 2, 'Barcode must be at least 2 characters');

 const res = await this.queryBus.execute(new GetBarcodeQuery(barcode));
 return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Lookup via body' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post('lookup')
  @UsePipes(new ZodValidationPipe(BarcodeDtoSchema))
 async lookupViaBody(
 @Body() body: BarcodeDto,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<StockItemBarcode | null> {
 const res = await this.queryBus.execute(new GetBarcodeQuery(body.barcode));
 return unwrapOrThrow(res);
}
}
