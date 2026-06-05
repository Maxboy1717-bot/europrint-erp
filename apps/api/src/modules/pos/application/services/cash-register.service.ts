/**
 * @module cash-register.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { CashRegisterRepository, CreateProductInput, CreateTransactionInput, RetailTransaction } from '../../infrastructure/repositories/cash-register.repository';
import { z } from 'zod';

export const CreateProductSchema = z.object({
  barcode:       z.string().min(1),
  name:          z.string().min(1),
  nameRu:        z.string().optional(),
  category:      z.string().optional(),
  unitPrice:     z.number().positive(),
  unit:          z.string().optional(),
  stockQuantity: z.number().optional(),
  minStock:      z.number().optional(),
  imageUrl:      z.string().url().optional(),
});

export const CreateTransactionSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    name:      z.string(),
    quantity:  z.number().positive(),
  })).min(1),
  customerName:   z.string().optional(),
  paymentMethod:  z.enum(['cash', 'card', 'transfer', 'mixed']).default('cash'),
  paymentDetails: z.record(z.unknown()).optional(),
  discountAmount: z.number().min(0).default(0),
  notes:          z.string().optional(),
  taxRate:        z.number().min(0).max(100).default(12),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionSchema>;

@Injectable()
export class CashRegisterService {
  constructor(private readonly repo: CashRegisterRepository) {}

  async getProducts(search?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.findProducts(search);
      if (!result.ok) throw new BadRequestException(result.error.message);
      return (Array.isArray(result.data) ? result.data : []).map((p) => ({
        id:            p.id,
        barcode:       p.barcode,
        name:          p.name,
        nameRu:        p.name_ru,
        category:      p.category,
        unitPrice:     Number(p.unit_price),
        unit:          p.unit,
        stockQuantity: p.stock_quantity !== null ? Number(p.stock_quantity) : null,
        minStock:      p.min_stock !== null ? Number(p.min_stock) : null,
        isActive:      p.is_active,
        imageUrl:      p.image_url,
        createdAt:     p.created_at,
      }));
    });
  }

  async scanBarcode(barcode: string) {
    const result = await this.repo.findProductByBarcode(barcode);
    if (!result.ok) throw new BadRequestException(result.error.message);
    if (!result.data) throw new NotFoundException(`Barcode "${barcode}" topilmadi`);
    const p = result.data;
    return {
      id:            p.id,
      barcode:       p.barcode,
      name:          p.name,
      nameRu:        p.name_ru,
      category:      p.category,
      unitPrice:     Number(p.unit_price),
      unit:          p.unit,
      stockQuantity: p.stock_quantity !== null ? Number(p.stock_quantity) : null,
      minStock:      p.min_stock !== null ? Number(p.min_stock) : null,
      isActive:      p.is_active,
      imageUrl:      p.image_url,
      createdAt:     p.created_at,
    };
  }

  async addProduct(body: unknown, createdBy?: string) {
    const dto = CreateProductSchema.parse(body);
    const data: CreateProductInput = { ...dto, createdBy };
    const result = await this.repo.insertProduct(data);
    if (!result.ok) throw new BadRequestException(result.error.message);
    const p = result.data;
    return {
      id: p.id, barcode: p.barcode, name: p.name, nameRu: p.name_ru,
      unitPrice: Number(p.unit_price), unit: p.unit,
      stockQuantity: p.stock_quantity !== null ? Number(p.stock_quantity) : null,
      isActive: p.is_active, createdAt: p.created_at,
    };
  }

  async getTransactions() {
    const result = await this.repo.findTransactions();
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return (Array.isArray(result.data) ? result.data : []).map((t) => this.mapTransaction(t));
  }

  async createTransaction(body: unknown, cashierId?: string) {
    const dto = CreateTransactionSchema.parse(body);

    const resolvedItems: { productId: string; name: string; quantity: number; unitPrice: number; total: number }[] = [];
    for (const item of dto.items) {
      const productResult = await this.repo.findProductById(item.productId);
      if (!productResult.ok) throw new BadRequestException(productResult.error.message);
      if (!productResult.data) throw new NotFoundException(`Mahsulot "${item.productId}" topilmadi`);
      const unitPrice = Number(productResult.data.unit_price);
      resolvedItems.push({ productId: item.productId, name: item.name, quantity: item.quantity, unitPrice, total: unitPrice * item.quantity });
    }

    const subtotal     = (Array.isArray(resolvedItems) ? resolvedItems : []).reduce((sum, i) => sum + i.total, 0);
    const taxableBase  = Math.max(0, subtotal - dto.discountAmount);
    const taxAmount    = Math.round((taxableBase * dto.taxRate) / (100 + dto.taxRate));
    const totalAmount  = subtotal - dto.discountAmount;

    const data: CreateTransactionInput = {
      cashierId,
      customerName:   dto.customerName,
      items:          resolvedItems,
      subtotal,
      discountAmount: dto.discountAmount,
      taxRate:        dto.taxRate,
      taxAmount,
      totalAmount,
      paymentMethod:  dto.paymentMethod,
      paymentDetails: dto.paymentDetails,
      notes:          dto.notes,
    };
    // POS-1: Sotuv insert + stock decrement bitta atomik DB transaction (partial failure prevention)
    const result = await this.repo.insertTransactionAtomic(data, dto.items, cashierId);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return this.mapTransaction(result.data);
  }

  async getReceipt(id: string) {
    const result = await this.repo.findTransactionById(id);
    if (!result.ok) throw new BadRequestException(result.error.message);
    if (!result.data) throw new NotFoundException(`Chek #${id} topilmadi`);
    return {
      ...this.mapTransaction(result.data),
      companyName:    'EuroPrint LLC',
      companyAddress: 'Toshkent, O\'zbekiston',
      companyPhone:   '+998 71 000-00-00',
      companyInn:     '123456789',
      printedAt:      _time.now().toISOString(),
    };
  }

  async refundTransaction(id: string, refundedBy?: string) {
    const existing = await this.repo.findTransactionById(id);
    if (!existing.ok) throw new BadRequestException(existing.error.message);
    if (!existing.data) throw new NotFoundException(`Tranzaksiya #${id} topilmadi`);
    if (existing.data.status === 'refunded') throw new BadRequestException('Tranzaksiya allaqachon qaytarilgan');
    const result = await this.repo.refundTransaction(id, refundedBy);
    if (!result.ok) throw new BadRequestException(result.error.message);
    const items = (existing.data.items as { productId: string; quantity: number }[]) ?? [];
    await this.repo.incrementStock(items);
    return this.mapTransaction(result.data);
  }

  async getDashboard() {
    const result = await this.repo.getDashboard();
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return result.data;
  }

  /** Daily sales summary (count, total, payment-method breakdown) for GET /pos/sales/daily. */
  async getDailySales(date?: string) {
    const result = await this.repo.findDailySales(date);
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return result.data;
  }

  private mapTransaction(t: RetailTransaction) {
    return {
      id:                t.id,
      transactionNumber: t.transaction_number,
      receiptNumber:     t.receipt_number,
      cashierId:         t.cashier_id,
      customerName:      t.customer_name,
      customerId:        t.customer_id,
      items:             t.items as Record<string, unknown>[],
      subtotal:          Number(t.subtotal),
      discountAmount:    Number(t.discount_amount),
      taxRate:           Number(t.tax_rate),
      taxAmount:         Number(t.tax_amount),
      totalAmount:       Number(t.total_amount),
      paymentMethod:     t.payment_method,
      paymentDetails:    t.payment_details ?? {},
      status:            t.status,
      notes:             t.notes,
      createdAt:         t.created_at,
    };
  }
}
