/**
 * @module kanban-status-column-map.controller
 * @description In-app CRUD for `kanban_status_column_map` — the ONLY way (besides
 *   raw SQL) to populate the (sd_status -> kanban_column_id) rules read by the
 *   already-working auto-move mechanism (`KanbanCardsRepository.moveOrderCardByStatusMap`,
 *   `OrderStatusChangedKanbanHandler`). This controller does not touch that
 *   mechanism — it only manages the configuration table it reads from.
 *
 *   Role gate mirrors `KanbanBoardsController`'s board/column-management
 *   endpoints (also standard-structure config, owner-decision #16603): broad
 *   read access, mutations restricted to super_admin/director.
 */

import {
  BadRequestException, Body, Controller, Delete, Get, Param, Post, Put,
  UseInterceptors, UsePipes, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow, assertOk } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { KanbanStatusColumnMapService } from '../application/kanban-status-column-map.service';
import {
  KanbanCreateStatusColumnMapSchema, KanbanCreateStatusColumnMapDto,
  KanbanUpdateStatusColumnMapSchema, KanbanUpdateStatusColumnMapDto,
} from '../dto/kanban-status-column-map.dto';

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(`Noto'g'ri id: ${raw}`);
  }
  return id;
}

@ApiTags('Kanban Status-Column Map')
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('kanban/status-column-map')
export class KanbanStatusColumnMapController {
  constructor(private readonly svc: KanbanStatusColumnMapService) {}

  @Get()
  @ApiOperation({ summary: "SD holat -> Kanban ustun xaritasi ro'yxati" })
  async list() {
    return unwrapOrThrow(await this.svc.list());
  }

  // Static segment — must be declared before no ':id' routes exist that could
  // shadow it; there are none here, but kept first for readability/consistency.
  @Get('columns')
  @ApiOperation({ summary: 'Mavjud kanban ustunlari (create/edit forma dropdown uchun)' })
  async listColumns() {
    return unwrapOrThrow(await this.svc.listColumns());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(KanbanCreateStatusColumnMapSchema))
  @ApiOperation({ summary: 'Yangi xarita qatori yaratish (faqat super_admin/director)' })
  async create(@Body() body: KanbanCreateStatusColumnMapDto) {
    return unwrapOrThrow(await this.svc.create(body));
  }

  @Put(':id')
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(KanbanUpdateStatusColumnMapSchema))
  @ApiOperation({ summary: 'Xarita qatorini yangilash (faqat super_admin/director)' })
  async update(@Param('id') id: string, @Body() body: KanbanUpdateStatusColumnMapDto) {
    return unwrapOrThrow(await this.svc.update(parseId(id), body));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('super_admin', 'director')
  @ApiOperation({ summary: "Xarita qatorini o'chirish (faqat super_admin/director)" })
  async remove(@Param('id') id: string) {
    const result = await this.svc.remove(parseId(id));
    assertOk(result);
    return {};
  }
}
