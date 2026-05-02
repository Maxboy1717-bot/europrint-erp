import { assertFound } from '@common/assertions';
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MmMaterialsExtrasService } from '../application/mm-materials-extras.service';
import { safeInt } from '../../hr/common/db-rows';

const MM_ROLES = ['super_admin', 'director', 'warehouse_manager', 'production_manager', 'planner'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('materials/cards')
@UseGuards(RolesGuard)
@Roles(...MM_ROLES)
export class MmMaterialCardsController {
  private readonly logger = new Logger(MmMaterialCardsController.name);

  constructor(private readonly svc: MmMaterialsExtrasService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return unwrapOrThrow(await this.svc.listMaterialCards(safeInt(page, 1), safeInt(limit, 50), search, category));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const r = await this.svc.getMaterialCard(safeInt(id, 0));
    assertFound(r, 'Material card not found');
    return r;
  }
}
