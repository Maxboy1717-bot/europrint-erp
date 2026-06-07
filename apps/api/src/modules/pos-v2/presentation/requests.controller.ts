/**
 * @module requests.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertValidated, parseSafe } from '@common/assertions';
import { assertOk, unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards, Logger, UseInterceptors , BadRequestException, NotFoundException, InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard} from '@shared/guards/roles.guard';
import { Roles} from '@shared/decorators/roles.decorator';
import { CurrentUser} from '@shared/decorators/current-user.decorator';
import { TransferRequest, RequestStatus} from '../domain/aggregates/transfer-request.aggregate';
import { CreateTransferRequestCommand, TransferLineInput} from '../application/commands/create-transfer-request.command';
import { UpdateTransferStatusCommand} from '../application/commands/update-transfer-status.command';
import { GetRequestsQuery} from '../application/queries/get-requests.query';
import {
 CreateTransferRequestDtoSchema, CreateTransferRequestDto,
 UpdateTransferStatusDtoSchema, UpdateTransferStatusDto,
 GetRequestsDtoSchema,
} from './dto/pos-v2.dto';

interface AuthenticatedUser { id: number; role: string; }

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Requests')
@Controller('pos-v2/transfer-requests')
@UseGuards(RolesGuard)
export class RequestsController {
  private readonly logger = new Logger(RequestsController.name);
 constructor(private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus) {}

 @ApiOperation({ summary: 'Find requests' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get()
 async findRequests(
 @Query() query: Record<string, unknown>,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<{ data: TransferRequest[]; total: number; page: number; limit: number}> {
 const dto = parseSafe(GetRequestsDtoSchema, query, 'Invalid query parameters');
 const res = await this.queryBus.execute(
 new GetRequestsQuery(
 dto.status as RequestStatus,
 dto.fromWarehouseId,
 dto.toWarehouseId,
 dto.page,
 dto.limit,
 ),
 );
 return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Find request by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get(':id')
 async findRequestById(
 @Param('id') requestId: string,
 @CurrentUser() _user: AuthenticatedUser,
 ): Promise<TransferRequest> {
 const result = await this.queryBus.execute(new GetRequestsQuery());
 assertOk(result);
 const request = (Array.isArray(result?.data?.data) ? result?.data?.data : []).find((r: TransferRequest) => r.id === requestId);
 assertFound(request, 'Not found');
 return request;
}

 @ApiOperation({ summary: 'Create request' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post()
  @UsePipes(new ZodValidationPipe(CreateTransferRequestDtoSchema))
 async createRequest(
 @Body() body: CreateTransferRequestDto,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<TransferRequest> {
 const lines: TransferLineInput[] = (Array.isArray(body?.lines) ? body?.lines : []).map((line) => ({
 stockItemId: line.stockItemId,
 itemName: line.itemName,
 sku: line.sku,
 requestedQty: line.requestedQty,
 unit: line.unit,
}));

 const res = await this.commandBus.execute(
 new CreateTransferRequestCommand(
 body.fromWarehouseId,
 body.toWarehouseId,
 body.reason,
 lines,
 String(user.id),
 ),
 );
 return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Update status' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(UpdateTransferStatusDtoSchema))
 @Roles('manager')
 async updateStatus(
 @Param('id') requestId: string,
 @Body() body: UpdateTransferStatusDto,
 @CurrentUser() user: AuthenticatedUser,
 ): Promise<TransferRequest> {
 const newStatus = body.status as RequestStatus;

 assertValidated(Object.values(RequestStatus).includes(newStatus), 'Invalid status');

 const res = await this.commandBus.execute(
 new UpdateTransferStatusCommand(requestId, newStatus, String(user.id)),
 );
 return unwrapOrThrow(res);
}
}
