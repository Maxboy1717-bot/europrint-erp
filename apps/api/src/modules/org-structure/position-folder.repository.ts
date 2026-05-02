import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { position_folders, orgDepartments, employeeOrgDepartments } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { ensurePositionFolderTable } from '@common/database/ddl-migrations';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class PositionFolderRepository {
  async ensureTable(): Promise<void> {
    await ensurePositionFolderTable();
  }

  async getFolderItems(nodeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:          position_folders.id,
        nodeId:      position_folders.node_id,
        itemType:    position_folders.item_type,
        title:       position_folders.title,
        url:         position_folders.url,
        description: position_folders.description,
        lmsCourseId: position_folders.lms_course_id,
        createdAt:   position_folders.created_at,
      }).from(position_folders)
        .where(eq(position_folders.node_id, nodeId))
        .orderBy(position_folders.item_type, sql`${position_folders.created_at} DESC`);
      return rows as Row[];
      }, 'DB_ERROR');
  }

  async addFolderItem(
    nodeId: number,
    dto: { itemType: 'document' | 'video' | 'test'; title: string; url?: string; description?: string; lmsCourseId?: number },
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(position_folders).values({
        node_id:       nodeId,
        item_type:     dto.itemType,
        title:         dto.title,
        url:           dto.url ?? null,
        description:   dto.description ?? null,
        lms_course_id: dto.lmsCourseId ?? null,
      }).returning({
        id:          position_folders.id,
        nodeId:      position_folders.node_id,
        itemType:    position_folders.item_type,
        title:       position_folders.title,
        url:         position_folders.url,
        description: position_folders.description,
        lmsCourseId: position_folders.lms_course_id,
        createdAt:   position_folders.created_at,
      });
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async removeFolderItem(itemId: number): Promise<void> {
    await db.delete(position_folders).where(eq(position_folders.id, itemId));
  }

  async getEmployeeFolderItems(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:          position_folders.id,
        nodeId:      position_folders.node_id,
        nodeName:    orgDepartments.name,
        itemType:    position_folders.item_type,
        title:       position_folders.title,
        url:         position_folders.url,
        description: position_folders.description,
        lmsCourseId: position_folders.lms_course_id,
        createdAt:   position_folders.created_at,
      }).from(position_folders)
        .innerJoin(orgDepartments, eq(orgDepartments.id, position_folders.node_id))
        .innerJoin(employeeOrgDepartments, eq(employeeOrgDepartments.org_department_id, position_folders.node_id))
        .where(eq(employeeOrgDepartments.user_id, employeeId))
        .orderBy(position_folders.item_type, sql`${position_folders.created_at} DESC`);
      return rows as Row[];
      }, 'DB_ERROR');
  }
}
