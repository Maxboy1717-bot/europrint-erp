/**
 * @module admin-users.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk, unwrapOrThrow } from '@common/http-result';
import { assertValidated } from '@common/assertions';
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, InternalServerErrorException, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { I18nService } from 'nestjs-i18n';

import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '../../infrastructure/decorators/roles.decorator';
import { AuditInterceptor } from '../../infrastructure/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { isErr } from '@common/result';

import { CreateUserHandler } from '../../application/commands/create-user.handler';
import { UpdateUserRoleHandler } from '../../application/commands/update-user-role.handler';
import { ListUsersHandler } from '../../application/queries/list-users.handler';

import { CreateUserDto, CreateUserSchema } from '../dto/create-user.dto';
import { UserRole } from '../../domain/aggregates/user.aggregate';
import { AuthenticatedUser } from '@auth/types';
import { IUserRepo } from '../../domain/repositories/i-user.repo';
import { USER_REPO } from '../../admin.tokens';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiBearerAuth()
@ApiTags('Admin - Users')
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(
    private readonly createUserHandler: CreateUserHandler,
    private readonly updateUserRoleHandler: UpdateUserRoleHandler,
    private readonly listUsersHandler: ListUsersHandler,
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
    assertValidated(Object.values(UserRole).includes(body.role), 'Invalid role');
    const result = await this.updateUserRoleHandler.execute({ userId, newRole: body.role, executorId: user.id });
    assertOk(result);
    return { message: 'Role updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Foydalanuvchini o'chirish" })
  async deleteUser(@Param('id', ParseIntPipe) userId: number, @CurrentUser() user: AuthenticatedUser) {
    assertValidated(userId !== user.id, 'Cannot delete your own account');
    try {
      await this.userRepo.softDelete(userId);
    } catch {
      throw new InternalServerErrorException(await this.i18n.t('errors.deleteFailed'));
    }
    return { message: await this.i18n.t('messages.userDeleted'), code: 'USER_DELETED' };
  }
}
