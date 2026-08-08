/**
 * @module ai-planning.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Patch, Post, Put, Param, Body,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '../../auth/guards/roles.guard';
import { Roles }       from '../../auth/decorators/roles.decorator';
import { Role }        from '@common/constants/roles.constants';
import { unwrapOrBadRequest, unwrapOrNotFound } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { AiPlanningService } from '../application/services/ai-planning.service';
import {
  GeneratePlanDto, GeneratePlanDtoSchema,
  ApprovePlanDto, ApprovePlanDtoSchema,
  RejectPlanDto, RejectPlanDtoSchema,
  UpdatePlanningConfigDto, UpdatePlanningConfigDtoSchema,
  CreatePlanDto, CreatePlanDtoSchema,
  ReschedulePlanDto, ReschedulePlanDtoSchema,
  BlockMaterialDto, BlockMaterialDtoSchema,
} from './dto/ai-planning.dto';

@ApiTags('§15 AI Planning')
@ApiBearerAuth()
@AiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-planning')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
export class AiPlanningController {
  private readonly logger = new Logger(AiPlanningController.name);

  constructor(private readonly service: AiPlanningService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'AI rejalashtirishda dashboard' })
  async getDashboard() {
    return unwrapOrBadRequest(await this.service.getDashboard());
  }

  @Get('plans')
  @ApiOperation({ summary: 'AI rejalar ro`yxati' })
  async getPlans() {
    return unwrapOrBadRequest(await this.service.getPlans());
  }

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi AI reja yaratish' })
  @UsePipes(new ZodValidationPipe(CreatePlanDtoSchema))
  async createPlan(@Body() dto: CreatePlanDto) {
    return unwrapOrBadRequest(await this.service.createPlan(dto));
  }

  @Get('config')
  @ApiOperation({ summary: 'AI rejalashtirishda konfiguratsiya' })
  async getConfig() {
    return unwrapOrBadRequest(await this.service.getConfig());
  }

  @Put('config')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI rejalashtirishda konfiguratsiyani yangilash' })
  @UsePipes(new ZodValidationPipe(UpdatePlanningConfigDtoSchema))
  async updateConfig(@Body() dto: UpdatePlanningConfigDto) {
    return unwrapOrBadRequest(await this.service.updateConfig(dto));
  }

  @Patch('config')
  @UseInterceptors(AuditInterceptor)
  @UsePipes(new ZodValidationPipe(UpdatePlanningConfigDtoSchema))
  @ApiOperation({ summary: 'AI planlash konfiguratsiyasini patch qilish' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async patchConfig(@Body() dto: UpdatePlanningConfigDto) {
    return unwrapOrBadRequest(await this.service.updateConfig(dto));
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI reja generatsiya qilish' })
  @UsePipes(new ZodValidationPipe(GeneratePlanDtoSchema))
  async generatePlan(@Body() dto: GeneratePlanDto) {
    return unwrapOrBadRequest(await this.service.generatePlan(dto));
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'AI reja tafsiloti' })
  async getPlanById(@Param('id') id: string) {
    return unwrapOrNotFound(await this.service.getPlanById(id));
  }

  @Get('plans/:id/batch-groups')
  @ApiOperation({ summary: 'Reja batch guruhlarini olish' })
  async getBatchGroups(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.service.getBatchGroups(id));
  }

  @Post('plans/:id/approve')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI rejani tasdiqlash' })
  @UsePipes(new ZodValidationPipe(ApprovePlanDtoSchema))
  async approvePlan(@Param('id') id: string, @Body() dto: ApprovePlanDto) {
    return unwrapOrNotFound(await this.service.approvePlan(id, dto));
  }

  @Post('plans/:id/reject')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI rejani rad etish' })
  @UsePipes(new ZodValidationPipe(RejectPlanDtoSchema))
  async rejectPlan(@Param('id') id: string, @Body() dto: RejectPlanDto) {
    return unwrapOrNotFound(await this.service.rejectPlan(id, dto));
  }

  @Post('plans/:id/execute')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI rejani ijro etishni boshlash' })
  async executePlan(@Param('id') id: string) {
    return unwrapOrNotFound(await this.service.executePlan(id));
  }

  @Post('plans/:id/reschedule')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI rejani qayta jadvallashtirish' })
  @UsePipes(new ZodValidationPipe(ReschedulePlanDtoSchema))
  async reschedulePlan(@Param('id') id: string, @Body() dto: ReschedulePlanDto) {
    return unwrapOrNotFound(await this.service.reschedulePlan(id, dto.newDate));
  }

  @Post('decisions/:id/accept')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'AI qarorini qabul qilish' })
  async acceptDecision(@Param('id') id: string) {
    return unwrapOrNotFound(await this.service.acceptDecision(id));
  }

  @Post('orders/:orderId/block-material')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Buyurtma uchun material band qilish' })
  @UsePipes(new ZodValidationPipe(BlockMaterialDtoSchema))
  async blockMaterial(@Param('orderId') orderId: string, @Body() dto: BlockMaterialDto) {
    return unwrapOrBadRequest(await this.service.blockMaterial(orderId, dto.materialId));
  }
}
