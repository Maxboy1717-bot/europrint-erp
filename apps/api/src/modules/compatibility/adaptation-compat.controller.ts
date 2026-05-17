/**
 * @module adaptation-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   adaptation module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { AdaptationCompatService } from './adaptation-compat.service';
import { AdaptationBodyDto } from './dto/hr.dto';
import { unwrapOrInternal } from '@common/http-result';
import {
  NewEmployeeAclTranslator,
  type LegacyNewEmployeeRow,
  type NewEmployeeDto,
} from './acl/new-employee-acl';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
// NOTE: GET /adaptation/programs is served by AdaptationController (adaptation module).
// This compat controller owns write operations (create/update/remove) and other read sub-routes
// on the /adaptation base path. Do not add GET 'programs' here to avoid duplicate route errors.
@Controller('legacy/adaptation')
export class AdaptationCompatController {
  /** PA2-14 ACL translator. Stateless — direct instantiation is fine. */
  private readonly newEmployeeAcl = new NewEmployeeAclTranslator();

  constructor(private readonly svc: AdaptationCompatService) {}

  @Post('programs')
  @HttpCode(HttpStatus.CREATED)
  async createProgram(@Body() body: AdaptationBodyDto) {
    return unwrapOrInternal(await this.svc.createProgram(body));
  }

  @Get('programs/:id')
  async getProgram(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getProgram(id));
  }

  @Put('programs/:id')
  async updateProgram(@Param('id') id: string, @Body() body: AdaptationBodyDto) {
    return unwrapOrInternal(await this.svc.updateProgram(id, body));
  }

  @Delete('programs/:id')
  async deleteProgram(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteProgram(id));
  }

  @Get('new-employees')
  async getNewEmployees(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrInternal(await this.svc.getNewEmployees(limit ?? '50', offset ?? '0'));
  }

  /**
   * PA2-14 ACL-translated variant of new-employees (adaptation records).
   * New BC-3 (HR / People — Adaptation) consumers should target this route;
   * `/new-employees` stays for backwards-compat.
   */
  @Get('new-employees/v2')
  async getNewEmployeesV2(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<NewEmployeeDto[]> {
    const rows = unwrapOrInternal(await this.svc.getNewEmployees(limit ?? '50', offset ?? '0')) as unknown as LegacyNewEmployeeRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.newEmployeeAcl.toDomain(row))
      .filter((r): r is { ok: true; data: NewEmployeeDto } => r.ok)
      .map((r) => r.data);
  }

  @Get('feedback')
  async getFeedback(@Query('employeeId') employeeId?: string) {
    return unwrapOrInternal(await this.svc.getFeedback(employeeId));
  }

  @Post('feedback')
  @HttpCode(HttpStatus.CREATED)
  async createFeedback(@Body() body: AdaptationBodyDto) {
    return unwrapOrInternal(await this.svc.createFeedback(body));
  }

  @Get('feedback/:id')
  async getFeedbackById(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getFeedbackById(id));
  }

  @Put('feedback/:id')
  async updateFeedback(@Param('id') id: string, @Body() body: AdaptationBodyDto) {
    return unwrapOrInternal(await this.svc.updateFeedback(id, body));
  }

  @Get('welcome-events')
  async getWelcomeEvents() {
    return unwrapOrInternal(await this.svc.getWelcomeEvents());
  }

  @Post('welcome-events')
  @HttpCode(HttpStatus.CREATED)
  async createWelcomeEvent(@Body() body: AdaptationBodyDto) {
    return unwrapOrInternal(await this.svc.createWelcomeEvent(body));
  }

  @Get('welcome-events/:id')
  async getWelcomeEventById(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getWelcomeEventById(id));
  }
}
