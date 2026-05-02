import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards , UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { WasteService } from './waste.service';
import { WasteBodyDto, WasteRecycleDto } from '../compatibility/dto/operations.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('waste')
export class WasteController {
  constructor(private readonly svc: WasteService) {}

  @Get('records')
  async getRecords(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getRecords(q));
  }

  @Post('records')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'operator', 'manager')
  @HttpCode(HttpStatus.CREATED)
  async createRecord(@Body() body: WasteBodyDto) {
    return unwrapOrInternal(await this.svc.createRecord(body));
  }

  @Patch('records/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'manager')
  async updateRecord(@Param('id') id: string, @Body() body: WasteBodyDto) {
    return unwrapOrInternal(await this.svc.updateRecord(id, body));
  }

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('trends')
  async getTrends(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getTrends(q));
  }

  @Get('targets')
  async getTargets() {
    return unwrapOrInternal(await this.svc.getTargets());
  }

  @Post('targets')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'director', 'manager')
  @HttpCode(HttpStatus.CREATED)
  async createTarget(@Body() body: WasteBodyDto) {
    return unwrapOrInternal(await this.svc.createTarget(body));
  }

  @Get('analysis')
  async getAnalysis() {
    return unwrapOrInternal(await this.svc.getAnalysis());
  }
}
