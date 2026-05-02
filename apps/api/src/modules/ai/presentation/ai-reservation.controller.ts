import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '../../auth/guards/roles.guard';
import { Roles }       from '../../auth/decorators/roles.decorator';
import { Role }        from '../../auth/types/role';
import { unwrapOrBadRequest } from '@common/http-result';
import { AiReservationService } from '../application/services/ai-reservation.service';
import { CreateReservationRequestDto, CreateBatchDto } from './dto/ai-reservation.dto';

@ApiTags('§15 AI Reservation')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-reservation')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.WAREHOUSE)
export class AiReservationController {
  private readonly logger = new Logger(AiReservationController.name);

  constructor(private readonly service: AiReservationService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha rezervatsiyalar (so`rovlar va partiyalar)' })
  async getAll() {
    return unwrapOrBadRequest(await this.service.getAll());
  }

  @Get('requests')
  @ApiOperation({ summary: 'Rezervatsiya so`rovlari ro`yxati' })
  async getRequests() {
    return unwrapOrBadRequest(await this.service.getRequests());
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Rezervatsiya dashboard statistikasi' })
  async getDashboard() {
    return unwrapOrBadRequest(await this.service.getDashboard());
  }

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi rezervatsiya so`rovi yaratish' })
  async createRequest(@Body() dto: CreateReservationRequestDto) {
    return unwrapOrBadRequest(await this.service.createRequest(dto));
  }

  @Get('optimize')
  @ApiOperation({ summary: 'Materialni AI yordamida optimallashtirish' })
  async optimizeReservation(@Query('materialType') materialType: string, @Query('quantity') quantity: string) {
    return unwrapOrBadRequest(await this.service.optimizeReservation(materialType, Number(quantity)));
  }

  @Post('requests/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Rezervatsiya so`rovini tasdiqlash' })
  async confirmRequest(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.service.confirmRequest(id));
  }

  @Post('requests/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Rezervatsiya so`rovini bekor qilish' })
  async cancelRequest(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.service.cancelRequest(id));
  }

  @Get('batches')
  @ApiOperation({ summary: "Partiyalar ro'yxati" })
  async getBatches() {
    return unwrapOrBadRequest(await this.service.getAll());
  }

  @Post('batches')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi partiya yaratish' })
  async createBatch(@Body() dto: CreateBatchDto) {
    return unwrapOrBadRequest(await this.service.createBatch(dto));
  }
}
