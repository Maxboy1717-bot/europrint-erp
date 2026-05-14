/**
 * @module inventory-count.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, parseSafe } from '@common/assertions';
import { assertOk, unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  NotFoundException,
  UseGuards, Logger, UseInterceptors , BadRequestException, UsePipes,
InternalServerErrorException } from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard} from '@shared/guards/roles.guard';
import { Roles} from '@shared/decorators/roles.decorator';
import { CurrentUser} from '@shared/decorators/current-user.decorator';
import { InventoryCount, CountStatus} from '../domain/aggregates/inventory-count.aggregate';
import { StartInventoryCountCommand} from '../application/commands/start-inventory-count.command';
import { UpdateCountLineCommand} from '../application/commands/update-count-line.command';
import { CompleteCountCommand} from '../application/commands/complete-count.command';
import { ApproveCountCommand} from '../application/commands/approve-count.command';
import { GetCountsQuery} from '../application/queries/get-counts.query';
import { AuthenticatedUser } from '@common/types/user.types';
import {
 StartCountDtoSchema,
 UpdateCountLineDtoSchema, UpdateCountLineDto,
 ApproveCountDtoSchema, ApproveCountDto,
 GetCountsDtoSchema,
} from './dto/pos-v2.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos-v2/inventory-counts')
@UseGuards(RolesGuard)
export class InventoryCountController {
  private readonly logger = new Logger(InventoryCountController.name);
 constructor(private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus) {}

 @Post()
 @HttpCode(HttpStatus.CREATED)
 async createCount(
 @Query() query: Record<string, unknown>,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<{ data: InventoryCount[]; total: number; page: number; limit: number}> {
 const dto = parseSafe(GetCountsDtoSchema, query, 'Invalid request body');
 const dtoAny = dto as Record<string, unknown>;
 const res = await this.commandBus.execute(
 new StartInventoryCountCommand(dto.warehouseId ?? '', String(user.id), dtoAny['notes'] as string | undefined),
 );
 return unwrapOrThrow(res);
}

 @Get()
 async findCounts(
 @Query() query: Record<string, unknown>,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<{ data: InventoryCount[]; total: number; page: number; limit: number}> {
 const dto = parseSafe(GetCountsDtoSchema, query, 'Invalid request body');
 const dtoAny = dto as Record<string, unknown>;
 const res = await this.commandBus.execute(
 new StartInventoryCountCommand(dto.warehouseId ?? '', String(user.id), dtoAny['notes'] as string | undefined),
 );
 return unwrapOrThrow(res);
}

 @Get(':id')
 async findCountById(
 @Param('id') countId: string,
 ): Promise<InventoryCount> {
 const result = await this.queryBus.execute(new GetCountsQuery());
 assertOk(result);
 const count = (Array.isArray(result?.data?.data) ? result?.data?.data : []).find((c: InventoryCount) => c.id === countId);
 assertFound(count, 'Inventarizatsiya topilmadi');
 return count;
}

 @Patch(':id/lines/:lineId')
  @UsePipes(new ZodValidationPipe(UpdateCountLineDtoSchema))
 async updateCountLine(
 @Param('id') countId: string,
 @Param('lineId') lineId: string,
 @Body() body: UpdateCountLineDto,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<Record<string, unknown>> {
 const res = await this.commandBus.execute(
 new UpdateCountLineCommand(countId, lineId, body.countedQuantity, body.notes),
 );
 return unwrapOrThrow(res);
}

 @Patch(':id/complete')
 @Roles('WAREHOUSE_MANAGER')
 async completeCount(
 @Param('id') countId: string,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<InventoryCount> {
 const res = await this.commandBus.execute(new CompleteCountCommand(countId));
 return unwrapOrThrow(res);
}

 @Patch(':id/approve')
  @UsePipes(new ZodValidationPipe(ApproveCountDtoSchema))
 @Roles('WAREHOUSE_MANAGER', 'SUPER_ADMIN')
 async approveCount(
 @Param('id') countId: string,
 @Body() body: ApproveCountDto,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<InventoryCount> {
 const syncStock = body.syncStock !== false;
 const res = await this.commandBus.execute(new ApproveCountCommand(countId, String(user.id), syncStock));
 return unwrapOrThrow(res);
}
}
