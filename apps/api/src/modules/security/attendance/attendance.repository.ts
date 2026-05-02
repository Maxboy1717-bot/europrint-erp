import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { securityAttendance } from '@europrint/schemas';
import { eq, count, desc } from 'drizzle-orm';

@Injectable()
export class AttendanceRepository {
  async findAll(page: number, limit: number): Promise<Result<Record<string, unknown>>> {
  try {  
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(securityAttendance),
        db.select().from(securityAttendance).orderBy(desc(securityAttendance.createdAt)).limit(limit).offset((page - 1) * limit),
      ]);
      return Ok({ data, total: Number(countResult[0]?.count || 0) });  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(id: number): Promise<Result<Record<string, unknown> | null>> {
  try {  
      const rows = await db.select().from(securityAttendance).where(eq(securityAttendance.id, id));
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(row: typeof securityAttendance.$inferInsert): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.insert(securityAttendance).values(row).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, dto: Partial<typeof securityAttendance.$inferInsert>): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.update(securityAttendance).set(dto).where(eq(securityAttendance.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async remove(id: number): Promise<Result<void>> {
  try {  
      await db.delete(securityAttendance).where(eq(securityAttendance.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
