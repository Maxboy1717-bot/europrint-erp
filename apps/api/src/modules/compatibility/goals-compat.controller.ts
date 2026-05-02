import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GoalsCompatService } from './goals-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES, 'OPERATOR')
@Controller('goals')
export class GoalsCompatController {
  constructor(private readonly svc: GoalsCompatService) {}

  @Get()
  async getGoals(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getGoals(status, category, targetType, limit));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGoal(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createGoal(body));
  }

  @Get(':id')
  async getGoal(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getGoal(id));
  }

  @Put(':id')
  async updateGoal(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateGoal(id, body));
  }

  @Delete(':id')
  async deleteGoal(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteGoal(id));
  }
}
