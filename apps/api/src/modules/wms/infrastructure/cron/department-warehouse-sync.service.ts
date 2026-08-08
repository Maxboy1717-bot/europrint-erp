/**
 * @module department-warehouse-sync.service
 * @description Ombor / Taksonomiya — bo'lim ichki omborlarini org-sxemadan AVTO-derivatsiya.
 *
 *   Vizyon (CHAT-TARIXI-YANGI-2026-06-08:52): "Orgsxema o'zgarsa → ERP rollari AVTO
 *   yangilanadi; yangi bo'lim ochilsa → POS Monitorda ombor AVTO yaratiladi."
 *   Spec (OMBOR-TERMINAL-INTERFEYS-SPEC-2026-06-27 §9): "Har bo'limning O'Z ICHKI OMBORI
 *   = DEPARTMENT_* tip — 7 asosiy ombordan ALOHIDA. 30+ bo'lim, bo'lim kodi org-sxemadan."
 *
 *   Qoida: `org_departments` dagi har FAOL bo'lim-tugun (node_type <> 'position' —
 *   lavozim-kartalar bo'lim emas) uchun `warehouses` da code='DEPT-<org_department_id>',
 *   type='department_warehouse' ombor bo'lishi shart. Yo'q bo'lsa yaratiladi (nom =
 *   bo'lim nomi + " ichki ombori") va `department_warehouse_map` ga bog'lanadi.
 *   Bu org-DATAdan DERIVATSIYA (fabrikatsiya emas) — idempotent: bor yozuvga tegilmaydi
 *   (ON CONFLICT DO NOTHING), o'chirish/deaktivatsiya QILINMAYDI (Q-39 regress-himoya).
 *
 *   Ishga tushish: boot (OnApplicationBootstrap) + har kuni 03:10 cron.
 *
 * NOTE: Raw SQL — bulk INSERT...SELECT anti-join derivatsiya (org_departments →
 *   warehouses/department_warehouse_map); Drizzle query-builder INSERT...SELECT ni
 *   ifodalay olmaydi (ARCHITECTURE_RULES.md Rule 4). Bundan tashqari
 *   department_warehouse_map Drizzle ta'rifi DB dan drift qilgan (org_department_id
 *   ustuni ta'rifda yo'q) — raw SQL DB haqiqatiga mos.
 * @layer Cron (WMS)
 */
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result } from '@common/result';

export interface DepartmentWarehouseSyncSummary {
  createdWarehouses: number;
  createdMappings: number;
}

@Injectable()
export class DepartmentWarehouseSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DepartmentWarehouseSyncService.name);

  /** Boot'da bir marta — server ko'tarilganda org-sxema bilan sinxron bo'lsin. */
  async onApplicationBootstrap(): Promise<void> {
    const r = await this.syncDepartmentWarehouses();
    if (!r.ok) this.logger.warn(`Boot sync xato: ${String(r.error)}`);
  }

  /** Har kuni 03:10 (Toshkent) — kunlik org→ombor sinxronizatsiya. */
  @Cron('10 3 * * *', { timeZone: 'Asia/Tashkent' })
  async dailySync(): Promise<void> {
    const r = await this.syncDepartmentWarehouses();
    if (!r.ok) this.logger.warn(`Kunlik sync xato: ${String(r.error)}`);
  }

  /**
   * Idempotent sinxronizatsiya:
   *  1) Har faol bo'lim-tugun uchun DEPT-<id> ombor yo'q bo'lsa yaratadi.
   *  2) department_warehouse_map da bo'lim↔ombor bog'lanishini ta'minlaydi (is_primary=true).
   */
  async syncDepartmentWarehouses(): Promise<Result<DepartmentWarehouseSyncSummary>> {
    try {
      const whR = await runQuery<{ id: number }>(sql`
        INSERT INTO warehouses (code, name, name_ru, type, is_active)
        SELECT
          'DEPT-' || d.id,
          d.name || ' ichki ombori',
          COALESCE(d.name_ru, d.name) || ' ichki ombori',
          'department_warehouse',
          true
        FROM org_departments d
        WHERE d.is_active = true
          AND d.deleted_at IS NULL
          AND d.archived_at IS NULL
          AND d.node_type IS DISTINCT FROM 'position'
        ON CONFLICT (code) DO NOTHING
        RETURNING id
      `);

      const mapR = await runQuery<{ id: number }>(sql`
        INSERT INTO department_warehouse_map
          (org_department_id, department_id, warehouse_id, is_primary,
           department_code, department_name, is_active, created_at, updated_at)
        SELECT
          d.id, d.id, w.id, true,
          'DEPT-' || d.id, d.name, true, NOW(), NOW()
        FROM org_departments d
        JOIN warehouses w ON w.code = 'DEPT-' || d.id
        WHERE d.is_active = true
          AND d.deleted_at IS NULL
          AND d.archived_at IS NULL
          AND d.node_type IS DISTINCT FROM 'position'
        ON CONFLICT (org_department_id, warehouse_id) DO NOTHING
        RETURNING id
      `);

      const summary: DepartmentWarehouseSyncSummary = {
        createdWarehouses: whR.rows.length,
        createdMappings: mapR.rows.length,
      };
      if (summary.createdWarehouses > 0 || summary.createdMappings > 0) {
        this.logger.log(
          `Bo'lim ichki omborlari sinxronlandi: +${summary.createdWarehouses} ombor, +${summary.createdMappings} bog'lanish`,
        );
      }
      return Ok(summary);
    } catch (e) {
      return Err(String(e));
    }
  }
}
