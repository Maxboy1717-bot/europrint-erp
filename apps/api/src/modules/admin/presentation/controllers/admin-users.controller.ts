/**
 * @module admin-users.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk, unwrapOrThrow } from '@common/http-result';
import { assertValidated } from '@common/assertions';
import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Inject, InternalServerErrorException, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';

import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '../../infrastructure/decorators/roles.decorator';
import { AuditInterceptor } from '../../infrastructure/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { isErr } from '@common/result';

import { CreateUserService } from '../../application/services/create-user.service';
import { UpdateUserRoleService } from '../../application/services/update-user-role.service';
import { ListUsersService } from '../../application/services/list-users.service';

import { CreateUserDto, CreateUserSchema } from '../dto/create-user.dto';
import { UserRole } from '../../domain/aggregates/user.aggregate';
import { AuthenticatedUser } from '@auth/types';
import { IUserRepo } from '../../domain/repositories/i-user.repo';
import { USER_REPO } from '../../admin.tokens';

@ApiThrottle()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiBearerAuth()
@ApiTags('Admin - Users')
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(
    private readonly createUserHandler: CreateUserService,
    private readonly updateUserRoleHandler: UpdateUserRoleService,
    private readonly listUsersHandler: ListUsersService,
    @Inject(USER_REPO) private readonly userRepo: IUserRepo,
    private readonly i18n: I18nService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi foydalanuvchi yaratish' })
  async createUser(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    const validated = CreateUserSchema.parse(dto);
    const result = await this.createUserHandler.execute({
      username:     validated.username,
      email:        validated.email,
      password:     validated.password,
      role:         validated.role,
      departmentId: validated.departmentId,
      positionId:   validated.positionId,
      executorRole: user.role,
    });
    const u = unwrapOrThrow(result);
    return {
      id:       u.getId(),
      username: u.getUsername(),
      email:    u.getEmail(),
      role:     u.getRole(),
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: "Foydalanuvchilar ro'yxati" })
  async listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('departmentId') departmentId?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    const result = await this.listUsersHandler.execute({ filters: { page, limit, role, departmentId, isActive } });
    const paged = unwrapOrThrow(result);
    return {
      users: (Array.isArray(paged?.data) ? paged?.data : []).map(u => ({
        id:       u.getId(),
        username: u.getUsername(),
        email:    u.getEmail(),
        role:     u.getRole(),
        isActive: u.isUserActive(),
      })),
      pagination: { total: paged.total, page: paged.page, limit: paged.limit, pages: paged.pages },
    };
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Foydalanuvchi rolini o'zgartirish" })
  async updateUserRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: { role: UserRole },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    assertValidated(Object.values(UserRole).includes(body.role), await this.i18n.t('errors.invalidRole'));
    const result = await this.updateUserRoleHandler.execute({ userId, newRole: body.role, executorId: user.id, executorRole: user.role });
    assertOk(result);
    return { message: 'Role updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Foydalanuvchini o'chirish" })
  async deleteUser(@Param('id', ParseIntPipe) userId: number, @CurrentUser() user: AuthenticatedUser) {
    // SECURITY (audit 2026-08-06 T2): RolesGuard's director bypass ignores
    // @Roles(SUPER_ADMIN) above — enforce it explicitly here as a second layer.
    if (String(user.role ?? '').toLowerCase() !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Faqat SUPER_ADMIN foydalanuvchini o'chira oladi");
    }
    assertValidated(userId !== user.id, await this.i18n.t('errors.cannotDeleteOwnAccount'));
    let deleted: boolean;
    try {
      deleted = await this.userRepo.softDelete(userId);
    } catch {
      throw new InternalServerErrorException(await this.i18n.t('errors.deleteFailed'));
    }
    // audit 2026-08-06 T3 (Qoida 11): nonexistent id must be 404, not fake 200.
    if (!deleted) throw new NotFoundException(await this.i18n.t('errors.userNotFound'));
    return { message: await this.i18n.t('messages.userDeleted'), code: 'USER_DELETED' };
  }
}
