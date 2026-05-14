/**
 * AGENT 4: Ombor — Zaxira bashorat + Roll boshqaruv
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: nested subquery with GROUP BY DATE(created_at) for moving-average
 *   demand forecast, `HAVING SUM(balance) < COALESCE(MAX(reorder_point), 0)`
 *   aggregate filter, `INTERVAL '90 days'` date arithmetic, `ON CONFLICT
 *   (roll_id) DO NOTHING ... RETURNING`, and `SELECT ... FOR UPDATE` row-level
 *   locking for atomic roll-usage decrement. Target tables (warehouse_rolls,
 *   warehouse_roll_usage, warehouse_stock_balance, warehouse_transactions) are
 *   not in the Drizzle schema barrel.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';
import { MAX_FALLBACK_DAYS, ABC_A_THRESHOLD, ABC_B_THRESHOLD } from '../../common/constants/business.constants';

export interface ForecastResult {
  materialId:    number;
  currentStock:  number;
  forecastDemand: number;
  daysUntilOut:  number;
  reorderPoint:  number;
}

@Injectable()
export class InventoryAgentService {
  private readonly logger = new Logger(InventoryAgentService.name);
  private readonly AGENT  = 'inventory';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
    private readonly configService: ConfigService,
  ) {}

  /** 30 kunlik talab bashorati (harakatlanuvchi o'rtacha) */
  async forecastDemand(materialId: number, days = 30): Promise<ForecastResult> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'forecast_demand', targetType: 'material', targetId: String(materialId) }, async () => {
      // 90 kunlik o'rtacha sarf
      const r = await runQuery<{ daily: string }>(sql`
        SELECT COALESCE(AVG(daily_qty), 0)::text AS daily FROM (
          SELECT DATE(created_at) AS d, SUM(qty) AS daily_qty
          FROM warehouse_transactions
          WHERE material_card_id = ${materialId}
            AND tx_type IN ('OUT', 'INTERNAL_ISSUE')
            AND created_at > NOW() - INTERVAL '90 days'
          GROUP BY DATE(created_at)
        ) t
      `).catch(() => ({ rows: [{ daily: '0' }] }));
      const dailyAvg = Number(r.rows[0]?.daily ?? 0);

      const stock = await runQuery<{ balance: string }>(sql`
        SELECT COALESCE(SUM(balance), 0)::text AS balance FROM warehouse_stock_balance WHERE material_card_id = ${materialId}
      `).catch(() => ({ rows: [{ balance: '0' }] }));
      const currentStock = Number(stock.rows[0]?.balance ?? 0);

      const forecastDemand = dailyAvg * days;
      const daysUntilOut = dailyAvg > 0 ? Math.floor(currentStock / dailyAvg) : MAX_FALLBACK_DAYS;
      const reorderPoint = Math.ceil(dailyAvg * 7);   // 1 hafta

      return { materialId, currentStock, forecastDemand, daysUntilOut, reorderPoint };
    });
  }

  /** Kritik qoldiq tekshiruvi */
  async checkCriticalStock(): Promise<Array<{ materialId: number; balance: number; reorderPoint: number }>> {
    const r = await runQuery<{ id: string; balance: string; reorder_point: string | null }>(sql`
      SELECT material_card_id::text AS id, SUM(balance)::text AS balance, MAX(reorder_point)::text AS reorder_point
      FROM warehouse_stock_balance
      GROUP BY material_card_id
      HAVING SUM(balance) < COALESCE(MAX(reorder_point), 0)
      LIMIT 50
    `).catch(() => ({ rows: [] }));
    const list = r.rows.map(row => ({
      materialId: Number(row.id), balance: Number(row.balance), reorderPoint: Number(row.reorder_point ?? 0),
    }));
    if (list.length > 0) {
      this.bus.emit('stock.critical', { count: list.length, items: list }, this.AGENT);
    }
    return list;
  }

  /** ABC tahlil — qiymat bo'yicha A/B/C guruhlash */
  async abcAnalysis(): Promise<Array<{ materialId: number; class: 'A' | 'B' | 'C'; valueShare: number }>> {
    const r = await runQuery<{ id: string; total_value: string }>(sql`
      SELECT material_card_id::text AS id, SUM(qty * unit_price)::text AS total_value
      FROM warehouse_transactions
      WHERE created_at > NOW() - INTERVAL '90 days' AND tx_type IN ('OUT', 'INTERNAL_ISSUE')
      GROUP BY material_card_id
      ORDER BY SUM(qty * unit_price) DESC
    `).catch(() => ({ rows: [] }));
    const total = r.rows.reduce((s, x) => s + Number(x.total_value), 0);
    let cum = 0;
    return r.rows.map(row => {
      const v = Number(row.total_value);
      cum += v;
      const share = total > 0 ? (cum / total) : 0;
      const cls: 'A' | 'B' | 'C' = share <= ABC_A_THRESHOLD ? 'A' : share <= ABC_B_THRESHOLD ? 'B' : 'C';
      return { materialId: Number(row.id), class: cls, valueShare: Math.round((v / total) * 1000) / 10 };
    });
  }

  /** Roll qoldiq (gofrokarton) */
  async getRollBalance(): Promise<Array<{ articleCode: string; count: number; totalKg: number }>> {
    const r = await runQuery<{ article_code: string; cnt: string; total: string }>(sql`
      SELECT article_code, COUNT(*)::text AS cnt, SUM(remaining_weight_kg)::text AS total
      FROM warehouse_rolls WHERE remaining_weight_kg > 0
      GROUP BY article_code
    `).catch(() => ({ rows: [] }));
    return r.rows.map(x => ({
      articleCode: x.article_code,
      count:       Number(x.cnt),
      totalKg:     Number(x.total),
    }));
  }

  /** FIFO navbat — eng eski roll birinchi (article kod bo'yicha) */
  async getFIFOQueue(articleCode: string): Promise<Array<{ rollId: string; receivedDate: string; remainingWeightKg: number; supplierName: string | null }>> {
    const r = await runQuery<{ id: string; roll_id: string; received_date: string; remaining: string; supplier: string | null }>(sql`
      SELECT id::text, roll_id, received_date::text, remaining_weight_kg::text AS remaining, supplier_name AS supplier
      FROM warehouse_rolls
      WHERE article_code = ${articleCode}
        AND status = 'available'
        AND remaining_weight_kg > 0
      ORDER BY received_date ASC, created_at ASC
      LIMIT 50
    `).catch(() => ({ rows: [] }));
    return r.rows.map(x => ({
      rollId:            x.roll_id,
      receivedDate:      x.received_date,
      remainingWeightKg: Number(x.remaining),
      supplierName:      x.supplier,
    }));
  }

  /** Roll skanerlash + qabul qilish */
  private buildRollQrPayload(args: { rollId: string; articleCode: string; initialWeightKg: number; supplierName?: string }): string {
    return JSON.stringify({
      rollId:       args.rollId,
      articleCode:  args.articleCode,
      weight:       args.initialWeightKg,
      supplier:     args.supplierName,
      receivedAt:   new Date().toISOString(),
    });
  }

  private async insertRoll(args: { rollId: string; articleCode: string; supplierId?: number; supplierName?: string; initialWeightKg: number; warehouseId?: string; binLocation?: string }, qrPayload: string) {
    return runQuery<{ id: string }>(sql`
      INSERT INTO warehouse_rolls (
        roll_id, article_code, supplier_id, supplier_name,
        initial_weight_kg, remaining_weight_kg, warehouse_id, bin_location,
        qr_code_payload, is_critical, status
      )
      VALUES (
        ${args.rollId}, ${args.articleCode}, ${args.supplierId ?? null}, ${args.supplierName ?? null},
        ${args.initialWeightKg}, ${args.initialWeightKg}, ${args.warehouseId ?? null}, ${args.binLocation ?? null},
        ${qrPayload}, ${args.initialWeightKg < 50}, 'available'
      )
      ON CONFLICT (roll_id) DO NOTHING
      RETURNING id::text AS id
    `);
  }

  async scanRoll(args: {
    rollId: string; articleCode: string; supplierId?: number; supplierName?: string;
    initialWeightKg: number; warehouseId?: string; binLocation?: string;
  }): Promise<{ id: string; qrPayload: string }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'scan_roll', targetType: 'roll', targetId: args.rollId }, async () => {
      const qrPayload = this.buildRollQrPayload(args);
      const r = await this.insertRoll(args, qrPayload);
      const row = r.rows[0];
      if (!row) {
        throw new BadRequestException("Bu roll allaqachon ro'yxatga olingan: " + args.rollId);
      }
      return { id: row.id, qrPayload };
    });
  }

  /** Roll ishlatilganini yozib qo'yish (og'irlikni kamaytirish + audit) */
  async trackRollUsage(args: {
    rollDbId: string; usedWeightKg: number; productionOrderId?: string; usedByUserId?: number;
  }): Promise<{ remainingKg: number; isLow: boolean; isEmpty: boolean }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'roll_usage', targetType: 'roll', targetId: args.rollDbId, userId: args.usedByUserId }, async () => {
      // Joriy holatni olamiz (atomic update uchun)
      const cur = await runQuery<{ remaining: string; status: string }>(sql`
        SELECT remaining_weight_kg::text AS remaining, status FROM warehouse_rolls WHERE id = ${args.rollDbId} FOR UPDATE
      `);
      const curRow = cur.rows[0];
      if (!curRow) throw new Error('Roll topilmadi');
      const oldRemaining = Number(curRow.remaining);
      const newRemaining = Math.max(0, oldRemaining - args.usedWeightKg);
      const isLow   = newRemaining < 20 && newRemaining > 0;
      const isEmpty = newRemaining === 0;
      const newStatus = isEmpty ? 'empty' : 'available';

      await runQuery(sql`
        UPDATE warehouse_rolls
        SET remaining_weight_kg = ${newRemaining}, is_low = ${isLow}, status = ${newStatus}, updated_at = NOW()
        WHERE id = ${args.rollDbId}
      `);
      await runQuery(sql`
        INSERT INTO warehouse_roll_usage (roll_id, used_weight_kg, remaining_weight_kg, production_order_id, used_by_user_id)
        VALUES (${args.rollDbId}, ${args.usedWeightKg}, ${newRemaining}, ${args.productionOrderId ?? null}, ${args.usedByUserId ?? null})
      `);

      if (isLow) this.bus.emit('warehouse.roll_low', { rollDbId: args.rollDbId, remainingKg: newRemaining }, this.AGENT);
      return { remainingKg: newRemaining, isLow, isEmpty };
    });
  }

  /** QR kod payload generatsiya (rasm emas, JSON string — frontend rasm chizadi) */
  async rollQRCode(rollDbId: string): Promise<{ payload: string; verifyUrl: string }> {
    const r = await runQuery<{ roll_id: string; article_code: string; remaining: string; supplier_name: string | null }>(sql`
      SELECT roll_id, article_code, remaining_weight_kg::text AS remaining, supplier_name
      FROM warehouse_rolls WHERE id = ${rollDbId} LIMIT 1
    `);
    if (!r.rows[0]) throw new Error('Roll topilmadi');
    const x = r.rows[0];
    const baseUrl = this.configService.get<string>('PUBLIC_BASE_URL') ?? 'http://localhost:3001';
    const payload = JSON.stringify({
      rollId:       x.roll_id,
      articleCode:  x.article_code,
      weight:       Number(x.remaining),
      supplier:     x.supplier_name,
      timestamp:    Date.now(),
    });
    return { payload, verifyUrl: `${baseUrl}/api/agents/inventory/rolls/verify/${x.roll_id}` };
  }

  /** Har kuni 06:00 da to'liq inventarizatsiya tekshiruvi */
  @Cron('0 6 * * *', { timeZone: 'Asia/Tashkent' })
  async cron(): Promise<void> {
    try {
      const critical = await this.checkCriticalStock();
      if (critical.length > 0) {
        await this.alert.send({
          agentName: this.AGENT, severity: 'critical', module: 'warehouse',
          title: 'Kritik qoldiq materiallar',
          message: `${critical.length} ta material qayta buyurtma nuqtasidan past tushdi.`,
          targetRole: 'wh_head', actionRequired: true,
          actions: [{ label: 'Xarid so\'rovi yarat', action: 'create_purchase_request' }],
        });
      }
    } catch (err) { this.logger.error(`cron: ${(err as Error).message}`); }
  }
}
