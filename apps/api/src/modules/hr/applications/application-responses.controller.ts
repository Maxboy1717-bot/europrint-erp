/**
 * @module application-responses.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../common/db-rows';
import { ApplicationsService } from './applications.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { ApplicationResponseCreateSchema, ApplicationResponseCreateDto } from './dto/applications.dto';

const UpdateApplicationResponseSchema = z.object({
  status: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
}).passthrough();

const HR_ROLES = ['hr_manager', 'hr_specialist', 'director', 'super_admin'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Roles(...HR_ROLES)
@ApiTags('Application Responses')
@Controller('application-responses')
export class ApplicationResponsesController {
  private readonly logger = new Logger(ApplicationResponsesController.name);

  constructor(private readonly svc: ApplicationsService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('applicationId') applicationId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const _rListResponses = await this.svc.listResponses(
      applicationId ? safeInt(applicationId, 0) : null,
      safeInt(limit, 50),
      safeInt(offset, 0),
    );
    assertOk(_rListResponses);
    return _rListResponses.data;
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const _rGetById = await this.svc.getResponseById(safeInt(id, 0));
    assertOk(_rGetById);
    assertFound(_rGetById.data, 'Application response not found');
    return _rGetById.data;
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UsePipes(new ZodValidationPipe(ApplicationResponseCreateSchema))
  async create(@Body() body: ApplicationResponseCreateDto) {
    return unwrapOrThrow(await this.svc.createResponse(body));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateApplicationResponseSchema.parse(body);
    return { id, ...dto, updated: true };
  }
}
