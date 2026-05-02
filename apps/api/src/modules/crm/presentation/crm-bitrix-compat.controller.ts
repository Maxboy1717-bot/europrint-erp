import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CrmBitrixCompatService } from '../application/crm-bitrix-compat.service';
import { CreateRobotDtoSchema, CreateRobotDto, UpdateRobotDtoSchema, UpdateRobotDto } from './dto/crm-bitrix-compat.dto';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const BITRIX_ROLES = ['admin', 'manager', 'hr_manager', 'director', 'super_admin'];

@UseGuards(RolesGuard)
@Roles(...BITRIX_ROLES)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('crm-bitrix')
export class CrmBitrixCompatController {
  private readonly logger = new Logger(CrmBitrixCompatController.name);

  constructor(private readonly svc: CrmBitrixCompatService) {}

  @Get('proposals')
  async listProposals(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    return unwrapOrThrow(await this.svc.listProposals(lim, off));
  }

  @Get('invoices')
  async listInvoices(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    return unwrapOrThrow(await this.svc.listInvoices(lim, off));
  }

  @Get('robots')
  async listRobots(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    return unwrapOrThrow(await this.svc.listRobots(lim, off));
  }

  @Get('robots/:id')
  async getRobot(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getRobot(parseInt(id, 10) || 0));
  }

  @Post('robots')
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(CreateRobotDtoSchema))
  async createRobot(@Body() body: CreateRobotDto) {
    return unwrapOrThrow(await this.svc.createRobot(body));
  }

  @Put('robots/:id')
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(UpdateRobotDtoSchema))
  async updateRobot(@Param('id') id: string, @Body() body: UpdateRobotDto) {
    return unwrapOrThrow(await this.svc.updateRobot(parseInt(id, 10) || 0, body));
  }

  @Patch('robots/:id/toggle')
  @Roles('super_admin', 'director', 'manager')
  async toggleRobot(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.toggleRobot(parseInt(id, 10) || 0));
  }

  @Delete('robots/:id')
  @Roles('super_admin', 'director')
  async deleteRobot(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteRobot(parseInt(id, 10) || 0));
  }
}
