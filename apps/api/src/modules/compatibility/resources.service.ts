/**
 * @module resources.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class ResourcesCompatService {
  constructor(private readonly i18n: I18nService) {}

  async getWarehouses(page = '1', limit = '100'): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
    const lim = Math.min(si(limit, 100), MAX_LARGE_QUERY_LIMIT);
    const off = (Math.max(1, si(page, 1)) - 1) * lim;
    const result = await rawSql(sql`
      SELECT w.*, COUNT(cs.material_card_id) AS items_count
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
             COALESCE(mc.current_stock, 0) AS "currentStock"
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

  async getDepartments(page = '1', limit = '100'){
    return safeCall(async () => {
    const lim = Math.min(si(limit, 100), MAX_LARGE_QUERY_LIMIT);
    const off = (Math.max(1, si(page, 1)) - 1) * lim;
    const result = await rawSql(sql`
      SELECT d.*, COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id ORDER BY d.name LIMIT ${lim} OFFSET ${off}
    `);
    return dbRows(result);

    });}

  /**
   * `/api/org-departments` — frontend `OrgStructureSection` (EmployeeDialog) ishlatadi.
   *
   * `org_departments` jadvalidan camelCase format'da qaytaradi:
   *   { id, name, nameRu, tskp, hierarchyLevel, nodeType, headUserId, headUserName }
   *
   * Eslatma: `getDepartments` (yuqorida) eski `departments` jadval uchun.
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

  async getDepartment(id: string){
    return safeCall(async () => {
    const result = await rawSql(sql`SELECT * FROM departments WHERE id = ${si(id)}`)
      ;
    return dbRows(result)[0] ?? null;
  
    });}

  async createDepartment(body: Record<string, unknown>){
    return safeCall(async () => {
    if (!body['name']) throw new BadRequestException('name majburiy');
    const result = await rawSql(sql`
      INSERT INTO departments (name, name_uz, parent_id, manager_id)
      VALUES (${body['name'] ?? ''}, ${body['name_uz'] ?? null},
              ${body['parent_id'] ?? null}, ${body['manager_id'] ?? null})
      RETURNING *
    `);
    const created = dbRows(result)[0];
    return created;
  
    });}

  async updateDepartment(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const result = await rawSql(sql`
      UPDATE departments
      SET name = COALESCE(${body['name'] ?? null}, name),
          name_uz = COALESCE(${body['name_uz'] ?? null}, name_uz),
          manager_id = COALESCE(${body['manager_id'] ?? null}, manager_id),
          updated_at = NOW()
      WHERE id = ${si(id)} RETURNING *
    `);
    const _found = dbRows(result)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async deleteDepartment(id: string){
    return safeCall(async () => {
    await rawSql(sql`DELETE FROM departments WHERE id = ${si(id)}`)
    return { ok: true, deleted: true };
  
    });}

  async getPositions(page = '1', limit = '100', departmentId?: string){
    return safeCall(async () => {
    const lim = Math.min(si(limit, 100), MAX_LARGE_QUERY_LIMIT);
    const off = (Math.max(1, si(page, 1)) - 1) * lim;
    const deptFilter = departmentId ? sql`AND p.department_id = ${si(departmentId)}` : sql``;
    const result = await rawSql(sql`
      SELECT p.*, d.name AS department_name
      FROM positions p
      LEFT JOIN departments d ON d.id = p.department_id
      WHERE p.is_active = true ${deptFilter}
      ORDER BY p.name LIMIT ${lim} OFFSET ${off}
    `);
    return dbRows(result);
  
    });}

  async getPosition(id: string){
    return safeCall(async () => {
    const result = await rawSql(sql`SELECT * FROM positions WHERE id = ${si(id)}`)
      ;
    return dbRows(result)[0] ?? null;
  
    });}

  async createPosition(body: Record<string, unknown>){
    return safeCall(async () => {
    if (!body['name']) throw new BadRequestException('name majburiy');
    const result = await rawSql(sql`
      INSERT INTO positions (name, name_uz, department_id, is_active)
      VALUES (${body['name'] ?? ''}, ${body['name_uz'] ?? null},
              ${body['department_id'] ?? null}, true)
      RETURNING *
    `);
    const created = dbRows(result)[0];
    return created;
  
    });}

  async updatePosition(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const result = await rawSql(sql`
      UPDATE positions
      SET name = COALESCE(${body['name'] ?? null}, name),
          name_uz = COALESCE(${body['name_uz'] ?? null}, name_uz),
          is_active = COALESCE(${body['is_active'] ?? null}, is_active),
          updated_at = NOW()
      WHERE id = ${si(id)} RETURNING *
    `);
    const _found = dbRows(result)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async assignKpiTemplate(id: string, templateKey: string){
    return safeCall(async () => {
      const marker = `[KPI:${templateKey}]`;
      const result = await rawSql(sql`
        UPDATE positions
        SET description = CASE
          WHEN description IS NULL THEN ${marker}
          WHEN description LIKE '[KPI:%]%' THEN REGEXP_REPLACE(description, '^\\[KPI:[^\\]]*\\]', ${marker})
          ELSE (${marker} || ' ' || description)
        END,
        updated_at = NOW()
        WHERE id = ${si(id)} RETURNING id, name_uz, description
      `);
      const found = dbRows(result)[0];
      if (!found) throw new NotFoundException(await this.i18n.t('errors.positionNotFound'));
      return found;
    });
  }

  async deletePosition(id: string){
    return safeCall(async () => {
    await rawSql(sql`UPDATE positions SET is_active = false WHERE id = ${si(id)}`)
    return { ok: true, deleted: true };

    });}

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
}
