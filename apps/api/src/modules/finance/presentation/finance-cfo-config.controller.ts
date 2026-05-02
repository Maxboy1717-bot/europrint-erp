import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CfoConfigService } from '../domain/services/cfo-config.service';
import { unwrapOrInternal } from '@common/http-result';

const UpdateCfoConfigDto = z.object({
  value: z.number({ required_error: 'value maydoni talab qilinadi', invalid_type_error: 'value raqam bo\'lishi kerak' }).finite(),
});

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/cfo-config')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceCfoConfigController {
  constructor(private readonly cfoConfig: CfoConfigService) {}

  /** GET /api/finance/cfo-config — returns all CFO config entries */
  @Get()
  @RequirePermission('finance.cfo-config:READ')
  async findAll() {
    return unwrapOrInternal(await this.cfoConfig.findAll());
  }

  /** PUT /api/finance/cfo-config/:key — update a single config value */
  @Put(':key')
  @RequirePermission('finance.cfo-config:FULL')
  async update(
    @Param('key') key: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateCfoConfigDto.parse(body);
    return unwrapOrInternal(await this.cfoConfig.update(key, dto.value));
  }
}
