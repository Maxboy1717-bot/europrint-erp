/**
 * @module gpt.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Body,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '../../auth/guards/roles.guard';
import { Roles }       from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { Role }        from '@common/constants/roles.constants';
import { unwrapOrBadRequest } from '@common/http-result';
import { AiRouterService } from '../application/services/ai-router.service';
import { GptTestDto } from './dto/ai-gpt.dto';

@ApiTags('§15 GPT Test')
@ApiBearerAuth()
@AiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gpt')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
export class GptController {
  private readonly logger = new Logger(GptController.name);

  constructor(private readonly aiRouter: AiRouterService) {}

  @Get('status')
  @ApiOperation({ summary: 'GPT xizmat holati' })
  getStatus() {
    return { status: 'active', provider: 'gemini', features: ['chat', 'analysis', 'planning'] };
  }

  @Get('chat')
  @ApiOperation({ summary: 'GPT chat endpointi (GET)' })
  getChatInfo() {
    return { info: 'POST /api/gpt/test orqali chat so`rov yuboring', method: 'POST', body: { prompt: 'string', provider: 'string?' } };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'GPT test so`rovi yuborish' })
  async test(@Body() dto: GptTestDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`GPT test by user ${user.id}: provider=${dto.provider ?? 'auto'}`);
    return unwrapOrBadRequest(await this.aiRouter.call({
      taskType: 'director.kpi_explain',
      prompt:   dto.prompt,
      provider: dto.provider,
      userId:   user.id,
    }));
  }
}
