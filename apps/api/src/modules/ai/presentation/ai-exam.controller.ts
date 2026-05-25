/**
 * @module ai-exam.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Delete, Param,
  UseGuards, UseInterceptors, Logger,
  Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }   from '../../auth/guards/roles.guard';
import { Roles }        from '../../auth/decorators/roles.decorator';
import { Role }         from '../../auth/types/role';
import { unwrapOrBadRequest, unwrapOrNotFound, unwrapOrInternal } from '@common/http-result';
import { AiExamService } from '../application/services/ai-exam.service';
import { AssignAiExamDto, SubmitAiExamDto } from './dto/ai-exam.dto';

@ApiTags('§15 AI Exam')
@ApiBearerAuth()
@AiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-exam')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
export class AiExamController {
  private readonly logger = new Logger(AiExamController.name);

  constructor(private readonly service: AiExamService) {}

  @Get('attempts')
  @ApiOperation({ summary: 'Barcha AI imtihon urinishlari ro`yxati' })
  async getAttempts() {
    return unwrapOrInternal(await this.service.getAttempts());
  }

  @Get('attempt/:id')
  @ApiOperation({ summary: 'AI imtihon urinishi tafsiloti' })
  async getAttemptById(@Param('id') id: string) {
    return unwrapOrNotFound(await this.service.getAttemptById(id));
  }

  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI imtihon tayinlash' })
  async assignExam(@Body() dto: AssignAiExamDto) {
    return unwrapOrBadRequest(await this.service.assignExam(dto.userId, dto.positionId));
  }

  @Get('attempt')
  @ApiOperation({ summary: 'AI imtihon urinishlari ro`yxati (alias)' })
  async getAttemptsAlias() {
    return unwrapOrInternal(await this.service.getAttempts());
  }

  @Post('attempt')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI imtihon javoblarini topshirish' })
  async submitAttempt(@Body() dto: SubmitAiExamDto) {
    return unwrapOrBadRequest(await this.service.submitAttempt(dto.attemptId, dto.answers));
  }

  @Delete('attempt/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI imtihon urinishini o`chirish' })
  async deleteAttempt(@Param('id') id: string) {
    return unwrapOrNotFound(await this.service.deleteAttempt(id));
  }
}
