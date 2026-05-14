/**
 * @module cash-register.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors, HttpCode, HttpStatus, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { PosAddProductSchema, PosAddProductDto, PosCreateTransactionSchema, PosCreateTransactionDto } from '../dto/pos-cash-register.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CashRegisterService } from '../services/cash-register.service';
import { unwrapOrInternal } from '@common/http-result';

interface AuthenticatedUser { id: number; role: string; }

@ApiTags('POS — Kassa (Cashier)')
@ApiBearerAuth()
@Roles('cashier', 'pos_manager', 'admin', 'manager')
@UseGuards(RolesGuard)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('pos')
export class CashRegisterController {
  constructor(private readonly svc: CashRegisterService) {}

  @Get('products')
  @ApiOperation({ summary: 'POS mahsulotlar ro\'yxati (kassa uchun)' })
  @ApiQuery({ name: 'search', required: false })
  async getProducts(@Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.getProducts(search));
  }

  @Post('products')
  @UsePipes(new ZodValidationPipe(PosAddProductSchema))
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi mahsulot qo\'shish' })
  async addProduct(@Body() body: PosAddProductDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.svc.addProduct(body, String(user.id)));
  }

  @Get('scan/:barcode')
  @ApiOperation({ summary: 'Barkod orqali mahsulot topish' })
  async scanBarcode(@Param('barcode') barcode: string) {
    return unwrapOrInternal(await this.svc.scanBarcode(barcode));
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Tranzaksiyalar ro\'yxati' })
  async getTransactions() {
    return unwrapOrInternal(await this.svc.getTransactions());
  }

  @Post('transactions')
  @UsePipes(new ZodValidationPipe(PosCreateTransactionSchema))
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi sotuv tranzaksiyasi' })
  async createTransaction(@Body() body: PosCreateTransactionDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.svc.createTransaction(body, String(user.id)));
  }

  @Post('transactions/:id/refund')
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tranzaksiyani qaytarish' })
  async refundTransaction(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.svc.refundTransaction(id, String(user.id)));
  }

  @Get('receipt/:id')
  @ApiOperation({ summary: 'Chek ma\'lumotlarini olish' })
  async getReceipt(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getReceipt(id));
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'POS dashboard statistikasi' })
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }
}
