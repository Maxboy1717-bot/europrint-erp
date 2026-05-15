/**
 * @module ecommerce.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DELIVERY_FREE_THRESHOLD_UZS, DELIVERY_FEE_UZS } from '@common/constants/app.constants';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { LEAD_SUB_SOURCE } from '@common/constants/lead-sources.constants';
import { safeCall, Result, AppError } from '@common/result';
import { EcommerceRepository } from './ecommerce.repository';
import {
  ecommerceListProducts, ecommerceGetProduct, ecommerceCreateProduct, ecommerceUpdateProduct,
  ecommerceListCategories, ecommerceGetCategoryById, ecommerceCreateCategory, ecommerceUpdateCategory,
  ecommerceCheckCategoryEmpty, ecommerceGetPublicCategories, ecommerceGetPublicProductBySlug,
} from './ecommerce-catalog.helper';
import type {
  WebsiteOrderEvent,
  WebsiteContactEvent,
} from '../crm/listeners/website-lead-events.payload';

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 20;

function parseSafeLimit(raw: unknown, def = DEFAULT_PAGE_LIMIT): number {
  return Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(String(raw)) || def));
}

@Injectable()
export class EcommerceService {
  constructor(
    private readonly repo: EcommerceRepository,
    private readonly events: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  async listCustomers(query: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const page = parseInt(String(query.page)) || 1;
      const limit = parseSafeLimit(query.limit);
      const offset = (page - 1) * limit;
      const search = query.search as string;
      const verified = query.verified as string;
      const whereClause = this.repo.buildCustomerWhereClause(search, verified);
      const customersR = await this.repo.listCustomers(whereClause, limit, offset);
      const { customers, total } = (customersR.ok ? customersR.data : { customers: [], total: 0 }) as { customers: Record<string, unknown>[]; total: number };
      return {
        customers: (Array.isArray(customers) ? customers : []).map((c) => ({ ...c, passwordHash: undefined as (string | undefined), verificationCode: undefined as (string | undefined) })),
        pagination: { page, limit, total, totalPages: Math.ceil(Number(total) / limit) },
      };
    });
  }

  async getCustomer(id: string) {
    return safeCall(async () => {
      const customerR = await this.repo.getCustomer(parseInt(id));
      const [ordersR, orderStatsR] = await Promise.all([
        this.repo.getCustomerOrders(id),
        this.repo.getCustomerOrderStats(id),
      ]);
      const customerRow = (customerR.ok ? customerR.data : {}) as Record<string, unknown>;
      const orders = ordersR.ok ? ordersR.data : [];
      const orderStats = (orderStatsR.ok ? orderStatsR.data : {}) as { totalOrders?: number; totalSpent?: number };
      const { passwordHash: _pw, verificationCode: _vc, ...safeCustomer } = customerRow as { passwordHash?: unknown; verificationCode?: unknown } & Record<string, unknown>;
      return { ...safeCustomer, recentOrders: orders, stats: { totalOrders: orderStats?.totalOrders || 0, totalSpent: orderStats?.totalSpent || 0 } };
    });
  }

  async updateCustomer(id: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const { fullName, companyName, inn, address, isVerified, email, phone } = body;
      const updateData: Record<string, unknown> = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (companyName !== undefined) updateData.companyName = companyName;
      if (inn !== undefined) updateData.inn = inn;
      if (address !== undefined) updateData.address = address;
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      const updatedR = await this.repo.updateCustomer(parseInt(id), updateData);
      const updated = (updatedR.ok ? updatedR.data : {}) as Record<string, unknown> & { passwordHash?: unknown; verificationCode?: unknown };
      const { passwordHash: _pw, verificationCode: _vc, ...safeUpdated } = updated;
      return safeUpdated;
    });
  }

  async getStats() {
    return this.repo.getStats();
  }

  async listOrders(query: Record<string, unknown>) {
    return safeCall(async () => {
      const page = parseInt(String(query.page || '1')) || 1;
      const limit = parseSafeLimit(query.limit);
      const offset = (page - 1) * limit;
      const whereClause = this.repo.buildOrderWhereClause(
        query.status as string | undefined,
        query.paymentStatus as string | undefined,
        query.customerId as string | undefined,
        query.search as string | undefined,
      );
      const ordersR = await this.repo.listOrders(whereClause, limit, offset);
      const { orders, total } = (ordersR.ok ? ordersR.data : { orders: [], total: 0 }) as { orders: unknown[]; total: number };
      return { orders, pagination: { page, limit, total, totalPages: Math.ceil(Number(total) / limit) } };
    });
  }

  async getOrder(id: string) {
    return this.repo.getOrder(parseInt(id));
  }

  async updateOrderStatus(id: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const status = body.status as string | undefined;
      const paymentStatus = body.paymentStatus as string | undefined;
      const validStatuses = ['new', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled'];
      const validPaymentStatuses = ['pending', 'paid', 'refunded'];
      if (status && !validStatuses.includes(status)) throw new BadRequestException("Noto'g'ri buyurtma holati");
      if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) throw new BadRequestException("Noto'g'ri to'lov holati");
      const updateData: Record<string, unknown> = { updatedAt: _time.now() };
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      return this.repo.updateOrderStatus(parseInt(id), updateData);
    });
  }

  async updateOrder(id: string, body: Record<string, unknown>) {
    return safeCall(() => this.repo.updateOrder(parseInt(id), body));
  }

  async listProducts(q: Record<string, unknown>) { return ecommerceListProducts(q); }
  async getProduct(id: string) { return ecommerceGetProduct(id); }
  async createProduct(body: Record<string, unknown>) { return ecommerceCreateProduct(body); }
  async updateProduct(id: string, body: Record<string, unknown>) { return ecommerceUpdateProduct(id, body); }
  async listCategories() { return ecommerceListCategories(); }
  async getCategoryById(id: string) { return ecommerceGetCategoryById(id); }
  async createCategory(body: Record<string, unknown>) { return ecommerceCreateCategory(body); }
  async updateCategory(id: string, body: Record<string, unknown>) { return ecommerceUpdateCategory(id, body); }
  async checkCategoryEmpty(id: string) { return ecommerceCheckCategoryEmpty(id); }
  async getPublicCategories() { return ecommerceGetPublicCategories(); }
  async getPublicProductBySlug(slug: string) { return ecommerceGetPublicProductBySlug(slug); }

  async createPublicOrderFromBody(body: Record<string, unknown>, loggerRef: { error: (msg: string, ctx: unknown) => void }) {
    return safeCall(async () => {
      const customerName = body['customerName'] as string | undefined;
      const customerPhone = body['customerPhone'] as string | undefined;
      const customerEmail = body['customerEmail'] as string | undefined;
      const deliveryAddress = body['deliveryAddress'] as string | undefined;
      const deliveryCity = body['deliveryCity'] as string | undefined;
      const notes = body['notes'] as string | undefined;
      const paymentMethod = body['paymentMethod'] as string | undefined;
      const items = body['items'] as { name?: string; title?: string }[];
      const totalAmount = body['totalAmount'] as number | string | undefined;

      if (!customerPhone || !items || items.length === 0) {
        throw new BadRequestException(await this.i18n.t('errors.phoneAndItemsRequired'));
      }

      const seqR = await this.repo.generateSequenceNumber('EP');
      const orderNumber = seqR.ok ? (seqR.data as string) : '';
      const subtotal = typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount ?? '0') || 0;
      const deliveryFee = subtotal >= DELIVERY_FREE_THRESHOLD_UZS ? 0 : DELIVERY_FEE_UZS;
      const total = subtotal + deliveryFee;

      const orderR = await this.repo.insertOrder({
        orderNumber,
        guestName: customerName,
        guestPhone: customerPhone,
        guestEmail: customerEmail || null,
        deliveryAddress: deliveryCity ? `${deliveryCity}, ${deliveryAddress}` : deliveryAddress,
        deliveryMethod: 'delivery',
        paymentMethod: paymentMethod || 'cash',
        status: 'new',
        paymentStatus: 'pending',
        items,
        subtotal,
        deliveryFee,
        total,
        notes: notes || null,
      });
      const order = (orderR.ok ? orderR.data : {}) as { id?: number; orderNumber?: string };

      // Trigger 21 — saytdan buyurtma → CRM Lead listener'i ushlaydi
      if (typeof order?.id === 'number' && typeof order?.orderNumber === 'string') {
        const payload: WebsiteOrderEvent = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: customerName ?? null,
          customerPhone,
          customerEmail: customerEmail ?? null,
          totalAmount: total,
          itemsCount: Array.isArray(items) ? items.length : 0,
          deliveryCity: deliveryCity ?? null,
          paymentMethod: paymentMethod ?? null,
          subSource: LEAD_SUB_SOURCE.WEBSITE_ORDER,
          occurredAt: _time.now().toISOString(),
        };
        this.events.emit(ERP_EVENTS.WEBSITE_ORDER_CREATED, payload);
      }

      return { orderId: order?.id, orderNumber: order?.orderNumber };
    });
  }

  /**
   * Trigger 22 — Saytda aloqa formasi yuborilganda chaqiriladi.
   * Faqat event emit qiladi — listener CRM lead yaratadi.
   */
  emitWebsiteContact(event: Omit<WebsiteContactEvent, 'occurredAt'>): void {
    const payload: WebsiteContactEvent = {
      ...event,
      occurredAt: _time.now().toISOString(),
    };
    this.events.emit(ERP_EVENTS.WEBSITE_CONTACT_SUBMITTED, payload);
  }

  async generateSequenceNumber(prefix: string): Promise<Result<string, AppError>> {
    return this.repo.generateSequenceNumber(prefix);
  }
}
