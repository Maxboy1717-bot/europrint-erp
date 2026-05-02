import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MentorshipsCompatService } from './mentorships-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('mentorships')
export class MentorshipsCompatController {
  constructor(private readonly svc: MentorshipsCompatService) {}

  @Get()
  async getMentorships(
    @Query('mentorId') mentorId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.svc.getMentorships(mentorId, status));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMentorship(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createMentorship(body));
  }

  @Get(':id')
  async getMentorship(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getMentorship(id));
  }

  @Put(':id')
  async updateMentorship(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateMentorship(id, body));
  }

  @Delete(':id')
  async deleteMentorship(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteMentorship(id));
  }
}
