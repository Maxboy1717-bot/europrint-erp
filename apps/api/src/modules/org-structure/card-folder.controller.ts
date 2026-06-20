/**
 * @module card-folder.controller
 * @description HTTP routes for the card's 6-section folder. Mirrors CardController.
 *   GET returns the folder + completeness%; PUT upserts the 6 sections. EP-ORG-007.
 */

import {
  Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { CardFolderService } from './card-folder.service';
import type { FolderInput } from './card-folder.repository';

const SECTION = z.string().max(20000).nullable().optional();
const FolderSchema = z.object({
  vazifa: SECTION,
  javobgarlik: SECTION,
  gsd: SECTION,
  reglament: SECTION,
  jarayon: SECTION,
  talim: SECTION,
}).strict();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Card Folder')
@ApiBearerAuth()
@Controller('org-structure/cards/:cardId/folder')
export class CardFolderController {
  private readonly logger = new Logger(CardFolderController.name);
  constructor(private readonly service: CardFolderService) {}

  @ApiOperation({ summary: 'Get card folder (6 sections + completeness%)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async get(@Param('cardId', ParseIntPipe) cardId: number) {
    return unwrapOrThrow(await this.service.getFolder(cardId));
  }

  @ApiOperation({ summary: 'Upsert card folder (6 sections)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put()
  async upsert(@Param('cardId', ParseIntPipe) cardId: number, @Body() body: unknown) {
    const dto = FolderSchema.parse(body) as FolderInput;
    this.logger.log('Upserting card folder');
    return unwrapOrThrow(await this.service.upsertFolder(cardId, dto));
  }
}
