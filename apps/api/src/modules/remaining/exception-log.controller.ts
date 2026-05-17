/**
 * @module exception-log.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { ExceptionLogService } from './exception-log.service';
import { ExceptionLogCreateDto, ExceptionReasonDto, StatusChangeDto } from '../compatibility/dto/exception.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import {
  ExceptionLogAclTranslator,
  type LegacyExceptionLogRow,
  type ExceptionLogDto,
} from './acl/exception-log-acl';

const ExceptionLogUpdateSchema = z.object({
  status: z.string().max(50).optional(),
  reason: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

@Roles('admin', 'director', 'manager')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('exceptions')
export class ExceptionLogController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly exceptionAcl = new ExceptionLogAclTranslator();

  constructor(private readonly svc: ExceptionLogService) {}

  @Get()
  async getAll(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getAll(q));
  }

  /**
   * PA2-14 ACL-translated variant. New BC-2 / BC-6 / BC-7 exception-console
   * consumers should target `/v2`; the legacy `/` endpoint stays for
   * backwards-compat.
   *
   * The legacy service wraps rows in `{ data, total, limit, offset }`; this
   * endpoint preserves the envelope while translating only the data array.
   */
  @Get('v2')
  async getAllV2(@Query() q: Record<string, string>): Promise<{
    data: ExceptionLogDto[]; total: number; limit: number; offset: number;
  }> {
    const wrapped = unwrapOrInternal(await this.svc.getAll(q)) as unknown as {
      data: LegacyExceptionLogRow[]; total: number; limit: number; offset: number;
    };
    const list = Array.isArray(wrapped?.data) ? wrapped.data : [];
    const data = list
      .map((row) => this.exceptionAcl.toDomain(row))
      .filter((r): r is { ok: true; data: ExceptionLogDto } => r.ok)
      .map((r) => r.data);
    return {
      data,
      total: wrapped?.total ?? data.length,
      limit: wrapped?.limit ?? data.length,
      offset: wrapped?.offset ?? 0,
    };
  }

  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getOne(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: ExceptionLogCreateDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.create(body, user.id));
  }

  @Post('advance-bypass')
  @HttpCode(HttpStatus.CREATED)
  async advanceBypass(@Body() body: ExceptionReasonDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.advanceBypass(body, user.id));
  }

  @Post('status-force')
  @HttpCode(HttpStatus.CREATED)
  async statusForce(@Body() body: StatusChangeDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.statusForce(body, user.id));
  }

  @Post('design-reject')
  @HttpCode(HttpStatus.CREATED)
  async designReject(@Body() body: ExceptionReasonDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.designReject(body, user.id));
  }

  @Post('advance-block')
  @HttpCode(HttpStatus.CREATED)
  async advanceBlock(@Body() body: ExceptionReasonDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.advanceBlock(body, user.id));
  }

  @Post('material-shortage')
  @HttpCode(HttpStatus.CREATED)
  async materialShortage(@Body() body: ExceptionLogCreateDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.materialShortage(body, user.id));
  }

  @Post('machine-breakdown')
  @HttpCode(HttpStatus.CREATED)
  async machineBreakdown(@Body() body: ExceptionLogCreateDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.machineBreakdown(body, user.id));
  }

  @Post('qc-failed')
  @HttpCode(HttpStatus.CREATED)
  async qcFailed(@Body() body: ExceptionLogCreateDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.qcFailed(body, user.id));
  }

  @Post('delivery-failed')
  @HttpCode(HttpStatus.CREATED)
  async deliveryFailed(@Body() body: ExceptionLogCreateDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.deliveryFailed(body, user.id));
  }

  @Post('employee-absent')
  @HttpCode(HttpStatus.CREATED)
  async employeeAbsent(@Body() body: ExceptionLogCreateDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.employeeAbsent(body, user.id));
  }

  @Post('material-not-returned')
  @HttpCode(HttpStatus.CREATED)
  async materialNotReturned(@Body() body: ExceptionLogCreateDto, @CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.materialNotReturned(body, user.id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() _user: { id: number; role: string },
  ) {
    const dto = ExceptionLogUpdateSchema.parse(body);
    return unwrapOrInternal(await this.svc.update(id, dto as Record<string, unknown>));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteOne(id));
  }

  @Post('cert-expiry-check')
  async certExpiryCheck() {
    return unwrapOrInternal(await this.svc.certExpiryCheck());
  }
}
