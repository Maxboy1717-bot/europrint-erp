/**
 * @module drizzle-core.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { eq, sql } from 'drizzle-orm';
import { db, user_panels as userPanels, departments, positions } from '@shared/db';
import { Result, Err, Ok } from '@common/types/result.type';
import { ICoreRepo } from '../../domain/repositories/i-core.repo';
import { Department } from '../../domain/aggregates/department.aggregate';
import { Position } from '../../domain/aggregates/position.aggregate';
import { Panel, PanelLayout } from '../../domain/aggregates/panel.aggregate';
import { createId } from '@paralleldrive/cuid2';

// Re-export so callers that previously imported `userPanels` from this file keep working.
export { userPanels };

type DbRow = Record<string, unknown>;
type UserPanelRow = typeof userPanels.$inferSelect;

function extractFirst<T>(result: T[] | { rows?: T[] }): T | undefined {
  return Array.isArray(result) ? result[0] : result.rows?.[0];
}

function errMsg(e: unknown): string {
  return e instanceof Error ? (e as Error).message : String(e);
}

@Injectable()
export class DrizzleCoreRepo implements ICoreRepo {
  private readonly logger = new Logger(DrizzleCoreRepo.name);

  async findDepartmentById(id: string): Promise<Result<Department>> {
    try {
      const r = await db.select().from(departments).where(eq(departments.id, id)).limit(1).then(r => castTo<DbRow[]>(r));
      if (!r[0]) return Err('Departament topilmadi');
      return Ok(this.mapToDepartment(r[0]));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async findAllDepartments(_filters?: { isActive?: boolean; parentId?: string }): Promise<Result<Department[]>> {
    try {
      const r = await db.select().from(departments).orderBy(sql`${departments.id}`).then(r => castTo<DbRow[]>(r));
      return Ok((Array.isArray(r) ? r : []).map((row) => this.mapToDepartment(row)));
    } catch (e: unknown) {
      this.logger.error(`findAllDepartments error: ${errMsg(e)}`);
      return Err(errMsg(e));
    }
  }

  async saveDepartment(dept: Partial<Department>): Promise<Result<Department>> {
    try {
      const d = dept as DbRow;
      const rows = await db.insert(departments).values({
        name:        dept.name || '',
        code:        dept.code || '',
        headId:      (d['headId'] as string) || null,
        parentId:    (d['parentId'] as string) || null,
        description: dept.description || null,
        isActive:    dept.isActive ?? true,
      }).returning();
      if (!rows[0]) return Err('Departamentni saqlashda xato');
      return Ok(this.mapToDepartment(rows[0] as DbRow));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<Result<Department>> {
    try {
      const rows = await db.update(departments).set({
        name:      sql`COALESCE(${data.name || null}, ${departments.name})`,
        updatedAt: _time.now(),
      }).where(eq(departments.id, id)).returning();
      if (!rows[0]) return Err('Departament topilmadi');
      return Ok(this.mapToDepartment(rows[0] as DbRow));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async deleteDepartment(id: string): Promise<Result<void>> {
    try {
      await db.delete(departments).where(eq(departments.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async findPositionById(id: string): Promise<Result<Position>> {
    try {
      const r = await db.select().from(positions).where(eq(positions.id, id)).limit(1).then(r => castTo<DbRow[]>(r));
      if (!r[0]) return Err('Lavoza topilmadi');
      return Ok(this.mapToPosition(r[0]));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async findAllPositions(_filters?: { departmentId?: string; isActive?: boolean }): Promise<Result<Position[]>> {
    try {
      const r = await db.select().from(positions).orderBy(sql`${positions.id}`).then(r => castTo<DbRow[]>(r));
      return Ok((Array.isArray(r) ? r : []).map((row) => this.mapToPosition(row)));
    } catch (e: unknown) {
      this.logger.error(`findAllPositions error: ${errMsg(e)}`);
      return Err(errMsg(e));
    }
  }

  async savePosition(pos: Partial<Position>): Promise<Result<Position>> {
    try {
      const posData = pos as DbRow;
      const rows = await db.insert(positions).values({
        title:        String(posData['title'] || posData['name'] || ''),
        code:         pos.code || '',
        departmentId: (posData['departmentId'] as string) || null,
        level:        pos.level || 1,
        minSalary:    String(posData['minSalary'] || 0),
        maxSalary:    String(posData['maxSalary'] || 0),
        isActive:     pos.isActive ?? true,
      }).returning();
      if (!rows[0]) return Err('Lavozani saqlashda xato');
      return Ok(this.mapToPosition(rows[0] as DbRow));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async updatePosition(id: string, _data: Partial<Position>): Promise<Result<Position>> {
    try {
      const rows = await db.update(positions).set({ updatedAt: _time.now() })
        .where(eq(positions.id, id)).returning();
      if (!rows[0]) return Err('Lavoza topilmadi');
      return Ok(this.mapToPosition(rows[0] as DbRow));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async deletePosition(id: string): Promise<Result<void>> {
    try {
      await db.delete(positions).where(eq(positions.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async findPanelByUserId(userId: string): Promise<Result<Panel | null>> {
    try {
      const result = await db.select().from(userPanels).where(eq(userPanels.userId, userId));
      if (result.length === 0) return Ok(null);
      return Ok(this.mapToPanel(result[0]));
    } catch (error) {
      this.logger.error(
        { method: 'findPanelByUserId', userId, error },
        'Database query failed',
      );
      return Err(`Failed to fetch user panel: ${(error as Error).message}`);
    }
  }

  async savePanelForUser(userId: string, layout: PanelLayout[], name?: string): Promise<Result<Panel>> {
    try {
      const id = createId();
      const now = _time.now();
      const data = { id, userId, name: name || 'My Dashboard', layout: layout || [], isDefault: false, createdAt: now, updatedAt: now };
      const result = await db.insert(userPanels).values(data).returning();
      const created = extractFirst<UserPanelRow>(result as UserPanelRow[] | { rows?: UserPanelRow[] });
      if (!created) return Err('Panelni saqlashda xato');
      return Ok(this.mapToPanel(created));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async updatePanelLayout(userId: string, layout: PanelLayout[]): Promise<Result<Panel>> {
    try {
      const result = await db.update(userPanels).set({ layout: layout || [], updatedAt: _time.now() }).where(eq(userPanels.userId, userId)).returning();
      const updated = extractFirst<UserPanelRow>(result as UserPanelRow[] | { rows?: UserPanelRow[] });
      if (!updated) return Err('Panel topilmadi');
      return Ok(this.mapToPanel(updated));
    } catch (e: unknown) { return Err(errMsg(e)); }
  }

  async getDefaultPanel(): Promise<Result<Panel | null>> {
    try {
      const result = await db.select().from(userPanels).where(eq(userPanels.isDefault, true));
      if (result.length === 0) return Ok(null);
      return Ok(this.mapToPanel(result[0]));
    } catch (error) {
      this.logger.error(
        { method: 'getDefaultPanel', error },
        'Database query failed',
      );
      return Err(`Failed to fetch default panel: ${(error as Error).message}`);
    }
  }

  private mapToDepartment(row: DbRow): Department {
    return new Department(
      String(row['id'] ?? ''), String(row['name_uz'] || row['name'] || row['code'] || ''),
      String(row['code'] ?? ''), (row['manager_id'] as string | null) ?? null,
      (row['parent_id'] as string | null) ?? null, (row['description'] as string | null) ?? null,
      Boolean(row['is_active'] ?? true), new Date(String(row['created_at'] ?? _time.now())),
      new Date(String(row['updated_at'] ?? _time.now())),
    );
  }

  private mapToPosition(row: DbRow): Position {
    return new Position(
      String(row['id'] ?? ''), String(row['name_uz'] || row['name'] || row['code'] || ''),
      String(row['code'] ?? ''), String(row['department_id'] ?? ''), Number(row['level'] ?? 1),
      Number(row['min_salary'] ?? 0), Number(row['max_salary'] ?? 0), Boolean(row['is_active'] ?? true),
      new Date(String(row['created_at'] ?? _time.now())), new Date(String(row['updated_at'] ?? _time.now())),
    );
  }

  private mapToPanel(row: UserPanelRow | DbRow): Panel {
    const r = row as DbRow;
    return new Panel(
      String(r['id'] ?? ''), String(r['userId'] || r['user_id'] || ''), String(r['name'] ?? ''),
      (r['layout'] as PanelLayout[]) || [], Boolean(r['isDefault'] || r['is_default']),
      new Date(String(r['createdAt'] || r['created_at'] || _time.now())),
      new Date(String(r['updatedAt'] || r['updated_at'] || _time.now())),
    );
  }
}
