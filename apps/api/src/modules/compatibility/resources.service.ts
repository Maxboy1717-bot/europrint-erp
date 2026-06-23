/**
 * @module resources.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class ResourcesCompatService {
  constructor() {}

  async getWarehouses(page = '1', limit = '100'): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
    const lim = Math.min(si(limit, 100), MAX_LARGE_QUERY_LIMIT);
    const off = (Math.max(1, si(page, 1)) - 1) * lim;
    const result = await rawSql(sql`
      SELECT w.*, COUNT(cs.material_id) AS items_count
      FROM warehouses w
      LEFT JOIN current_stock cs ON cs.warehouse_id::text = w.id::text
      WHERE w.is_active = true
      GROUP BY w.id ORDER BY w.name
      LIMIT ${lim} OFFSET ${off}
    `);
    return dbRows(result);
  
    });}

  async getWarehouse(id: string){
    return safeCall(async () => {
    const result = await rawSql(sql`SELECT * FROM warehouses WHERE id = ${id}`)
      ;
    return dbRows(result)[0] ?? null;
  
    });}

  async getMaterialCards(page = '1', limit = '100', search?: string){
    return safeCall(async () => {
    const lim = Math.min(si(limit, 100), MAX_LARGE_QUERY_LIMIT);
    const off = (Math.max(1, si(page, 1)) - 1) * lim;
    const searchFilter = search ? sql`WHERE mc.xom_ashyo ILIKE ${'%' + search + '%'}` : sql``;
    const result = await rawSql(sql`
      SELECT mc.id, mc.xom_ashyo AS name, mc.kod AS sku,
             mc.unit_of_measure AS unit, mc.category AS category,
             COALESCE(mc.current_stock, 0) AS "currentStock",
             mc.unit_price AS "unitPrice"
      FROM material_cards mc
      ${searchFilter}
      ORDER BY mc.xom_ashyo LIMIT ${lim} OFFSET ${off}
    `);
    return dbRows(result);
  
    });}

  async getMaterialCard(id: string){
    return safeCall(async () => {
    const result = await rawSql(sql`SELECT * FROM material_cards WHERE id = ${id}`);
    return dbRows(result)[0] ?? null;
  
    });}

  async createMaterialCard(body: Record<string, unknown>){
    return safeCall(async () => {
    const name = String(body['name'] ?? body['xom_ashyo'] ?? '').trim();
    const sku = String(body['sku'] ?? body['sku_code'] ?? '').trim();
    const unit = String(body['unit'] ?? body['unit_of_measure'] ?? 'dona').trim();
    const category = String(body['category'] ?? body['material_type'] ?? 'raw_material').trim();
    const result = await rawSql(sql`
      INSERT INTO material_cards (xom_ashyo, sku_code, unit_of_measure, material_type, created_at)
      VALUES (${name}, ${sku}, ${unit}, ${category}, NOW())
      RETURNING id, xom_ashyo AS name, sku_code AS sku, unit_of_measure AS unit, material_type AS category, created_at
    `);
    return dbRows(result)[0];
  
    });}

  async updateMaterialCardUnitPrice(id: string, price: number) {
    return safeCall(async () => {
      const result = await rawSql(sql`
        UPDATE material_cards SET unit_price = ${price} WHERE id = ${si(id, 0)}
        RETURNING id, xom_ashyo AS name, unit_price AS "unitPrice"
      `);
      return dbRows(result)[0] ?? null;
    });
  }

  /**
   * `/api/org-departments` — frontend `OrgStructureSection` (EmployeeDialog) ishlatadi.
   *
   * `org_departments` jadvalidan camelCase format'da qaytaradi:
   *   { id, name, nameRu, tskp, hierarchyLevel, nodeType, headUserId, headUserName }
   *
   * Bu metod yangi `org_departments` (org-structure-sync migration) bilan ishlaydi.
   */
  async getOrgDepartments(page = '1', limit = '200'): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const lim = Math.min(si(limit, 200), MAX_LARGE_QUERY_LIMIT);
      const off = (Math.max(1, si(page, 1)) - 1) * lim;
      const result = await this.queryOrgDepartments(lim, off);
      return dbRows(result);
    });
  }

  private queryOrgDepartments(lim: number, off: number) {
    return rawSql(sql`
      SELECT
        od.id::text                                   AS id,
        COALESCE(od.name, '')                         AS name,
        od.name_ru                                    AS "nameRu",
        od.tskp                                       AS tskp,
        od.tskp_ru                                    AS "tskpRu",
        od.hierarchy_level                            AS "hierarchyLevel",
        COALESCE(od.node_type, 'department')          AS "nodeType",
        od.parent_id                                  AS "parentId",
        od.head_user_id::text                         AS "headUserId",
        (u.first_name || ' ' || u.last_name)          AS "headUserName",
        u.employee_id                                 AS "headEmployeeId",
        od.color                                      AS color,
        od.description                                AS description,
        (SELECT COUNT(*)::int
           FROM employee_org_departments eod
           JOIN users eu ON eu.id = eod.user_id
          WHERE eod.org_department_id = od.id)        AS "employeeCount"
      FROM org_departments od
      LEFT JOIN users u
        ON u.id = od.head_user_id
      WHERE od.is_active = true
      ORDER BY od.level NULLS FIRST, od.sort_order, od.id
      LIMIT ${lim} OFFSET ${off}
    `);
  }

  /**
   * `/api/org-functions` — org-sxemadagi "Lavozim" (position) ro'yxati.
   * `org_functions` jadvalidan { id, name(=position_name), departmentId, ... } qaytaradi.
   * Legacy `/api/positions` o'rnini bosadi — org-sxema yagona manba.
   */
  async getOrgFunctions(page = '1', limit = '500', departmentId?: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const lim = Math.min(si(limit, 500), MAX_LARGE_QUERY_LIMIT);
      const off = (Math.max(1, si(page, 1)) - 1) * lim;
      const result = await this.queryOrgFunctions(lim, off, departmentId ? si(departmentId) : undefined);
      return dbRows(result);
    });
  }

  private queryOrgFunctions(lim: number, off: number, departmentId?: number) {
    const deptFilter = departmentId ? sql`AND ofn.department_id = ${departmentId}` : sql``;
    return rawSql(sql`
      SELECT
        ofn.id::text                                                       AS id,
        COALESCE(NULLIF(ofn.position_name, ''), ofn.sub_department_name, '') AS name,
        ofn.position_name_ru                                               AS "nameRu",
        ofn.sub_department_name                                            AS "subDepartmentName",
        ofn.department_id                                                  AS "departmentId",
        od.name                                                            AS "departmentName",
        ofn.tskp                                                           AS tskp
      FROM org_functions ofn
      LEFT JOIN org_departments od ON od.id = ofn.department_id
      WHERE COALESCE(NULLIF(ofn.position_name, ''), ofn.sub_department_name) IS NOT NULL
      ${deptFilter}
      ORDER BY ofn.department_id NULLS FIRST, ofn.position_name
      LIMIT ${lim} OFFSET ${off}
    `);
  }

  async createOrgFunction(body: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      if (!body['position_name'] && !body['name']) throw new BadRequestException('position_name majburiy');
      const positionName   = String(body['position_name'] ?? body['name'] ?? '');
      const departmentId   = body['department_id']    ?? body['departmentId']    ?? null;
      const razryadLevelId = body['razryad_level_id'] ?? body['razryadLevelId'] ?? null;
      const code           = body['code'] ?? null;
      const salaryType     = body['salary_type']      ?? body['salaryType']      ?? null;
      const r = await rawSql(sql`
        INSERT INTO org_functions (
          position_name, department_id, razryad_level_id, code, salary_type,
          display_order, is_active, created_at, updated_at
        ) VALUES (
          ${positionName},
          ${departmentId ? parseInt(String(departmentId), 10) : null},
          ${razryadLevelId ? parseInt(String(razryadLevelId), 10) : null},
          ${code}, ${salaryType},
          0, true, NOW(), NOW()
        )
        RETURNING id, position_name AS name, department_id AS "departmentId", razryad_level_id AS "razryadLevelId"
      `);
      const created = dbRows(r)[0];
      return { message: 'Karta yaratildi', id: created?.['id'] ?? null, data: created };
    });
  }

  async updateOrgFunction(id: string, body: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const positionName   = body['position_name']    ?? body['name']            ?? null;
      const departmentId   = body['department_id']    ?? body['departmentId']    ?? null;
      const razryadLevelId = body['razryad_level_id'] ?? body['razryadLevelId'] ?? null;
      await rawSql(sql`
        UPDATE org_functions SET
          position_name    = COALESCE(${positionName},   position_name),
          department_id    = COALESCE(${departmentId    ? parseInt(String(departmentId), 10)    : null}, department_id),
          razryad_level_id = COALESCE(${razryadLevelId ? parseInt(String(razryadLevelId), 10) : null}, razryad_level_id),
          code             = COALESCE(${body['code']         ?? null}, code),
          salary_type      = COALESCE(${body['salary_type']  ?? body['salaryType'] ?? null}, salary_type),
          is_active        = COALESCE(${body['is_active']    ?? null}, is_active),
          updated_at       = NOW()
        WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL
      `);
      return { message: 'Karta yangilandi', id };
    });
  }

  /**
   * POST /api/org-departments/notify-vacancies
   * Returns real vacant org_departments (is_active=true AND head_user_id IS NULL).
   */
  async getVacantDepartments(): Promise<Result<{ vacantCount: number; vacantNodes: Record<string, unknown>[]; notified: true }>> {
    return safeCall(async () => {
      const result = await rawSql(sql`
        SELECT id::text AS id, COALESCE(name, '') AS name
        FROM org_departments
        WHERE is_active = true AND head_user_id IS NULL
        ORDER BY level NULLS FIRST, name
      `);
      const rows = dbRows(result);
      return { vacantCount: rows.length, vacantNodes: rows, notified: true as const };
    });
  }

  async deleteOrgFunction(id: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      await rawSql(sql`
        UPDATE org_functions SET deleted_at = NOW(), status = 'deleted', is_active = false, updated_at = NOW()
        WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL
      `);
      return { deleted: true, id };
    });
  }

  async createWarehouse(body: Record<string, unknown>){
    return safeCall(async () => {
    if (!body['name']) throw new BadRequestException('name majburiy');
    const r = await rawSql(sql`
      INSERT INTO warehouses (name, code, description, is_active, created_at, updated_at)
      VALUES (${body['name'] ?? ''}, ${body['code'] ?? null}, ${body['description'] ?? null}, true, NOW(), NOW())
      RETURNING id, name, code
    `);
    const created = dbRows(r)[0];
    return { message: 'Ombor yaratildi', id: created?.['id'] ?? null, data: created };
  
    });}

  async updateWarehouse(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    await rawSql(sql`
      UPDATE warehouses
      SET name = COALESCE(${body['name'] ?? null}, name),
          code = COALESCE(${body['code'] ?? null}, code),
          description = COALESCE(${body['description'] ?? null}, description),
          updated_at = NOW()
      WHERE id = ${id}
    `);
    return { message: 'Ombor yangilandi', id };

    });}

  async deleteWarehouse(id: string){
    return safeCall(async () => {
      await rawSql(sql`UPDATE warehouses SET deleted_at = NOW() WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL`);
      return { deleted: true, id };
    });
  }
}
