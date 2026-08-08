/**
 * @module workflow-rules.controller
 * @description Horizontal cross-department workflow routing config (Vysotskiy-7
 *   GORIZONTAL). CRUD over workflow_rules + resolve() to fetch the ordered
 *   approval chain for a (request_type, source_department). Transport-only.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal, unwrapOrNotFoundDefined } from '@common/http-result';
import { WorkflowRulesService } from '../application/workflow-rules.service';

const boolParam = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((v) => v === true || v === 'true');

const ListQuerySchema = z.object({
  request_type: z.string().min(1).max(50).optional(),
  source_department_id: z.coerce.number().int().positive().optional(),
  is_active: boolParam.optional(),
});

const ResolveQuerySchema = z.object({
  request_type: z.string().min(1).max(50),
  source_department_id: z.coerce.number().int().positive(),
});

const RuleBodySchema = z.object({
  request_type: z.string().min(1).max(50),
  name: z.string().max(200).nullish(),
  source_department_id: z.number().int().positive().nullish(),
  source_function_id: z.number().int().positive().nullish(),
  step_order: z.number().int().positive().max(50).optional(),
  approver_department_id: z.number().int().positive().nullish(),
  approver_function_id: z.number().int().positive().nullish(),
  is_active: z.boolean().optional(),
});

const RuleUpdateSchema = RuleBodySchema.partial();

const WRITE_ROLES = ['director', 'super_admin'];
const READ_ROLES = ['manager', 'director', 'super_admin'];

@ApiTags('Director — Workflow Rules')
@ApiBearerAuth()
@ApiThrottle()
@Controller('coordination/workflow-rules')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...READ_ROLES)
export class WorkflowRulesController {
  constructor(private readonly svc: WorkflowRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List workflow rules (chains/steps), optional filters' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Query() q: unknown) {
    const dto = ListQuerySchema.parse(q);
    return {
      data: unwrapOrInternal(
        await this.svc.list({
          request_type: dto.request_type ?? null,
          source_department_id: dto.source_department_id ?? null,
          is_active: dto.is_active ?? null,
        }),
      ),
    };
  }

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve the ordered active approval chain for a request' })
  @ApiResponse({ status: 200, description: 'OK' })
  async resolve(@Query() q: unknown) {
    const dto = ResolveQuerySchema.parse(q);
    return { data: unwrapOrInternal(await this.svc.resolve(dto.request_type, dto.source_department_id)) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one rule' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getById(@Param('id') id: string) {
    return unwrapOrNotFoundDefined(await this.svc.getById(parseInt(id, 10)), 'Qoida topilmadi');
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create a rule (one step in a chain)' })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(@Body() body: unknown) {
    const dto = RuleBodySchema.parse(body);
    return unwrapOrInternal(await this.svc.create(dto));
  }

  @Put(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a rule' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = RuleUpdateSchema.parse(body);
    return unwrapOrNotFoundDefined(await this.svc.update(parseInt(id, 10), dto), 'Qoida topilmadi');
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate a rule (soft delete)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id') id: string) {
    return unwrapOrNotFoundDefined(await this.svc.remove(parseInt(id, 10)), 'Qoida topilmadi');
  }
}
