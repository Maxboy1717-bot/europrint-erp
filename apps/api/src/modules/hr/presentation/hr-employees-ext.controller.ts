import {
  Body, Controller, Delete, Get, Param, Post, Query,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HrEmployeesExtService } from '../application/hr-employees-ext.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  HrUpdateProfileImageSchema, HrUpdateProfileImageDto,
  HrAssignOrgFunctionsSchema, HrAssignOrgFunctionsDto,
  HrImportEmployeesSchema, HrImportEmployeesDto,
  HrAssignAssetSchema, HrAssignAssetDto,
  HrCreateComplaintSchema, HrCreateComplaintDto,
} from './dto/hr.dto';

interface AuthenticatedUser { id: number; role: string; }

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('hr/employees')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrEmployeesExtController {
  constructor(private readonly svc: HrEmployeesExtService) {}

  @Post(':id/profile-image')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'EMPLOYEE')
  @UsePipes(new ZodValidationPipe(HrUpdateProfileImageSchema))
  async updateProfileImage(
    @Param('id') id: string,
    @Body() body: HrUpdateProfileImageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.svc.updateProfileImage(id, body.imageUrl);
    return { data, updatedBy: user?.id };
  }

  @Post(':id/assign-org-functions')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(HrAssignOrgFunctionsSchema))
  async assignOrgFunctions(
    @Param('id') id: string,
    @Body() body: HrAssignOrgFunctionsDto,
  ) {
    const data = await this.svc.assignOrgFunctions(id, body.departmentId, body.positionId);
    return { data };
  }

  @Post('import')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrImportEmployeesSchema))
  async importEmployees(@Body() body: HrImportEmployeesDto) {
    const list = Array.isArray(body.employees) ? body.employees : [];
    let imported = 0;
    for (const emp of list) {
      await this.svc.importEmployee(emp);
      imported++;
    }
    return { imported, total: list.length };
  }

  @Get(':id/assets')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeAssets(@Param('id') id: string) {
    const data = await this.svc.getEmployeeAssets(id);
    return { data };
  }

  @Post(':id/assets')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrAssignAssetSchema))
  async assignAsset(@Param('id') id: string, @Body() body: HrAssignAssetDto) {
    const { asset_type, asset_name, asset_code, assigned_date, notes } = body;
    const data = await this.svc.assignAsset(id, asset_type, asset_name, asset_code, assigned_date, notes);
    return { data };
  }

  @Get(':employeeId/swap-requests')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'MANAGER')
  async getEmployeeSwapRequests(@Param('employeeId') employeeId: string, @Query('status') status?: string) {
    const data = await this.svc.getEmployeeSwapRequests(employeeId, status);
    return { data };
  }

  @Get(':employeeId/complaints')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeComplaints(@Param('employeeId') employeeId: string) {
    const data = await this.svc.getEmployeeComplaints(employeeId);
    return { data };
  }

  @Post(':employeeId/complaints')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrCreateComplaintSchema))
  async createComplaint(@Param('employeeId') employeeId: string, @Body() body: HrCreateComplaintDto) {
    const { party2, description, severity } = body;
    const data = await this.svc.createComplaint(employeeId, party2, description, severity);
    return { data };
  }

  @Get(':employeeId/assessment-skips')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getAssessmentSkips(@Param('employeeId') employeeId: string) {
    const data = await this.svc.getAssessmentSkips(employeeId);
    return { data };
  }

  @Get('list/for-face')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'admin')
  async getEmployeesForFace(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pg = Number(page ?? 1);
    const lm = Number(limit ?? 100);
    const result = await this.svc.getEmployeesList(lm, (pg - 1) * lm);
    const items = Array.isArray(result) ? result : [];
    return { items, total: items.length };
  }

  @Get(':employeeId/documents')
  async getEmployeeDocuments(@Param('employeeId') employeeId: string) { return { data: [], employeeId }; }

  @Get(':employeeId/documents/:docId')
  async getEmployeeDocumentById(@Param('employeeId') employeeId: string, @Param('docId') docId: string) { return { employeeId, docId }; }

  @Delete(':employeeId/documents/:docId')
  async deleteEmployeeDocument(@Param('employeeId') employeeId: string, @Param('docId') docId: string) { return { deleted: true }; }

  @Get(':employeeId/operator-stats')
  async getOperatorStats(@Param('employeeId') employeeId: string) { return { employeeId, totalOps: 0 }; }
}
