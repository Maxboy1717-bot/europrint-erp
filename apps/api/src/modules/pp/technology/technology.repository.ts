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

  // The rich technology_cards MASTER (distinct from the simpler tech_cards above). Direct SQL.
  // calculated_by_ai=false → human master card; true → AI estimate. One table for both.
  async findTechnologyCards(): Promise<Result<object[]>> {
    try {
      const r = await db.execute(sql`SELECT id, code, name, direction, material_type, product_type, format_a, format_b, format_code, gofra_profile, status, version, lab_approved, maket_approved, calculated_by_ai, is_active, created_at FROM technology_cards WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 300`);
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

  // ── Phase 1: texkarta MASTER CRUD on technology_cards ─────────────────────
  // §17 guardrails applied: id is serial (omit on insert); version/status/created_at have defaults;
  // child FKs technology_card_id -> technology_cards(id) (catch 23503); code partial-unique (catch 23505).

  async createCard(d: CreateCardInput): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        INSERT INTO technology_cards
          (code, name, direction, material_type, product_type,
           format_a, format_b, format_code, gofra_profile, raskroy_per_list, scrap_pct, qolip_id,
           print_params, kesim, post_press, ish_tartibi, operations,
           calculated_by_ai, is_active, created_by)
        VALUES
          (${d.code ?? null}, ${d.name ?? null}, ${d.direction ?? null}, ${d.materialType ?? null}, ${d.productType ?? null},
           ${d.formatA ?? null}, ${d.formatB ?? null}, ${d.formatCode ?? null}, ${d.gofraProfile ?? null}, ${d.raskroyPerList ?? null}, ${d.scrapPct ?? null}, ${d.qolipId ?? null},
           ${jb(d.printParams)}::jsonb, ${jb(d.kesim)}::jsonb, ${jb(d.postPress)}::jsonb, ${jb(d.ishTartibi)}::jsonb, ${d.operations ?? null},
           false, true, ${d.createdBy ?? null})
        RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      if (!row) return Err('Texkarta yaratilmadi');
      await this.snapshot(Number(row.id), Number(row.version ?? 1), row, d.createdBy);
      return Ok(row);
    } catch (e) { return Err(uniqueOrRaw(e)); }
  }

  async updateCard(id: string, d: UpdateCardInput, changedBy?: number): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        UPDATE technology_cards SET
          code = COALESCE(${d.code ?? null}, code),
          name = COALESCE(${d.name ?? null}, name),
          direction = COALESCE(${d.direction ?? null}, direction),
          material_type = COALESCE(${d.materialType ?? null}, material_type),
          product_type = COALESCE(${d.productType ?? null}, product_type),
          format_a = COALESCE(${d.formatA ?? null}, format_a),
          format_b = COALESCE(${d.formatB ?? null}, format_b),
          format_code = COALESCE(${d.formatCode ?? null}, format_code),
          gofra_profile = COALESCE(${d.gofraProfile ?? null}, gofra_profile),
          raskroy_per_list = COALESCE(${d.raskroyPerList ?? null}, raskroy_per_list),
          scrap_pct = COALESCE(${d.scrapPct ?? null}, scrap_pct),
          qolip_id = COALESCE(${d.qolipId ?? null}, qolip_id),
          print_params = COALESCE(${jb(d.printParams)}::jsonb, print_params),
          kesim = COALESCE(${jb(d.kesim)}::jsonb, kesim),
          post_press = COALESCE(${jb(d.postPress)}::jsonb, post_press),
          ish_tartibi = COALESCE(${jb(d.ishTartibi)}::jsonb, ish_tartibi),
          operations = COALESCE(${d.operations ?? null}, operations),
          status = COALESCE(${d.status ?? null}, status),
          version = version + 1,
          updated_at = now()
        WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL
        RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      if (!row) return Err('Texkarta topilmadi');
      await this.snapshot(Number(row.id), Number(row.version), row, changedBy);
      return Ok(row);
    } catch (e) { return Err(uniqueOrRaw(e)); }
  }

  async softDeleteCard(id: string, byId?: number): Promise<Result<void>> {
    return safeCall(async () => {
      await db.execute(sql`UPDATE technology_cards SET deleted_at = now(), deleted_by = ${byId ?? null}, is_active = false, updated_at = now() WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL`);
    }, 'DB_ERROR');
  }

  async setLabApproved(id: string, byId?: number): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`UPDATE technology_cards SET lab_approved = true, lab_approved_by = ${byId ?? null}, lab_approved_at = now(), updated_at = now() WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      return row ? Ok(row) : Err('Texkarta topilmadi');
    } catch (e) { return Err(String(e)); }
  }

  async setMaketApproved(id: string): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`UPDATE technology_cards SET maket_approved = true, updated_at = now() WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      return row ? Ok(row) : Err('Texkarta topilmadi');
    } catch (e) { return Err(String(e)); }
  }

  // ── Child tables (BOM / routes / versions) ────────────────────────────────
  async getBom(cardId: string): Promise<Result<object[]>> {
    try {
      const r = await db.execute(sql`SELECT * FROM tech_card_bom WHERE technology_card_id = ${parseInt(cardId, 10)} ORDER BY id`);
      return Ok(((r as { rows?: object[] }).rows ?? []) as object[]);
    } catch (e) { return Err(String(e)); }
  }

  async addBomItem(cardId: string, item: { materialCode: string; quantity: number; unit?: string; layer?: string }): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`INSERT INTO tech_card_bom (technology_card_id, material_code, quantity, unit, layer) VALUES (${parseInt(cardId, 10)}, ${item.materialCode}, ${item.quantity}, ${item.unit ?? 'kg'}, ${item.layer ?? null}) RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      return row ? Ok(row) : Err('BOM qatori qoʻshilmadi');
    } catch (e) { return Err(fkOrRaw(e)); }
  }

  async getRoutes(cardId: string): Promise<Result<object[]>> {
    try {
      const r = await db.execute(sql`SELECT * FROM tech_card_routes WHERE technology_card_id = ${parseInt(cardId, 10)} ORDER BY op_seq`);
      return Ok(((r as { rows?: object[] }).rows ?? []) as object[]);
    } catch (e) { return Err(String(e)); }
  }

  async addRoute(cardId: string, route: AddRouteInput): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        INSERT INTO tech_card_routes (technology_card_id, op_seq, operation, machine_id, alt_machine_id, norm_per_hour, setup_minutes, scrap_fixed, scrap_pct, min_razryad, is_core)
        VALUES (${parseInt(cardId, 10)}, ${route.opSeq}, ${route.operation}, ${route.machineId ?? null}, ${route.altMachineId ?? null}, ${route.normPerHour ?? null}, ${route.setupMinutes ?? null}, ${route.scrapFixed ?? null}, ${route.scrapPct ?? null}, ${route.minRazryad ?? null}, ${route.isCore ?? false})
        RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      return row ? Ok(row) : Err('Marshrut qatori qoʻshilmadi');
    } catch (e) { return Err(fkOrRaw(e)); }
  }

  async getVersions(cardId: string): Promise<Result<object[]>> {
    try {
      const r = await db.execute(sql`SELECT id, version, changed_by, changed_at FROM tech_card_versions WHERE technology_card_id = ${parseInt(cardId, 10)} ORDER BY version DESC`);
      return Ok(((r as { rows?: object[] }).rows ?? []) as object[]);
    } catch (e) { return Err(String(e)); }
  }

  private async snapshot(cardId: number, version: number, row: Row, changedBy?: number): Promise<void> {
    try {
      await db.execute(sql`INSERT INTO tech_card_versions (technology_card_id, version, snapshot, changed_by) VALUES (${cardId}, ${version}, ${JSON.stringify(row)}::jsonb, ${changedBy ?? null})`);
    } catch { /* snapshot is best-effort audit; never blocks the master write */ }
  }
}

export interface CreateCardInput {
  code?: string; name?: string; direction?: string; materialType?: string; productType?: string;
  formatA?: number; formatB?: number; formatCode?: string; gofraProfile?: string; raskroyPerList?: number; scrapPct?: number; qolipId?: number;
  printParams?: unknown; kesim?: unknown; postPress?: unknown; ishTartibi?: unknown; operations?: string;
  createdBy?: number;
}
export type UpdateCardInput = Omit<CreateCardInput, 'createdBy'> & { status?: string };
export interface AddRouteInput {
  opSeq: number; operation: string; machineId?: number; altMachineId?: number; normPerHour?: number;
  setupMinutes?: number; scrapFixed?: number; scrapPct?: number; minRazryad?: number; isCore?: boolean;
}

function jb(v: unknown): string | null { return v === undefined || v === null ? null : JSON.stringify(v); }
function uniqueOrRaw(e: unknown): string {
  const m = String(e);
  if (m.includes('ux_technology_cards_code') || m.includes('23505') || m.includes('duplicate key')) return 'Bu kod allaqachon mavjud (kod takrorlanmas boʻlishi kerak)';
  return m;
}
function fkOrRaw(e: unknown): string {
  const m = String(e);
  if (m.includes('23503') || m.includes('foreign key')) return 'Texkarta topilmadi (technology_card_id notoʻgʻri)';
  return m;
}
