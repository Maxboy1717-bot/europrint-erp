/**
 * @module library.controller
 * @description NestJS controller. HTTP route handlers for /api/design/library — Design asset
 * library CRUD (logos, fonts, templates, brand colors, etc.). Delegates to LibraryService and
 * returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { LibraryService } from './library.service';

const CreateLibraryItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(50).optional().default('image'),
  fileUrl: z.string().trim().min(1).max(500).optional(),
  thumbnailUrl: z.string().trim().min(1).max(500).optional(),
  tags: z.string().trim().max(1000).optional(),
  status: z.enum(['active', 'archived']).optional().default('active'),
});

const UpdateLibraryItemSchema = CreateLibraryItemSchema.partial();

// Users allowed to view/manage brand asset library — mirrors DesignExtendedController's gate
// (design orders/templates/dashboard), the closest sibling resource in this module.
const LIBRARY_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER] as const;

@ApiTags('Design — Library')
@ApiBearerAuth()
@ApiThrottle()
@Controller('design/library')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...LIBRARY_ROLES)
export class LibraryController {
  constructor(private readonly svc: LibraryService) {}

  @Get()
  @ApiOperation({ summary: 'List design library assets (paginated)' })
  @ApiResponse({ status: 200, description: 'OK' })
  async findAll(@Query() query: Record<string, unknown>) {
    return unwrapOrThrow(await this.svc.findAll(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one design library asset' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // service.findOne throws NotFoundException itself (Qoida 11) — no Result wrapping here.
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a design library asset' })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(
    @Body(new ZodValidationPipe(CreateLibraryItemSchema)) body: z.infer<typeof CreateLibraryItemSchema>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrThrow(await this.svc.create(body, user?.id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a design library asset' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateLibraryItemSchema)) body: z.infer<typeof UpdateLibraryItemSchema>,
  ) {
    return unwrapOrThrow(await this.svc.update(id, body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft) a design library asset' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.remove(id));
  }
}
