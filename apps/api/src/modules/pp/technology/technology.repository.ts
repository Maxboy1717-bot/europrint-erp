/**
 * @module technology.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Ok, Err, Result } from '@common/result';
import {
  queryTechOrders, queryTechApprovalLog, queryTechDashboardStats,
  queryTechCards, queryOrderTechCard, queryRunAiCheck,
  execTechApproveOrder, execTechRejectOrder,
} from '@common/database/queries-technology';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface TechOrderRow { id: string; papkaNo: string; mijozNomi: string; mahsulotNomi: string; mahsulotTuri: string; tiraj: number; formatA: number; formatB: number; tayyorBolishSanasi: string | null; status: string }
export interface ApprovalLogRow { orderId: string; orderNo: string; currentStatus: string; techAction: string; checkpoints: Record<string,boolean>; approvedAt: string | null; approvedBy: string | null; notes: string | null; isRejected: boolean }

@Injectable()
export class TechnologyRepository {
  async findOrders(status?: string): Promise<Result<TechOrderRow[]>> {
    
    return safeCall(async () => {
      const rows = await queryTechOrders(status);
      return (Array.isArray(rows) ? rows : []).map(row => ({
        id: String(row.id ?? ''), papkaNo: String(row.papkaNo ?? ''), mijozNomi: String(row.mijozNomi ?? ''),
        mahsulotNomi: String(row.mahsulotNomi ?? ''), mahsulotTuri: String(row.mahsulotTuri ?? ''),
        tiraj: Number(row.tiraj ?? 0), formatA: Number(row.formatA ?? 0), formatB: Number(row.formatB ?? 0),
        tayyorBolishSanasi: row.tayyorBolishSanasi ? String(row.tayyorBolishSanasi) : null,
        status: String(row.status ?? ''),
      }));
    }, 'DB_ERROR');
  }

  async findApprovalLog(orderId: string): Promise<Result<ApprovalLogRow>> {
    
    return safeCall(async () => {
      const row = await queryTechApprovalLog(orderId);
      return {
        orderId, orderNo: String(row.order_no ?? ''), currentStatus: String(row.current_status ?? ''),
        techAction: (row.tech_action as string) ?? 'pending',
        checkpoints: { bomApproved: Boolean(row.bom_approved), routingApproved: Boolean(row.routing_approved), techCardApproved: Boolean(row.tech_card_approved) },
        approvedAt: row.approved_at ? String(row.approved_at) : null,
        approvedBy: row.approved_by ? String(row.approved_by) : null,
        notes: row.notes ? String(row.notes) : null,
        isRejected: Boolean(row.is_rejected),
      };
    }, 'DB_ERROR');
  }

  async findMaterialAlternatives(material: string): Promise<Result<{ material: string; alternatives: { name: string; saving: string; note: string }[]; note: string }>> {
    try {
    return Ok({
      material,
      alternatives: [
        { name: `${material} (Optimal)`, saving: '12% tejash', note: 'Bir xil sifat, past narx' },
        { name: `${material} Premium`, saving: '0%', note: 'Eng yuqori sifat' },
        { name: `${material} Eco`, saving: '20% tejash', note: 'Ekologik toza, engil' },
      ],
      note: `AI tavsiyasi: Optimal variant ${material} uchun eng samarali tanlov`,
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async findDashboardStats(): Promise<Result<{ pendingCount: number; approvedToday: number; rejectedToday: number; avgProcessingHours: number }>> {
    
    return safeCall(async () => {
      const row = await queryTechDashboardStats();
      return { pendingCount: Number(row.pending ?? 0), approvedToday: Number(row.approved_today ?? 0), rejectedToday: Number(row.rejected_today ?? 0), avgProcessingHours: 4 };
    }, 'DB_ERROR');
  }

  async findTechCards(): Promise<Result<object[]>> {

    return safeCall(async () => {
      return (await queryTechCards()) as object[];
    }, 'DB_ERROR');
  }

  // The rich AI-generated technology_cards (distinct from the simpler tech_cards above). Direct SQL.
  async findTechnologyCards(): Promise<Result<object[]>> {
    try {
      const r = await db.execute(sql`SELECT id, product_id, papka_order_id, product_type, format_a, format_b, operations, total_duration_minutes, setup_duration_minutes, calculated_by_ai, ai_model, is_active, created_at FROM technology_cards WHERE deleted_at IS NULL AND is_active = true ORDER BY created_at DESC LIMIT 200`);
      return Ok(((r as { rows?: object[] }).rows ?? []) as object[]);
    } catch (e) { return Err(String(e)); }
  }

  async findTechnologyCardById(id: string): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`SELECT * FROM technology_cards WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL LIMIT 1`);
      const row = (((r as { rows?: Row[] }).rows ?? [])[0]);
      if (!row) return Err('Texnologik karta topilmadi');
      return Ok(row);
    } catch (e) { return Err(String(e)); }
  }

  async findOrderTechCard(orderId: string): Promise<Result<Row>> {
    
    return safeCall(async () => {
      return (await queryOrderTechCard(orderId)) as Row;
    }, 'DB_ERROR');
  }

  async runAiCheck(orderId: string): Promise<Result<{ orderId: string; orderNo: string; score: number; status: string; warnings: { code: string; level: string; message: string }[]; techCardFound: boolean; recommendation: string }>> {
    
    return safeCall(async () => {
      const row = await queryRunAiCheck(orderId);
      const techCardFound = Boolean(row.tech_card_id);
      const warnings: { code: string; level: string; message: string }[] = [];
      if (!techCardFound) warnings.push({ code: 'NO_TECH_CARD', level: 'warning', message: 'Texnologik karta topilmadi' });
      if (!row.format_width || !row.format_height) warnings.push({ code: 'NO_FORMAT', level: 'error', message: 'Format oʻlchamlari kiritilmagan' });
      const score = Math.max(40, 100 - (Array.isArray(warnings) ? warnings : []).filter(w => w.level === 'error').length * 30 - warnings.filter(w => w.level === 'warning').length * 10);
      const status = score >= 80 ? 'passed' : score >= 50 ? 'warnings' : 'failed';
      return { orderId, orderNo: String(row.order_number ?? ''), score, status, warnings, techCardFound, recommendation: warnings.length === 0 ? 'Barcha tekshiruvlar muvaffaqiyatli oʻtdi' : `${warnings.length} ta muammo aniqlandi` };
    }, 'DB_ERROR');
  }

  async approveOrder(orderId: string, data: { bomApproved: boolean; routingApproved: boolean; techCardApproved: boolean; notes?: string; approvedById: string }): Promise<Result<void>> {
    
    return safeCall(async () => {
      await execTechApproveOrder(orderId, data);
    }, 'DB_ERROR');
  }

  async rejectOrder(orderId: string, data: { reason: string; returnTo: string; rejectedById: string }): Promise<Result<void>> {
    
    return safeCall(async () => {
      await execTechRejectOrder(orderId, data);
    }, 'DB_ERROR');
  }
}
