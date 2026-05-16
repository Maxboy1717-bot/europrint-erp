/**
 * @module hr-employees-ext.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';

// P3-26: employee-documents endpoints aren't yet wired; return 501 so the
// frontend (employee profile page) can show a "coming soon" empty state.
const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@ApiTags('Hr Employees Ext')
@Controller('hr/employees')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrEmployeesExtController {
  constructor(private readonly svc: HrEmployeesExtService) {}

  @ApiOperation({ summary: 'Update profile image' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Assign org functions' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Import employees' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get employee assets' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/assets')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeAssets(@Param('id') id: string) {
    const data = await this.svc.getEmployeeAssets(id);
    return { data };
  }

  @ApiOperation({ summary: 'Assign asset' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/assets')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrAssignAssetSchema))
  async assignAsset(@Param('id') id: string, @Body() body: HrAssignAssetDto) {
    const { asset_type, asset_name, asset_code, assigned_date, notes } = body;
    const data = await this.svc.assignAsset(id, asset_type, asset_name, asset_code, assigned_date, notes);
    return { data };
  }

  @ApiOperation({ summary: 'Get employee swap requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':employeeId/swap-requests')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'MANAGER')
  async getEmployeeSwapRequests(@Param('employeeId') employeeId: string, @Query('status') status?: string) {
    const data = await this.svc.getEmployeeSwapRequests(employeeId, status);
    return { data };
  }

  @ApiOperation({ summary: 'Get employee complaints' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':employeeId/complaints')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeComplaints(@Param('employeeId') employeeId: string) {
    const data = await this.svc.getEmployeeComplaints(employeeId);
    return { data };
  }

  @ApiOperation({ summary: 'Create complaint' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':employeeId/complaints')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrCreateComplaintSchema))
  async createComplaint(@Param('employeeId') employeeId: string, @Body() body: HrCreateComplaintDto) {
    const { party2, description, severity } = body;
    const data = await this.svc.createComplaint(employeeId, party2, description, severity);
    return { data };
  }

  @ApiOperation({ summary: 'Get assessment skips' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':employeeId/assessment-skips')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getAssessmentSkips(@Param('employeeId') employeeId: string) {
    const data = await this.svc.getAssessmentSkips(employeeId);
    return { data };
  }

  @ApiOperation({ summary: 'Get employees for face' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('list/for-face')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'admin')
  async getEmployeesForFace(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pg = Number(page ?? 1);
    const lm = Number(limit ?? 100);
    const result = await this.svc.getEmployeesList(lm, (pg - 1) * lm);
    const items = Array.isArray(result) ? result : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get employee documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get(':employeeId/documents')
  async getEmployeeDocuments(@Param('employeeId') _employeeId: string) {
    return notImplemented('GET /hr/employees/:employeeId/documents');
  }

  @ApiOperation({ summary: 'Get employee document by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get(':employeeId/documents/:docId')
  async getEmployeeDocumentById(@Param('employeeId') _employeeId: string, @Param('docId') _docId: string) {
    return notImplemented('GET /hr/employees/:employeeId/documents/:docId');
  }

  @ApiOperation({ summary: 'Delete employee document' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Delete(':employeeId/documents/:docId')
  async deleteEmployeeDocument(@Param('employeeId') _employeeId: string, @Param('docId') _docId: string) {
    return notImplemented('DELETE /hr/employees/:employeeId/documents/:docId');
  }

  @ApiOperation({ summary: 'Get operator stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':employeeId/operator-stats')
  async getOperatorStats(@Param('employeeId') employeeId: string) { return { employeeId, totalOps: 0 }; }
}
