/**
 * @module chat-room-users.repository
 * @description User lookup helpers extracted from chat-room.repository.ts to stay <300 lines.
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, and, or, isNull, sql } from 'drizzle-orm';
import { orgDepartments, employeeOrgDepartments, appUsers, adminsTable } from '@shared/db';
import { safeCall, Result } from '@common/result';

@Injectable()
export class ChatRoomUsersRepository {
  private readonly logger = new Logger(ChatRoomUsersRepository.name);

  async findUserDepartments(userId: number): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({ id: orgDepartments.id, name: orgDepartments.name })
        .from(orgDepartments)
        .innerJoin(employeeOrgDepartments, eq(employeeOrgDepartments.org_department_id, orgDepartments.id))
        .where(and(eq(employeeOrgDepartments.user_id, userId), eq(orgDepartments.is_active, true)));
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findAllEmployees(search?: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: appUsers.id,
          fullName: appUsers.full_name,
          employeeId: appUsers.employee_id,
          avatarUrl: appUsers.profile_image_url,
          departmentName: sql<string>`(
            SELECT d.name FROM org_departments d
            JOIN employee_org_departments eod ON eod.org_department_id = d.id
            WHERE eod.user_id = users.id LIMIT 1
          )`,
        })
        .from(appUsers)
        .where(
          and(
            isNull(appUsers.deleted_at),
            // Accept active users OR users with no status set (NULL)
            or(
              eq(appUsers.status, 'active'),
              isNull(appUsers.status),
            ),
            search ? sql`${appUsers.full_name} ILIKE ${'%' + search + '%'}` : undefined,
          ),
        )
        .orderBy(appUsers.full_name)
        .limit(100);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findUserByAdminId(rawId: string): Promise<Result<string | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ username: adminsTable.username })
        .from(adminsTable)
        .where(sql`${adminsTable.id}::text = ${rawId}`)
        .limit(1);
      return row ? row.username as string : null;
      }, 'DB_ERROR');
  }

  async findUserIdByUsername(username: string): Promise<Result<number | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.username, username))
        .limit(1);
      return row ? Number(row.id) : null;
      }, 'DB_ERROR');
  }

  async findUserById(rawId: string): Promise<Result<number | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(sql`${appUsers.id}::text = ${rawId}`)
        .limit(1);
      return row ? Number(row.id) : null;
      }, 'DB_ERROR');
  }

  async findTodayBirthdays(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: appUsers.id,
          fullName: appUsers.full_name,
          avatarUrl: appUsers.profile_image_url,
          birthDate: sql<string>`${appUsers.birth_date}`,
        })
        .from(appUsers)
        .where(
          and(
            isNull(appUsers.deleted_at),
            sql`TO_CHAR(${appUsers.birth_date}::date, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')`,
            sql`${appUsers.birth_date} IS NOT NULL`,
          ),
        )
        .limit(50);
      return castTo<Record<string, unknown>[]>(rows);
    }, 'DB_ERROR');
  }
}
