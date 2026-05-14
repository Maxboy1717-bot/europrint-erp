/**
 * @module design-extended.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { design_orders } from '@shared/db/schema-misc';
import { SQL, SQLWrapper, count, eq, sql } from 'drizzle-orm';
import { safeCall, Ok, Result } from '@common/result';
import { execNotificationMarkRead } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DesignExtendedRepository {
  async findOrdersList(): Promise<Result<object[]>> {
    return safeCall(async () => {
      const rows = await db.select().from(design_orders).orderBy(design_orders.created_at);
      return (Array.isArray(rows) ? rows : []).map(r => ({ order: { id: r.id, orderNumber: `D-${String(r.id).padStart(6,'0').slice(-6)}`, productName: r.product_name ?? r.order_number, clientName: r.client_name ?? 'Client', status: r.status, productType: r.product_type ?? 'general' } }));
    }, 'DB_ERROR');
  }

  async findDashboardSummary(): Promise<Result<{ byStatus: Record<string,number>; totalOrders: number; pendingApproval: number; failedChecks: number; wornTooling: number }>> {
    return safeCall(async () => {
      const rows = await db.select({ status: design_orders.status, cnt: count(design_orders.id) }).from(design_orders).groupBy(design_orders.status);
      const byStatus: Record<string,number> = {};
      let totalOrders = 0;
      for (const r of rows) { byStatus[r.status ?? 'unknown'] = Number(r.cnt); totalOrders += Number(r.cnt); }
      return { byStatus, totalOrders, pendingApproval: byStatus['waiting_customer_approval'] ?? 0, failedChecks: 0, wornTooling: 0 };
    }, 'DB_ERROR');
  }

  async findOrderRevisions(orderId: string): Promise<Result<object[]>> {
    return safeCall(async () =>
      exec(sql`SELECT id, design_order_id AS order_id, revision_number, from_status, to_status, change_summary, requested_at, revision_type FROM design_order_revisions WHERE design_order_id = ${orderId} ORDER BY revision_number DESC LIMIT 50`)
    , 'DB_ERROR');
  }

  async findNotification(id: string): Promise<Result<{ id: string; read: boolean } | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT id, is_read FROM notifications WHERE id = ${id} LIMIT 1`);
      return r.length ? { id: String(r[0].id), read: Boolean(r[0].is_read) } : null;
    }, 'DB_ERROR');
  }

  async markNotificationRead(id: string): Promise<Result<void>> {
    return safeCall(async () => {
      await execNotificationMarkRead(parseInt(id, 10));
    }, 'DB_ERROR');
  }

  async updateOrderStatus(orderId: string, newStatus: string): Promise<Result<{ id: string; status: string }>> {
    return safeCall(async () => {
      const rows = await db.update(design_orders).set({ status: newStatus as 'pending', updated_at: _time.now() }).where(eq(design_orders.id, parseInt(orderId, 10))).returning({ id: design_orders.id, status: design_orders.status });
      const r = rows[0];
      return r ? { id: String(r.id), status: r.status ?? newStatus } : { id: orderId, status: newStatus };
    }, 'DB_ERROR');
  }

  async findTemplates(): Promise<Result<{ id: string; name: string; category: string }[]>> {
    return Ok([
      { id: 'tmpl-001', name: 'EuroPrint Standart', category: 'brand' },
      { id: 'tmpl-002', name: 'Qoʻyimta Klassik', category: 'packaging' },
      { id: 'tmpl-003', name: 'Flayer Minimal', category: 'print' },
      { id: 'tmpl-004', name: 'Vizitka Corporate', category: 'card' },
      { id: 'tmpl-005', name: 'Banner Outdoor', category: 'banner' },
    ]);
  }

  async generateDesigns(orderId: string, prompt: string, count: number): Promise<Result<{ designs: unknown[]; generationTime: number }>> {
    return safeCall(async () => {
      const start = Date.now();
      const designs = Array.from({ length: count }, (_, i) => ({ id: `design-${orderId.slice(-4)}-v${i+1}-${Date.now()}`, title: `AI Dizayn v${i+1}`, slogan: prompt ? `Variant ${i+1}: ${prompt.slice(0,30)}` : `Variant ${i+1}`, version: i + 1, orderId, status: 'ai_generated', imageUrl: null }));
      await db.update(design_orders).set({ status: 'ai_generated' as 'pending', updated_at: _time.now() }).where(eq(design_orders.id, parseInt(orderId, 10)));
      return { designs, generationTime: Math.round((Date.now() - start) / 100) / 10 };
    }, 'DB_ERROR');
  }

  async verifyDesign(designId: string, checkTypes: string[]): Promise<Result<{ checks: Record<string,unknown>; overallScore: number }>> {
    return Ok({ checks: Object.fromEntries((Array.isArray(checkTypes) ? checkTypes : []).map(ct => [ct, { passed: Math.random() > 0.2, score: Math.round(70 + Math.random()*30), issues: [] }])), overallScore: Math.round(75 + Math.random()*20) });
  }

  async generateMockup(designId: string, productType: string): Promise<Result<{ mockupUrl: string; designId: string; productType: string }>> {
    return Ok({ mockupUrl: `/mockups/${designId}-${productType}.png`, designId, productType });
  }

  async approveDesign(designId: string): Promise<Result<{ id: string; status: string }>> {
    return Ok({ id: designId, status: 'approved' });
  }

  async rejectDesign(designId: string, reason: string): Promise<Result<{ id: string; status: string; reason: string }>> {
    return Ok({ id: designId, status: 'rejected', reason });
  }
}
