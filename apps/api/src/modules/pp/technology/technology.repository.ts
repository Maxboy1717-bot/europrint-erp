/**
 * @module technology.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Ok, Err, Result, AppErr } from '@common/result';
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
      // 1. Find the base material row by name (ILIKE — user may pass partial name)
      const baseR = await db.execute(sql`
        SELECT id, xom_ashyo, unit_price, grammage, category, material_type
        FROM material_cards
        WHERE xom_ashyo ILIKE ${'%' + material.trim() + '%'}
          AND is_active = true
          AND unit_price IS NOT NULL
        ORDER BY length(xom_ashyo)
        LIMIT 1
      `);
      const baseRows = (baseR as { rows?: Record<string, unknown>[] }).rows ?? [];
      const base = baseRows[0] ?? null;
      const basePrice = base ? Number(base['unit_price']) : 0;

      // 2. Find alternatives in same category OR material_type (excluding the base itself)
      //    Fallback: if category/material_type is NULL or no base found, query all materials ILIKE
      const altR = await db.execute(
        base && (base['category'] || base['material_type'])
          ? sql`
              SELECT id, xom_ashyo, unit_price, grammage, category, material_type
              FROM material_cards
              WHERE (category = ${base['category'] ?? null} OR material_type = ${base['material_type'] ?? null})
                AND is_active = true
                AND unit_price IS NOT NULL
                AND id != ${Number(base['id'])}
              ORDER BY unit_price ASC
              LIMIT 5
            `
          : sql`
              SELECT id, xom_ashyo, unit_price, grammage, category, material_type
              FROM material_cards
              WHERE xom_ashyo ILIKE ${'%' + material.trim() + '%'}
                AND is_active = true
                AND unit_price IS NOT NULL
              ORDER BY unit_price ASC
              LIMIT 5
            `,
      );
      const altRows = (altR as { rows?: Record<string, unknown>[] }).rows ?? [];

      const alternatives = altRows.map(row => {
        const altPrice = Number(row['unit_price']);
        const savingPct =
          basePrice > 0 && altPrice > 0
            ? Math.round(((basePrice - altPrice) / basePrice) * 100)
            : 0;
        const saving =
          savingPct > 0
            ? `${savingPct}% tejash`
            : savingPct < 0
              ? `${Math.abs(savingPct)}% qimmat`
              : 'bir xil narx';
        const grammageNote = row['grammage'] ? ` ${Number(row['grammage'])}g/m²` : '';
        const note = `${row['category'] ?? row['material_type'] ?? ''}${grammageNote}`.trim() || 'Material katalogdan';
        return { name: String(row['xom_ashyo'] ?? ''), saving, note };
      });

      const baseName = base ? String(base['xom_ashyo']) : material;
      const noteText =
        alternatives.length > 0
          ? `${alternatives.length} ta alternativ material topildi`
          : 'Bir xil kategoriyada boshqa material topilmadi';

      return Ok({ material: baseName, alternatives, note: noteText });
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
          (product_id, code, name, direction, material_type, product_type,
           format_a, format_b, format_code, gofra_profile, raskroy_per_list, scrap_pct, qolip_id,
           print_params, kesim, post_press, ish_tartibi, operations,
           calculated_by_ai, is_active, created_by)
        VALUES
          (${d.productId ?? null}, ${d.code ?? null}, ${d.name ?? null}, ${d.direction ?? null}, ${d.materialType ?? null}, ${d.productType ?? null},
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
      // EP-PP-131 — keep the enum in sync with the legacy boolean (direct approve = draft/sent -> approved).
      const r = await db.execute(sql`UPDATE technology_cards SET maket_approved = true, maket_status = 'approved', updated_at = now() WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      return row ? Ok(row) : Err('Texkarta topilmadi');
    } catch (e) { return Err(String(e)); }
  }

  /**
   * EP-PP-131 (§07 #131) — Maket holat sikli + avto muddat surish (dorabotka).
   * 'send': draft/revision_requested -> sent; a re-send (from revision_requested) accrues the
   * elapsed revision minutes into maket_revision_minutes (= auto deadline shift for the factory).
   * 'request_revision': sent -> revision_requested; starts the shift clock (maket_revision_started_at).
   * Guarded transitions — CONFLICT on an invalid source state, NOT_FOUND when the card is missing.
   */
  async advanceMaket(id: string, action: 'send' | 'request_revision'): Promise<Result<Row>> {
    const cardId = parseInt(id, 10);
    if (!Number.isFinite(cardId)) return Err(AppErr('VALIDATION', "Texkarta id noto'g'ri"));
    try {
      const r = (action === 'send'
        ? await db.execute(sql`
            UPDATE technology_cards
               SET maket_status = 'sent',
                   maket_sent_at = now(),
                   maket_revision_minutes = maket_revision_minutes
                     + COALESCE(CASE WHEN maket_status = 'revision_requested' AND maket_revision_started_at IS NOT NULL
                            THEN CEIL(EXTRACT(EPOCH FROM (now() - maket_revision_started_at)) / 60.0) ELSE 0 END, 0),
                   maket_revision_started_at = NULL,
                   updated_at = now()
             WHERE id = ${cardId} AND deleted_at IS NULL AND maket_status IN ('draft','revision_requested')
             RETURNING *`)
        : await db.execute(sql`
            UPDATE technology_cards
               SET maket_status = 'revision_requested',
                   maket_revision_started_at = now(),
                   updated_at = now()
             WHERE id = ${cardId} AND deleted_at IS NULL AND maket_status = 'sent'
             RETURNING *`)) as { rows?: Row[] };
      const row = (r.rows ?? [])[0];
      if (row) return Ok(row);
      const exist = (await db.execute(sql`SELECT maket_status FROM technology_cards WHERE id = ${cardId} AND deleted_at IS NULL LIMIT 1`)) as { rows?: Row[] };
      const cur = (exist.rows ?? [])[0];
      if (!cur) return Err(AppErr('NOT_FOUND', 'Texkarta topilmadi'));
      return Err(AppErr('CONFLICT', `Maket holati '${String(cur.maket_status)}' dan '${action}' amalini bajarib bo'lmaydi`));
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  /**
   * EP-PP-104 (§07 #110) — Takror buyurtmada eng oxirgi TASDIQLANGAN texkartani klonlash.
   * Repeat order: find the latest lab-approved technology_cards row for a product and clone it
   * (full spec copy) onto the new order — "instead of a fresh technolog pass". Single atomic
   * INSERT ... SELECT (no separate read → no race). Approval provenance (lab_approved / _by / _at,
   * maket_approved, status) is carried forward from the source; version resets to 1 (new card's own
   * chain); code is de-duplicated with an -R<epoch> suffix to respect ux_technology_cards_code.
   */
  async cloneLatestApproved(productId: number, opts?: { papkaOrderId?: number; createdBy?: number }): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        INSERT INTO technology_cards
          (product_id, papka_order_id, code, name, direction, material_type, product_type,
           format_a, format_b, format_code, gofra_profile, raskroy_per_list, scrap_pct, qolip_id,
           print_params, kesim, post_press, ish_tartibi, operations,
           total_duration_minutes, setup_duration_minutes,
           status, lab_approved, lab_approved_by, lab_approved_at, maket_approved,
           calculated_by_ai, is_active, created_by)
        SELECT
          product_id, ${opts?.papkaOrderId ?? null},
          CASE WHEN code IS NULL THEN NULL ELSE code || '-R' || (extract(epoch from now())::bigint)::text END,
          name, direction, material_type, product_type,
          format_a, format_b, format_code, gofra_profile, raskroy_per_list, scrap_pct, qolip_id,
          print_params, kesim, post_press, ish_tartibi, operations,
          total_duration_minutes, setup_duration_minutes,
          status, lab_approved, lab_approved_by, lab_approved_at, maket_approved,
          false, true, ${opts?.createdBy ?? null}
        FROM technology_cards
        WHERE product_id = ${productId} AND lab_approved = true AND deleted_at IS NULL
        ORDER BY version DESC
        LIMIT 1
        RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      if (!row) return Err(AppErr('NOT_FOUND', 'Bu mahsulot uchun tasdiqlangan texkarta topilmadi'));
      await this.snapshot(Number(row.id), Number(row.version), row, opts?.createdBy);
      return Ok(row);
    } catch (e) { return Err(uniqueOrRaw(e)); }
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

  /**
   * EP-PP-119 (§07 #125) — External-stage lead-time roll-up. External route steps
   * (is_external=true) don't occupy a work center; each contributes external_lead_time_hours
   * to the card's total lead time. Sums those hours + counts internal vs external ops so the
   * planner can add external lead time to the schedule without allocating machine capacity.
   * All-internal / empty card -> 0 hours (= current behavior).
   */
  async getRouteLeadTime(cardId: string): Promise<Result<{ internalOps: number; externalOps: number; externalLeadTimeHours: number }>> {
    try {
      const r = await db.execute(sql`
        SELECT
          count(*) FILTER (WHERE is_external = false) AS internal_ops,
          count(*) FILTER (WHERE is_external = true)  AS external_ops,
          COALESCE(sum(external_lead_time_hours) FILTER (WHERE is_external = true), 0) AS external_lead_time_hours
        FROM tech_card_routes
        WHERE technology_card_id = ${parseInt(cardId, 10)}`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      if (!row) return Err(AppErr('NOT_FOUND', 'Marshrut topilmadi'));
      return Ok({
        internalOps: Number(row.internal_ops ?? 0),
        externalOps: Number(row.external_ops ?? 0),
        externalLeadTimeHours: Number(row.external_lead_time_hours ?? 0),
      });
    } catch (e) { return Err(AppErr('DB_ERROR', String(e))); }
  }

  async addRoute(cardId: string, route: AddRouteInput): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        INSERT INTO tech_card_routes (technology_card_id, op_seq, operation, machine_id, alt_machine_id, norm_per_hour, setup_minutes, scrap_fixed, scrap_pct, min_razryad, is_core, operation_subtype, material_id, is_external, external_lead_time_hours)
        VALUES (${parseInt(cardId, 10)}, ${route.opSeq}, ${route.operation}, ${route.machineId ?? null}, ${route.altMachineId ?? null}, ${route.normPerHour ?? null}, ${route.setupMinutes ?? null}, ${route.scrapFixed ?? null}, ${route.scrapPct ?? null}, ${route.minRazryad ?? null}, ${route.isCore ?? false}, ${route.operationSubtype ?? null}, ${route.materialId ?? null}, ${route.isExternal ?? false}, ${route.externalLeadTimeHours ?? null})
        RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      return row ? Ok(row) : Err('Marshrut qatori qoʻshilmadi');
    } catch (e) { return Err(fkOrRaw(e)); }
  }

  // EP-PP-126 (§07 #132) — Konstruktor/dizayn bosqichi (chizma+qolip) marshrutga, ishlab-chiqarish
  // oplaridan OLDIN qo'shiladi: is_construction_phase=true, o'z holati (status) va rejalashtirilgan
  // davomiyligi (daqiqa) bilan. Oddiy oplar tegilmaydi (is_construction_phase=false default).
  async addConstructionPhase(cardId: string, d: { opSeq?: number; operation?: string; machineId?: number; minRazryad?: number; status?: string; durationMinutes?: number }): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        INSERT INTO tech_card_routes
          (technology_card_id, op_seq, operation, machine_id, min_razryad, is_core,
           is_construction_phase, construction_status, construction_duration_min)
        VALUES
          (${parseInt(cardId, 10)}, ${d.opSeq ?? 0}, ${d.operation ?? 'Konstruktor: chizma+qolip'},
           ${d.machineId ?? null}, ${d.minRazryad ?? null}, false,
           true, ${d.status ?? 'not_started'}::construction_phase_status, ${d.durationMinutes ?? null})
        RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      return row ? Ok(row) : Err('Konstruktor bosqichi qoʻshilmadi');
    } catch (e) { return Err(fkOrRaw(e)); }
  }

  // EP-PP-126 (§07 #132) — konstruktor bosqichi holati/davomiyligini yangilash (chizma→qolip→tayyor).
  // Faqat konstruktor-bosqich qatorlariga ta'sir qiladi; COALESCE bilan berilmagan maydon o'zgarmaydi.
  async updateConstructionPhase(routeId: string, d: { status?: string; durationMinutes?: number }): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        UPDATE tech_card_routes SET
          construction_status = COALESCE(${d.status ?? null}::construction_phase_status, construction_status),
          construction_duration_min = COALESCE(${d.durationMinutes ?? null}, construction_duration_min)
        WHERE id = ${parseInt(routeId, 10)} AND is_construction_phase = true
        RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      if (!row) return Err(AppErr('NOT_FOUND', 'Konstruktor bosqichi topilmadi'));
      return Ok(row);
    } catch (e) { return Err(String(e)); }
  }

  async getVersions(cardId: string): Promise<Result<object[]>> {
    try {
      const r = await db.execute(sql`SELECT id, version, changed_by, changed_at FROM tech_card_versions WHERE technology_card_id = ${parseInt(cardId, 10)} ORDER BY version DESC`);
      return Ok(((r as { rows?: object[] }).rows ?? []) as object[]);
    } catch (e) { return Err(String(e)); }
  }

  /**
   * SB0741 — restore a technology card to a prior snapshot (tech_card_versions.snapshot).
   * Rollback = a new UPDATE that copies the old snapshot's editable fields back onto the
   * live row and bumps version (never rewrites history — the pre-restore state is itself
   * snapshotted by the normal updateCard()-style flow, so tech_card_versions stays a
   * forward-only audit log; "restore" is additive, not destructive).
   */
  async restoreVersion(cardId: string, versionId: string, restoredBy?: number): Promise<Result<Row>> {
    try {
      const vr = await db.execute(sql`
        SELECT snapshot FROM tech_card_versions
        WHERE id = ${parseInt(versionId, 10)} AND technology_card_id = ${parseInt(cardId, 10)}
        LIMIT 1`);
      const vrow = ((vr as { rows?: Row[] }).rows ?? [])[0];
      if (!vrow) return Err('Versiya topilmadi');
      const snap = vrow.snapshot as Row;

      const r = await db.execute(sql`
        UPDATE technology_cards SET
          code = ${snap.code ?? null},
          name = ${snap.name ?? null},
          direction = ${snap.direction ?? null},
          material_type = ${snap.material_type ?? null},
          product_type = ${snap.product_type ?? null},
          format_a = ${snap.format_a ?? null},
          format_b = ${snap.format_b ?? null},
          format_code = ${snap.format_code ?? null},
          gofra_profile = ${snap.gofra_profile ?? null},
          raskroy_per_list = ${snap.raskroy_per_list ?? null},
          scrap_pct = ${snap.scrap_pct ?? null},
          qolip_id = ${snap.qolip_id ?? null},
          print_params = ${jb(snap.print_params)}::jsonb,
          kesim = ${jb(snap.kesim)}::jsonb,
          post_press = ${jb(snap.post_press)}::jsonb,
          ish_tartibi = ${jb(snap.ish_tartibi)}::jsonb,
          operations = ${snap.operations ?? null},
          status = ${snap.status ?? null},
          version = version + 1,
          updated_at = now()
        WHERE id = ${parseInt(cardId, 10)} AND deleted_at IS NULL
        RETURNING *`);
      const row = ((r as { rows?: Row[] }).rows ?? [])[0];
      if (!row) return Err('Texkarta topilmadi');
      await this.snapshot(Number(row.id), Number(row.version), row, restoredBy);
      return Ok(row);
    } catch (e) { return Err(uniqueOrRaw(e)); }
  }

  private async snapshot(cardId: number, version: number, row: Row, changedBy?: number): Promise<void> {
    try {
      await db.execute(sql`INSERT INTO tech_card_versions (technology_card_id, version, snapshot, changed_by) VALUES (${cardId}, ${version}, ${JSON.stringify(row)}::jsonb, ${changedBy ?? null})`);
    } catch { /* snapshot is best-effort audit; never blocks the master write */ }
  }
}

export interface CreateCardInput {
  productId?: number;
  code?: string; name?: string; direction?: string; materialType?: string; productType?: string;
  formatA?: number; formatB?: number; formatCode?: string; gofraProfile?: string; raskroyPerList?: number; scrapPct?: number; qolipId?: number;
  printParams?: unknown; kesim?: unknown; postPress?: unknown; ishTartibi?: unknown; operations?: string;
  createdBy?: number;
}
export type UpdateCardInput = Omit<CreateCardInput, 'createdBy'> & { status?: string };
export interface AddRouteInput {
  opSeq: number; operation: string; machineId?: number; altMachineId?: number; normPerHour?: number;
  setupMinutes?: number; scrapFixed?: number; scrapPct?: number; minRazryad?: number; isCore?: boolean;
  operationSubtype?: string; materialId?: number;
  isExternal?: boolean; externalLeadTimeHours?: number;
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
