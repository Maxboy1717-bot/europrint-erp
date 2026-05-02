import { Controller, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { z } from 'zod';
import { validateStir } from '@common/validators/stir.validator';
import { validateLuhn } from '@common/validators/luhn.validator';

const StirDto = z.object({
  stir: z.string().regex(/^\d{9}$/, 'STIR 9 ta raqamdan iborat bo\'lishi kerak'),
});
const LuhnDto = z.object({
  cardNumber: z.string().regex(/^\d{16,19}$/, 'Karta raqami 16-19 ta raqamdan iborat bo\'lishi kerak'),
});

@ApiTags('Validators')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('validate')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class ValidateController {
  @Post('stir')
  @RequirePermission('validate:EXECUTE')
  @ApiOperation({ summary: 'STIR (O\'zbek INN) tekshiruvi — 9-raqamli format' })
  validateStir(@Body() body: unknown) {
    const { stir } = StirDto.parse(body);
    return validateStir(stir);
  }

  @Post('luhn')
  @RequirePermission('validate:EXECUTE')
  @ApiOperation({ summary: 'Luhn algoritmi — 16-19 raqamli karta raqami tekshiruvi' })
  validateLuhn(@Body() body: unknown) {
    const { cardNumber } = LuhnDto.parse(body);
    return validateLuhn(cardNumber);
  }
}
