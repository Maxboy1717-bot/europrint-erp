/**
 * @module admin-settings.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertOk } from '@common/http-result';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';

import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '../../infrastructure/decorators/roles.decorator';
import { AuditInterceptor } from '../../infrastructure/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { isErr } from '@common/result';

import { UpdateSettingsService } from '../../application/services/update-settings.service';
import { ISettingsRepo } from '../../domain/repositories/i-settings.repo';
import { SETTINGS_REPO } from '../../admin.tokens';
import { UpdateSettingsDto, UpdateSettingsSchema } from '../dto/update-settings.dto';
import { UserRole } from '../../domain/aggregates/user.aggregate';
import { AuthenticatedUser } from '@auth/types';
import { MAX_USERS_DEFAULT } from '@common/constants/app.constants';

@ApiThrottle()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiBearerAuth()
@ApiTags('Admin - Settings')
export class AdminSettingsController {
  private readonly logger = new Logger(AdminSettingsController.name);

  constructor(
    private readonly updateSettingsHandler: UpdateSettingsService,
    @Inject(SETTINGS_REPO) private readonly settingsRepo: ISettingsRepo,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Tizim sozlamalari' })
  async getSettings() {
    const settings = await this.settingsRepo.getSettings();
    const data = settings?.toPersistence() ?? {
      advancePercent:   30,
      freeStorageDays:  7,
      storageDailyRate: 0,
      maxUsers:         MAX_USERS_DEFAULT,
      maintenanceMode:  false,
      updatedAt:        _time.now(),
    };
    return {
      advancePercent:    data.advancePercent,
      freeStorageDays:   data.freeStorageDays,
      storageDailyRate:  data.storageDailyRate,
      maxUsers:          data.maxUsers,
      maintenanceMode:   data.maintenanceMode,
      updatedAt:         data.updatedAt,
    };
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Tizim sozlamalarini o'zgartirish" })
  async updateSettings(@Body() dto: UpdateSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    const validated = UpdateSettingsSchema.parse(dto);
    const result = await this.updateSettingsHandler.execute({
      advancePercent:   validated.advancePercent,
      freeStorageDays:  validated.freeStorageDays,
      storageDailyRate: validated.storageDailyRate,
      updatedBy:        user.id,
      userRole:         user.role as UserRole,
    });
    assertOk(result);
    return { message: 'Settings updated successfully' };
  }
}
