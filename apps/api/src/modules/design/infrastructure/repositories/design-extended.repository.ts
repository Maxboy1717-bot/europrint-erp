/**
 * @module design-extended.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Design)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { design_orders } from '@shared/db/schema-misc';
import { SQL, SQLWrapper, count, eq, sql } from 'drizzle-orm';
import { safeCall, Ok, Result } from '@common/result';
import { execNotificationMarkRead } from '@common/database/queries-remaining';
import type { IDesignExtendedRepo } from '../../domain/repositories/i-design-extended.repo';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DesignExtendedRepository implements IDesignExtendedRepo {
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
    return safeCall(async () => {
      const rows = await exec(sql`
        SELECT id::text AS id, name, type AS category,
               file_url AS "fileUrl", thumbnail_url AS "thumbnailUrl",
               tags, status
        FROM design_library_items
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC LIMIT 100
      `);
      return rows as unknown as { id: string; name: string; category: string }[];
    });
  }

  async generateDesigns(orderId: string, prompt: string, count: number): Promise<Result<{ designs: unknown[]; generationTime: number }>> {
    return safeCall(async () => {
      const start = Date.now();
      const oid = parseInt(orderId, 10);
      // Was a green-lie: built Date.now() ids in memory, never saved. Persist each variant to `designs`.
      const saved: Row[] = [];
      for (let i = 1; i <= count; i++) {
        const designNumber = `DSN-${oid}-v${i}-${Date.now()}`;
        const slogan = prompt ? `Variant ${i}: ${prompt.slice(0, 60)}` : `Variant ${i}`;
        const rows = await exec(sql`
          INSERT INTO designs (order_id, design_number, version, title, slogan, status)
          VALUES (${oid}, ${designNumber}, ${i}, ${`AI Dizayn v${i}`}, ${slogan}, 'ai_generated')
          RETURNING id, order_id AS "orderId", design_number AS "designNumber", version, title, slogan, status, image_url AS "imageUrl"`);
        if (rows[0]) saved.push(rows[0]);
      }
      await db.update(design_orders).set({ status: 'ai_generated' as 'pending', updated_at: _time.now() }).where(eq(design_orders.id, oid));
      return { designs: saved, generationTime: Math.round((Date.now() - start) / 100) / 10 };
    }, 'DB_ERROR');
  }

  async verifyDesign(designId: string, checkTypes: string[]): Promise<Result<{ checks: Record<string,unknown>; overallScore: number }>> {
    // PLACEHOLDER — real sifat balli emas; designs jadvalida quality_score ustuni kerak
    // (deferred Faza 5). Hozirgi mantiq: dizayn holati bo'yicha deterministik ball.
    // Math.random() olib tashlandi (2026-06-06) — endi DB holatiga asoslanadi.
    // Multi-tier: approved=100 | ai_generated=70 | pending/rejected/boshqa=40
    return safeCall(async () => {
      const did = parseInt(designId, 10);
      const rows = await exec(sql`
        SELECT status FROM designs WHERE id = ${isNaN(did) ? 0 : did} LIMIT 1
      `);
      const status = rows[0] ? String(rows[0]['status'] ?? '') : '';
      const score = status === 'approved'     ? 100
                  : status === 'ai_generated' ? 70
                  : 40;
      const passed = score >= 70;
      const issues = passed ? [] : [`Dizayn "${status || 'topilmadi'}" holatida — tasdiqlangan emas`];
      const types  = Array.isArray(checkTypes) ? checkTypes : [];
      const checks = Object.fromEntries(types.map(ct => [ct, { passed, score, issues }]));
      return { checks, overallScore: types.length > 0 ? score : 0 };
    }, 'DB_ERROR');
  }

  async generateMockup(designId: string, productType: string): Promise<Result<{ mockupUrl: string; designId: string; productType: string }>> {
    return safeCall(async () => {
      const rows = await exec(sql`
        SELECT id::text AS id, image_url AS "imageUrl" FROM designs WHERE id = ${parseInt(designId, 10)}
      `);
      const r = rows[0];
      if (!r) throw new Error('Design topilmadi');
      // Use the stored image_url as the mockup source; real 3D rendering deferred.
      const mockupUrl = r['imageUrl'] ? String(r['imageUrl']) : `/mockups/${designId}-${productType}.png`;
      return { mockupUrl, designId, productType };
    }, 'DB_ERROR');
  }

  async approveDesign(designId: string): Promise<Result<{ id: string; status: string }>> {
    // Was an echo (no DB). Persist the approval to `designs`.
    return safeCall(async () => {
      const rows = await exec(sql`UPDATE designs SET status='approved' WHERE id=${parseInt(designId, 10)} RETURNING id, status`);
      const r = rows[0];
      if (!r) throw new Error('Design topilmadi');
      return { id: String(r.id), status: String(r.status) };
    }, 'DB_ERROR');
  }

  async rejectDesign(designId: string, reason: string): Promise<Result<{ id: string; status: string; reason: string }>> {
    // Was an echo (no DB). Persist the rejection + reason to `designs`.
    return safeCall(async () => {
      const rows = await exec(sql`UPDATE designs SET status='rejected', rejection_reason=${reason} WHERE id=${parseInt(designId, 10)} RETURNING id, status, rejection_reason`);
      const r = rows[0];
      if (!r) throw new Error('Design topilmadi');
      return { id: String(r.id), status: String(r.status), reason: String(r.rejection_reason ?? reason) };
    }, 'DB_ERROR');
  }
}
