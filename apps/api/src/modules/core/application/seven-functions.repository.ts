import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { sql, eq } from 'drizzle-orm';
import { db } from '@shared/db';
import { seven_functions, seven_function_kpis } from '@shared/db';
import { hrEmployees } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class SevenFunctionsRepository {
  async listFunctions(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:           seven_functions.id,
        name:         seven_functions.name,
        description:  seven_functions.description,
        owner_id:     seven_functions.owner_id,
        order_index:  seven_functions.order_index,
        created_by:   seven_functions.created_by,
        created_at:   seven_functions.created_at,
        updated_at:   seven_functions.updated_at,
        owner_name:   sql<string>`COALESCE(${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}, '')`,
      })
        .from(seven_functions)
        .leftJoin(hrEmployees, eq(hrEmployees.id, seven_functions.owner_id))
        .orderBy(seven_functions.order_index, seven_functions.name).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getFunction(id: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:           seven_functions.id,
        name:         seven_functions.name,
        description:  seven_functions.description,
        owner_id:     seven_functions.owner_id,
        order_index:  seven_functions.order_index,
        created_by:   seven_functions.created_by,
        created_at:   seven_functions.created_at,
        updated_at:   seven_functions.updated_at,
        owner_name:   sql<string>`COALESCE(${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}, '')`,
      })
        .from(seven_functions)
        .leftJoin(hrEmployees, eq(hrEmployees.id, seven_functions.owner_id))
        .where(eq(seven_functions.id, id)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async createFunction(name: string, description: string | null, ownerId: number, orderIndex: number, createdBy: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(seven_functions).values({
        name, description, owner_id: ownerId, order_index: orderIndex, created_by: createdBy,
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateFunction(id: number, name: string | null, description: string | null, ownerId: number | null, orderIndex: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(seven_functions).set({
        name:        sql`COALESCE(${name}, ${seven_functions.name})`,
        description: sql`COALESCE(${description}, ${seven_functions.description})`,
        owner_id:    sql`COALESCE(${ownerId}::int, ${seven_functions.owner_id})`,
        order_index: sql`COALESCE(${orderIndex}::int, ${seven_functions.order_index})`,
        updated_at:  _time.now(),
      }).where(eq(seven_functions.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteFunction(id: number): Promise<void> {
    await db.delete(seven_functions).where(eq(seven_functions.id, id));
  }

  async getFunctionKpis(functionId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:               seven_function_kpis.id,
        function_id:      seven_function_kpis.function_id,
        name:             seven_function_kpis.name,
        target_value:     seven_function_kpis.target_value,
        actual_value:     seven_function_kpis.actual_value,
        unit:             seven_function_kpis.unit,
        responsible_id:   seven_function_kpis.responsible_id,
        frequency:        seven_function_kpis.frequency,
        created_at:       seven_function_kpis.created_at,
        updated_at:       seven_function_kpis.updated_at,
        responsible_name: sql<string>`COALESCE(${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}, '')`,
      })
        .from(seven_function_kpis)
        .leftJoin(hrEmployees, eq(hrEmployees.id, seven_function_kpis.responsible_id))
        .where(eq(seven_function_kpis.function_id, functionId))
        .orderBy(seven_function_kpis.name).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async createKpi(functionId: number, name: string, targetValue: number | null, unit: string, responsibleId: number | null, frequency: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(seven_function_kpis).values({
        function_id: functionId, name, target_value: targetValue !== null ? String(targetValue) : null, unit,
        responsible_id: responsibleId ?? null, frequency,
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateKpi(id: number, name: string | null, targetValue: number | null, actualValue: number | null, unit: string | null, responsibleId: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(seven_function_kpis).set({
        name:           sql`COALESCE(${name}, ${seven_function_kpis.name})`,
        target_value:   sql`COALESCE(${targetValue}::numeric, ${seven_function_kpis.target_value})`,
        actual_value:   sql`COALESCE(${actualValue}::numeric, ${seven_function_kpis.actual_value})`,
        unit:           sql`COALESCE(${unit}, ${seven_function_kpis.unit})`,
        responsible_id: sql`COALESCE(${responsibleId}::int, ${seven_function_kpis.responsible_id})`,
        updated_at:     _time.now(),
      }).where(eq(seven_function_kpis.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteKpi(id: number): Promise<void> {
    await db.delete(seven_function_kpis).where(eq(seven_function_kpis.id, id));
  }

  async getFunctionForAnalysis(functionId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(seven_functions).where(eq(seven_functions.id, functionId)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getKpisForAnalysis(functionId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(seven_function_kpis).where(eq(seven_function_kpis.function_id, functionId)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }
}
