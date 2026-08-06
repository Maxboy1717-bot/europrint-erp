/**
 * @module sd-quotations.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (SD)
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { I18nService } from 'nestjs-i18n';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall, Ok, Err, Result } from '@common/result';
import { DEFAULT_ADVANCE_PERCENT } from '@common/constants/business.constants';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { ISdQuotationsRepo } from '../../domain/repositories/i-sd-quotations.repo';
import { OutboxRepository } from '../../../shared/outbox/outbox.repository';
import { OrderCreatedEvent } from '../../domain/events/order-created.event';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
const execOne = async (q: SQL | SQLWrapper): Promise<Result<Row | null>> => {
  const rows = await exec(q);
  if (!rows.ok) return rows as Result<Row | null>;
  return Ok(rows.data[0] ?? null);
};

@Injectable()
export class SdQuotationsRepository implements ISdQuotationsRepo {
  private readonly logger = new Logger(SdQuotationsRepository.name);
  constructor(
    private readonly i18n: I18nService,
    private readonly eventBus: EventBus,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  // 06-sd#147 — persist per-order gofra layer count (2/3/5/7-sloy) on a quotation line
  // (canonical sd_quotation_items). Real UPDATE, RETURNING the saved value; null when the
  // line is absent/soft-deleted so the service can map NOT_FOUND. The DB CHECK guards the
  // standard corrugated wall counts. Raw SQL via exec(sql`..`) — no Drizzle table import.
  async setItemLayerCount(itemId: string, layerCount: number): Promise<Result<Row | null>> {
    const r = await exec(sql`
      UPDATE sd_quotation_items
      SET layer_count = ${layerCount}
      WHERE id = ${itemId} AND deleted_at IS NULL
      RETURNING id, quotation_id, layer_count`);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  // 06-sd#147 — NON-BLOCKING "AI load" hint: the rated load-capacity range for a chosen
  // layer count. Reverse lookup on the owner-fillable sd_load_capacity_rules lookup (owned
  // by 06-sd#107). Returns null when no active rule matches, the table is empty, or the
  // table does not exist yet (#107 not applied) — the caller treats a failed/empty read as
  // "no recommendation", never a fabricated mapping.
  async recommendLoadForLayers(layerCount: number): Promise<Result<Row | null>> {
    const r = await exec(sql`
      SELECT min_load_kg, max_load_kg, recommended_flute, note
      FROM sd_load_capacity_rules
      WHERE is_active = true AND recommended_layers = ${layerCount}
      ORDER BY min_load_kg ASC
      LIMIT 1`);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  async listQuotations(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    return customerId && status
      ? exec(sql`SELECT q.*, c.name AS customer_name FROM sd_quotations q LEFT JOIN sd_customers c ON c.id = q.customer_id WHERE q.customer_id = ${customerId} AND q.status = ${status} ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${off}`)
      : customerId
      ? exec(sql`SELECT q.*, c.name AS customer_name FROM sd_quotations q LEFT JOIN sd_customers c ON c.id = q.customer_id WHERE q.customer_id = ${customerId} ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${off}`)
      : status
      ? exec(sql`SELECT q.*, c.name AS customer_name FROM sd_quotations q LEFT JOIN sd_customers c ON c.id = q.customer_id WHERE q.status = ${status} ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${off}`)
      : exec(sql`SELECT q.*, c.name AS customer_name FROM sd_quotations q LEFT JOIN sd_customers c ON c.id = q.customer_id ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${off}`);
  }

  async createQuotation(body: Row): Promise<Result<Row | null>> {
    // #04 SD fix: live sd_quotations has NO title/items columns (the old INSERT crashed with DB_ERROR).
    // Write the real header columns; accept camelCase from FE; line items go to sd_quotation_items (was
    // orphaned). Generates a quotation_number. Real persist, no fake.
    const customerId = body.customer_id ?? body.customerId ?? null;
    const total = Number(body.total_amount ?? body.total_value ?? body.totalAmount ?? 0);
    const validUntil = body.valid_until ?? body.validUntil ?? null;
    const qNum = (body.quotation_number as string) ?? `KP-${Math.floor(Date.now() / 1000)}`;
    // SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3 §2.1 (2026-08-06 fix): sd_quotations.
    // customer_name is live NOT NULL, but the FE create form (QuotationsTab.tsx) only ever
    // collects customer_id (a <Select> picker) — no free-text name field exists — so this
    // always resolved to NULL and every quotation-create attempt crashed with a NOT NULL
    // violation. Resolve the name server-side from sd_customers (single source of truth)
    // instead of requiring the FE to duplicate it; an explicit body.customer_name still wins
    // if a caller supplies one.
    let customerName = (body.customer_name ?? body.customerName ?? null) as string | null;
    if (!customerName && customerId != null) {
      const custR = await exec(sql`SELECT name FROM sd_customers WHERE id = ${customerId} LIMIT 1`);
      customerName = custR.ok ? ((custR.data[0] as Row | undefined)?.name as string | undefined) ?? null : null;
    }
    const r = await exec(sql`
      INSERT INTO sd_quotations
        (quotation_number, customer_id, customer_name, quotation_date, total_value, total_amount, net_value,
         currency, valid_until, status, notes, payment_terms, markup_percent, created_at, updated_at)
      VALUES
        (${qNum}, ${customerId}, ${customerName}, to_char(NOW(),'YYYY-MM-DD'), ${total}, ${total}, ${total},
         ${body.currency ?? 'UZS'}, COALESCE(${validUntil}, to_char(NOW() + INTERVAL '14 days', 'YYYY-MM-DD')), ${body.status ?? 'draft'}, ${body.notes ?? null},
         ${body.payment_terms ?? body.paymentTerms ?? null}, ${body.markup_percent ?? body.markupPercent ?? null}, NOW(), NOW())
      RETURNING *`);
    if (!r.ok) return r as Result<Row | null>;
    const quote = r.data[0] ?? null;
    const items = Array.isArray(body.items) ? (body.items as Row[]) : [];
    if (quote && items.length > 0) {
      const qId = Number((quote as Row).id);
      for (const it of items) {
        // Bespoke print job (no product_id — see the Zod schema comment): persist the real
        // dimension/paper/color/cost-breakdown columns the calc-form + calculate-price response
        // actually carry, instead of the narrow product_type/quantity/unit_price/printing_method
        // set this used to write (which silently discarded every dimension and cost field the
        // FE sends). product_type falls back to the column's own 'box' default — the column is
        // NOT NULL, so passing an explicit NULL here would violate the constraint outright.
        await exec(sql`
          INSERT INTO sd_quotation_items
            (quotation_id, product_type, paper_type, length_mm, width_mm, height_mm, print_colors,
             lamination, perforation, is_new_die, kashirovka, quantity, unit_price, cost_price,
             paper_cost, production_cost, print_cost, delivery_cost, die_cost, printing_method)
          VALUES
            (${qId}, ${(it.product_type ?? it.productType ?? 'box') as string},
             ${(it.paper_type ?? it.paperType ?? null) as string | null},
             ${it.length_mm ?? it.lengthMm ?? null}, ${it.width_mm ?? it.widthMm ?? null},
             ${it.height_mm ?? it.heightMm ?? null}, ${Number(it.print_colors ?? it.printColors ?? 0)},
             ${Boolean(it.lamination ?? false)}, ${Boolean(it.perforation ?? false)},
             ${Boolean(it.is_new_die ?? it.isNewDie ?? false)}, ${Boolean(it.kashirovka ?? false)},
             ${Number(it.quantity ?? it.qty ?? 1)},
             ${Number(it.unit_price ?? it.unitPrice ?? 0)}, ${Number(it.cost_price ?? it.costPrice ?? 0)},
             ${Number(it.paper_cost ?? it.paperCost ?? 0)}, ${Number(it.production_cost ?? it.productionCost ?? 0)},
             ${Number(it.print_cost ?? it.printCost ?? 0)}, ${Number(it.delivery_cost ?? it.deliveryCost ?? 0)},
             ${Number(it.die_cost ?? it.dieCost ?? 0)},
             ${(it.printing_method ?? it.printingMethod ?? null) as string | null})`);
      }
    }
    return Ok(quote);
  }

  async listContracts(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    try {
      return customerId && status
        ? exec(sql`SELECT ct.*, c.name AS customer_name FROM sd_contracts ct LEFT JOIN sales_orders o ON o.id = ct.order_id LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE o.customer_id = ${customerId} AND ct.status = ${status} ORDER BY ct.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : customerId
        ? exec(sql`SELECT ct.*, c.name AS customer_name FROM sd_contracts ct LEFT JOIN sales_orders o ON o.id = ct.order_id LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE o.customer_id = ${customerId} ORDER BY ct.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : status
        ? exec(sql`SELECT ct.*, c.name AS customer_name FROM sd_contracts ct LEFT JOIN sales_orders o ON o.id = ct.order_id LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE ct.status = ${status} ORDER BY ct.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : exec(sql`SELECT ct.*, c.name AS customer_name FROM sd_contracts ct LEFT JOIN sales_orders o ON o.id = ct.order_id LEFT JOIN sd_customers c ON c.id = o.customer_id ORDER BY ct.created_at DESC LIMIT ${lim} OFFSET ${off}`);
    } catch {
      return Ok([]);
    }
  }

  async createContract(body: Row): Promise<Result<Row | null>> {
    const contractNumber = body.contract_number ?? `CNT-${Date.now()}`;
    const orderId = body.order_id != null ? parseInt(String(body.order_id), 10) : null;
    const customerId = body.customer_id != null ? parseInt(String(body.customer_id), 10) : null;
    // SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3 §2.2 (fake-save, 2026-08-06 fix):
    // payment_terms/start_date/total_amount were all silently dropped — payment_terms
    // was already a real column (just missing from the INSERT); start_date/total_amount
    // had no backing column (added via migrations-schema.ts, "fake-save fix" entry).
    // valid_until maps from end_date if provided
    const validUntil = body.end_date != null ? String(body.end_date) : null;
    const startDate = body.start_date != null ? String(body.start_date) : null;
    const totalAmount = body.total_amount != null ? Number(body.total_amount) : null;
    const r = await exec(sql`
      INSERT INTO sd_contracts
        (order_id, contract_number, template_type, status, customer_id, valid_until, notes,
         payment_terms, start_date, total_amount)
      VALUES
        (${orderId}, ${contractNumber}, ${body.template_type ?? 'standard'}, ${body.status ?? 'draft'},
         ${customerId}, ${validUntil}, ${body.notes ?? null},
         ${body.payment_terms ?? null}, ${startDate}, ${totalAmount})
      RETURNING *
    `);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  async listPriceFormulas(lim: number, off: number): Promise<Result<Row[]>> {
    return exec(sql`SELECT * FROM sd_price_formulas ORDER BY id LIMIT ${lim} OFFSET ${off}`);
  }

  async getKpiTeam(year: number, month: number): Promise<Result<Row[]>> {
    try {
      // Filter sales_orders to the requested calendar month so the FE period selector
      // actually changes what is shown (previously ALL-TIME data was returned).
      // Column aliases match the FE TeamKpiItem interface exactly:
      //   managerId  → m.id (string coerced by FE)
      //   totalSales → COALESCE(SUM(total_value), 0) — total_value is canonical (total_amount also present)
      //   ordersCount → COUNT(DISTINCT o.id)
      // total_value is used because it is the canonical revenue column per ADR (docs/adr/).
      return exec(sql`
        SELECT
          e.id::text                                                      AS "managerId",
          CONCAT(e.first_name, ' ', e.last_name)                         AS "full_name",
          COUNT(DISTINCT o.id)::int                                       AS "ordersCount",
          COALESCE(SUM(o.total_value), 0)::numeric(15,2)                 AS "totalSales",
          COUNT(DISTINCT l.id)::int                                       AS "leads_count"
        FROM employees e
        LEFT JOIN crm_leads l ON l.manager_id = e.id
        LEFT JOIN sales_orders o
          ON o.customer_id IN (
               SELECT l2.customer_id FROM crm_leads l2 WHERE l2.manager_id = e.id
             )
          AND EXTRACT(YEAR  FROM o.created_at) = ${year}
          AND EXTRACT(MONTH FROM o.created_at) = ${month}
          AND o.deleted_at IS NULL
        GROUP BY e.id, e.first_name, e.last_name
        ORDER BY "totalSales" DESC
        LIMIT 20
      `);
    } catch {
      return Ok([]);
    }
  }

  async getKpiTargets(managerId: number | null): Promise<Result<Row[]>> {
    try {
      if (managerId != null) {
        return exec(sql`
          SELECT
            q.id,
            q.manager_id,
            CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
            q.year,
            q.month,
            q.quota_amount,
            q.achieved_amount
          FROM sd_manager_quotas q
          LEFT JOIN employees e ON e.id = q.manager_id
          WHERE q.manager_id = ${managerId}
          ORDER BY q.year DESC, q.month DESC
        `);
      }
      return exec(sql`
        SELECT
          q.id,
          q.manager_id,
          CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
          q.year,
          q.month,
          q.quota_amount,
          q.achieved_amount
        FROM sd_manager_quotas q
        LEFT JOIN employees e ON e.id = q.manager_id
        ORDER BY q.year DESC, q.month DESC
      `);
    } catch {
      return Ok([]);
    }
  }

  async getFunnelReport(): Promise<Result<Row>> {
    const rows = await exec(sql`SELECT COUNT(DISTINCT l.id)::int AS total_leads, COUNT(DISTINCT CASE WHEN l.status_description ILIKE '%active%' OR l.status_description ILIKE '%new%' THEN l.id END)::int AS active_leads, COUNT(DISTINCT d.id)::int AS total_deals, COUNT(DISTINCT CASE WHEN d.stage_semantic_id = 'won' THEN d.id END)::int AS won_deals, COALESCE(SUM(CASE WHEN d.stage_semantic_id = 'won' THEN d.opportunity END), 0)::numeric(15,2) AS won_revenue FROM crm_leads l LEFT JOIN crm_deals d ON d.lead_id::text = l.id::text`);
    if (!rows.ok) return rows as Result<Row>;
    return Ok((rows.data[0] ?? {}) as Row);
  }

  async getQuotationById(id: string): Promise<Result<Row | null>> {
    const r = await exec(sql`
      SELECT q.*, c.name AS customer_name, c.id AS customer_record_id
      FROM sd_quotations q
      LEFT JOIN sd_customers c ON c.id = q.customer_id
      WHERE q.id = ${id} AND q.deleted_at IS NULL LIMIT 1
    `);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  // KP-PDF uchun toza sarlavha. getQuotationById dagi `q.*, c.name AS customer_name`
  // dublikat-alias mijoz JOIN topilmaganda q.customer_name ni NULL ga tushiradi
  // (DB-proof bilan tasdiqlangan) — shu bug'dan qochish uchun COALESCE ishlatiladi.
  async getQuotationForPdf(id: string): Promise<Result<Row | null>> {
    const r = await exec(sql`
      SELECT q.quotation_number, COALESCE(c.name, q.customer_name) AS customer_name, q.status,
             q.quotation_date, q.valid_until, q.net_value, q.tax_amount, q.total_value,
             q.total_amount, q.currency, q.notes
      FROM sd_quotations q
      LEFT JOIN sd_customers c ON c.id = q.customer_id
      WHERE q.id = ${id} AND q.deleted_at IS NULL LIMIT 1
    `);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  async getQuotationItems(id: string): Promise<Result<Row[]>> {
    return exec(sql`
      SELECT product_type, paper_type, quantity, unit_price, print_colors,
             core_diameter_mm, gilza_diameter_mm, roll_length_m
      FROM sd_quotation_items
      WHERE quotation_id = ${id}
      ORDER BY id
    `);
  }

  // EP-SD-118 (vision 06-sd #118, TASDIQ-2146 §06 #68): capture self-adhesive ROLL
  // parameters (core/gilza diameter + roll length) on a quotation line. Per-order
  // operator data — all columns NULL by default so box lines are unaffected. NOT_FOUND
  // when the line id does not exist (or is soft-deleted).
  async setItemRollParams(
    itemId: number,
    params: { coreDiameterMm: number | null; gilzaDiameterMm: number | null; rollLengthM: number | null },
  ): Promise<Result<Row | null>> {
    return execOne(sql`
      UPDATE sd_quotation_items
      SET core_diameter_mm  = ${params.coreDiameterMm},
          gilza_diameter_mm = ${params.gilzaDiameterMm},
          roll_length_m     = ${params.rollLengthM}
      WHERE id = ${itemId} AND deleted_at IS NULL
      RETURNING id, quotation_id, product_type, core_diameter_mm, gilza_diameter_mm, roll_length_m`);
  }

  // 06-sd#107 — persist per-order load capacity (kg) on a quotation line (canonical
  // sd_quotation_items). Real UPDATE, RETURNING the saved value; null when the line is
  // absent/soft-deleted so the service can map NOT_FOUND.
  async setItemLoadCapacity(itemId: string, loadKg: number): Promise<Result<Row | null>> {
    const r = await exec(sql`
      UPDATE sd_quotation_items
      SET load_capacity_kg = ${loadKg}
      WHERE id = ${itemId} AND deleted_at IS NULL
      RETURNING id, quotation_id, load_capacity_kg`);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  // 06-sd#107 — NON-BLOCKING flute/layer recommendation for a load capacity (kg).
  // Reads the owner-fillable sd_load_capacity_rules lookup; returns null when no active
  // rule matches (e.g. the table is still empty) — never a hardcoded/fabricated mapping.
  async recommendConstruction(loadKg: number): Promise<Result<Row | null>> {
    const r = await exec(sql`
      SELECT recommended_layers, recommended_flute, note
      FROM sd_load_capacity_rules
      WHERE is_active = true
        AND ${loadKg} >= min_load_kg
        AND (max_load_kg IS NULL OR ${loadKg} < max_load_kg)
      ORDER BY min_load_kg DESC
      LIMIT 1`);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  async convertQuotationToOrder(id: string): Promise<Result<{ error: string } | { order: Row }>> {
    return safeCall(async () => {
      const quotationResult = await this.getQuotationById(id);
      if (!quotationResult.ok) return Promise.reject(quotationResult.error);
      const quotation = quotationResult.data;
      if (!quotation) return { error: `Quotation ${id} not found` };
      if (quotation['status'] === 'converted') {
        let existingOrder: Row | null = null;
        if (quotation['order_id']) {
          const orderResult = await execOne(sql`SELECT id, order_number FROM sales_orders WHERE id = ${quotation['order_id']} LIMIT 1`);
          if (!orderResult.ok) return Promise.reject(orderResult.error);
          existingOrder = orderResult.data;
        }
        return { order: existingOrder ?? { id: quotation['order_id'], order_number: `QO-${id}` } };
      }
      const orderNumber = `QO-${id}-${Date.now().toString(36).toUpperCase()}`;
      const totalAmount = String(quotation['total_amount'] ?? '0');
      const totalAmountNum = Number(quotation['total_amount'] ?? 0);
      const companyId = Number(quotation['customer_id'] ?? quotation['company_id'] ?? 0);
      if (isNaN(companyId) || companyId === 0) {
        throw new BadRequestException(await this.i18n.t('errors.quotationCustomerIdInvalid'));
      }
      // Avans %: kotirovkada berilgan qiymat, aks holda egasi-vizyoni standarti (70%).
      // Musbat, sonli qiymat bo'lmasa (null/NaN/<=0) — DEFAULT_ADVANCE_PERCENT (canonical
      // execSdSalesOrderInsert bilan bir xil), avvalgi ?? 30 drift emas.
      const parsedAdvance = Number(quotation['advance_percent']);
      const advancePercent = Number.isFinite(parsedAdvance) && parsedAdvance > 0 ? parsedAdvance : DEFAULT_ADVANCE_PERCENT;
      // Atomic golden-thread (VISION-3340 #49): order INSERT + quotation status UPDATE +
      // the OrderCreated outbox row all commit together or all roll back. Previously this
      // path wrote the order + quotation atomically but produced NO OrderCreatedEvent /
      // outbox row, so it was a golden-thread dead-end (no PP/MES fan-out, no downstream
      // listeners). The outbox entry mirrors CreateOrderHandler._buildOutboxEntries exactly
      // (same aggregate_type / event_name / payload shape) so the OutboxPublisher re-emits
      // ERP_EVENTS.ORDER_CREATED to the very same listeners the canonical create-order path
      // feeds. No-orphan is preserved: still one transaction, and now an order can never be
      // created without its event (an outbox failure throws → the whole conversion rolls back).
      const insertedOrder = await db.transaction(async (tx) => {
        const orderRes = await tx.execute(sql`
          INSERT INTO sales_orders
            (order_number, status, company_id, total_amount, advance_required, advance_paid, advance_status, design_flag, sample_flag, created_by)
          VALUES
            (${orderNumber}, 'pending', ${companyId}, ${totalAmount}, ${advancePercent}, '0', 'pending', false, false, 0)
          RETURNING id, order_number, status, total_amount, created_at
        `);
        const order = (orderRes.rows?.[0] ?? null) as Row | null;
        if (!order) return null;

        // Copy the quotation's bespoke-job line items across in the SAME transaction as the
        // order header (owner decision 2026-07-13, chat — "Mahsulot vs Buyurtma zanjiri").
        // sd_quotation_items has no product_id (this shop quotes custom jobs by physical spec,
        // not catalog SKUs), so product_id stays NULL on the order line; the spec columns carry
        // the job description across instead. Mirrors saveItems()'s item_number convention
        // (create-order.handler.ts's canonical create path).
        const qItemsRes = await tx.execute(sql`
          SELECT * FROM sd_quotation_items WHERE quotation_id = ${id} AND deleted_at IS NULL ORDER BY id
        `);
        const qItems = (qItemsRes.rows ?? []) as Record<string, unknown>[];
        for (let i = 0; i < qItems.length; i++) {
          const qi = qItems[i];
          const itemNumber = String((i + 1) * 10).padStart(6, '0');
          const qty = Number(qi['quantity'] ?? 0);
          const price = Number(qi['unit_price'] ?? 0);
          await tx.execute(sql`
            INSERT INTO sales_order_items
              (sales_order_id, item_number, quotation_item_id, description, order_quantity, open_quantity,
               unit, net_price, total_price, product_type, paper_type, thickness_mm, length_mm, width_mm,
               height_mm, print_colors, lamination, perforation, special_coating, is_new_die, printing_method,
               machine_format, load_capacity_kg, core_diameter_mm, gilza_diameter_mm, roll_length_m,
               kashirovka, print_sides, layer_count, setup_time_minutes, created_at)
            VALUES
              (${order['id']}, ${itemNumber}, ${qi['id']}, ${qi['product_type'] ?? 'Maxsus buyurtma'}, ${qty}, ${qty},
               'dona', ${price}, ${qty * price}, ${qi['product_type'] ?? null}, ${qi['paper_type'] ?? null},
               ${qi['thickness_mm'] ?? null}, ${qi['length_mm'] ?? null}, ${qi['width_mm'] ?? null},
               ${qi['height_mm'] ?? null}, ${qi['print_colors'] ?? null}, ${qi['lamination'] ?? null},
               ${qi['perforation'] ?? null}, ${qi['special_coating'] ?? null}, ${qi['is_new_die'] ?? null},
               ${qi['printing_method'] ?? null}, ${qi['machine_format'] ?? null}, ${qi['load_capacity_kg'] ?? null},
               ${qi['core_diameter_mm'] ?? null}, ${qi['gilza_diameter_mm'] ?? null}, ${qi['roll_length_m'] ?? null},
               ${qi['kashirovka'] ?? null}, ${qi['print_sides'] ?? null}, ${qi['layer_count'] ?? null},
               ${qi['setup_time_minutes'] ?? null}, NOW())
          `);
        }

        await tx.execute(sql`
          UPDATE sd_quotations
          SET status = 'converted', order_id = ${order['id']}, updated_at = NOW()
          WHERE id = ${id}
        `);
        const outboxRes = await this.outboxRepo.insertBatch([{
          aggregate_type: 'SalesOrder',
          aggregate_id: String(order['id']),
          event_name: ERP_EVENTS.ORDER_CREATED,
          payload: {
            orderId: Number(order['id']),
            companyId,
            orderNumber: String(order['order_number'] ?? orderNumber),
            totalAmount: totalAmountNum,
          },
        }], tx);
        if (!outboxRes.ok) throw new Error(`Outbox insert failed: ${outboxRes.error.message}`);
        return order;
      });
      if (!insertedOrder) return { error: 'Failed to create sales order — DB insert returned no row' };
      // Belt-and-suspenders in-process emission after commit (same as CreateOrderHandler):
      // @nestjs/cqrs EventBus listeners fire immediately; the OutboxPublisher tick also
      // re-emits the persisted row. Best-effort — a publish hiccup must never fail an
      // already-committed conversion (the outbox row guarantees eventual delivery).
      try {
        this.eventBus.publish(new OrderCreatedEvent(
          Number(insertedOrder['id']),
          companyId,
          String(insertedOrder['order_number'] ?? orderNumber),
          totalAmountNum,
        ));
      } catch (err) {
        this.logger.warn(`[#49] OrderCreatedEvent in-process publish failed (outbox will re-emit): ${(err as Error).message}`);
      }
      return { order: insertedOrder };
      }, 'DB_ERROR');
  }
}
