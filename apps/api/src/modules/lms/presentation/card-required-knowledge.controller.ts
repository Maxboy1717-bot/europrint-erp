/**
 * @module card-required-knowledge.controller
 * @description NestJS controller — KARTAga kerakli domen-bilim CRUD (EP-ORG-122, T11-03).
 *   Routes under /api/lms/card-knowledge. Delegates to CardRequiredKnowledgeService.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { unwrapOrThrow } from '@common/http-result';
import { CardRequiredKnowledgeService } from '../application/services/card-required-knowledge.service';

const READ_ROLES = [
  'EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR',
] as const;
const WRITE_ROLES = [
  'HR_MANAGER', 'TRAINING_OFFICER', 'DIRECTOR', 'SUPER_ADMIN',
] as const;

@ApiThrottle()
@ApiTags('Lms Card Knowledge')
@ApiBearerAuth()
@Controller('lms/card-knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class CardRequiredKnowledgeController {
  constructor(private readonly svc: CardRequiredKnowledgeService) {}

  @ApiOperation({ summary: 'List domen-bilim by org-card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('by-card/:cardId')
  @Roles(...READ_ROLES)
  async listByCard(@Param('cardId', ParseIntPipe) cardId: number) {
    const data = unwrapOrThrow(await this.svc.listByCard(cardId));
    return { data, pagination: { total: data.length } };
  }

  @ApiOperation({ summary: 'Get one domen-bilim' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(...READ_ROLES)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findById(id);
  }

  @ApiOperation({ summary: 'Create domen-bilim talab' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(...WRITE_ROLES)
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.svc.create(body, user?.id ?? user?.sub);
    return { message: 'Domen-bilim talabi qo\'shildi', data };
  }

  @ApiOperation({ summary: 'Update domen-bilim talab' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles(...WRITE_ROLES)
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const data = await this.svc.update(id, body);
    return { message: 'Domen-bilim talabi yangilandi', data };
  }

  @ApiOperation({ summary: 'Delete domen-bilim talab' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(...WRITE_ROLES)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.svc.remove(id);
    return { message: 'Domen-bilim talabi o\'chirildi', data };
  }
}
