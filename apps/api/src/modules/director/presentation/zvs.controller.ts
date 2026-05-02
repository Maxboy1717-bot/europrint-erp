import { Body, Controller, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ZvsService } from '../application/zvs.service';
import {
  ZvsCreateSchema, ZvsCreateDto,
  ZvsCommentSchema, ZvsCommentDto,
} from './dto/director.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('hr/zvs')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo', 'finance_manager')
export class ZvsController {
  private readonly logger = new Logger(ZvsController.name);

  constructor(private readonly svc: ZvsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ZvsCreateSchema))
  async createZvs(
    @Body() body: ZvsCreateDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.createZvsWithValidation(body, user.id));
  }

  @Get()
  async listZvs(
    @Query('status') status?: string,
    @Query('week_date') weekDate?: string,
    @Query('department_id') departmentId?: string,
  ) {
    return unwrapOrInternal(await this.svc.listZvs(status ?? null, weekDate ?? null, departmentId ? parseInt(departmentId, 10) : null));
  }

  @Patch(':id/approve')
  @UsePipes(new ZodValidationPipe(ZvsCommentSchema))
  async approve(
    @Param('id') id: string,
    @Body() body: ZvsCommentDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.approveZvsWithAuth(parseInt(id, 10), user.id, user.role, (body.comment as string) ?? null));
  }

  @Patch(':id/reject')
  @UsePipes(new ZodValidationPipe(ZvsCommentSchema))
  async reject(
    @Param('id') id: string,
    @Body() body: ZvsCommentDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.rejectZvsWithAuth(parseInt(id, 10), user.id, user.role, (body.comment as string) ?? null));
  }
}
