import { Ok, Err, Result, safeCall } from '@common/result';

import { Injectable } from '@nestjs/common';
import { employeeInventoryLedger, db, eq, and, sql } from '@workspace/db';

export interface EmployeeBalance {
  userId: number; materialCardId: number; warehouseId: string;
  netQty: number; balance: number; totalValue: number;
  materialName?: string; isConsumable?: boolean;
}

type Row = Record<string, unknown>;
type LedgerRow = typeof employeeInventoryLedger.$inferSelect;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

const BALANCE_COLS = sql`
  eil.user_id, eil.material_card_id, eil.warehouse_id,
  mc.xom_ashyo AS material_name, mc.is_consumable,
  SUM(CASE WHEN eil.entry_type = 'DEBIT'  THEN eil.quantity::numeric ELSE 0 END)
    - SUM(CASE WHEN eil.entry_type = 'CREDIT' THEN eil.quantity::numeric ELSE 0 END) AS net_qty,
  SUM(CASE WHEN eil.entry_type = 'DEBIT'  THEN eil.total_price::numeric ELSE 0 END)
    - SUM(CASE WHEN eil.entry_type = 'CREDIT' THEN eil.total_price::numeric ELSE 0 END) AS total_value
`;

const mapBalance = (r: Row): EmployeeBalance => ({
  userId: Number(r['user_id']), materialCardId: Number(r['material_card_id']),
  warehouseId: r['warehouse_id'] as string, netQty: Number(r['net_qty']),
  balance: Number(r['net_qty']), totalValue: Number(r['total_value']),
  materialName: r['material_name'] as string, isConsumable: Boolean(r['is_consumable']),
});

@Injectable()
export class EmployeeLedgerRepository {
  async insertEntry(entry: { userId: number; materialCardId: number; warehouseId: string; entryType: 'DEBIT' | 'CREDIT'; quantity: number; unitPrice: number; totalAmount: number; referenceType: string; referenceId: number; notes?: string }): Promise<Result<LedgerRow | undefined>> {
  try {  
      const rows = await db.insert(employeeInventoryLedger).values({ userId: entry.userId, materialCardId: entry.materialCardId, warehouseId: entry.warehouseId, entryType: entry.entryType, quantity: entry.quantity, unitPrice: entry.unitPrice, totalAmount: entry.totalAmount, referenceType: entry.referenceType, referenceId: entry.referenceId, notes: entry.notes }).returning();
      return Ok(rows[0]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getEmployeeBalance(userId: number, materialCardId?: number, warehouseId?: string): Promise<Result<EmployeeBalance[]>>  {
  try {  
      const matFilter = materialCardId ? sql`AND eil.material_card_id = ${materialCardId}` : sql``;
      const whFilter  = warehouseId    ? sql`AND eil.warehouse_id = ${warehouseId}`        : sql``;
      const r = await exec(sql`SELECT ${BALANCE_COLS} FROM employee_inventory_ledger eil LEFT JOIN material_cards mc ON mc.id = eil.material_card_id WHERE eil.user_id = ${userId} ${matFilter} ${whFilter} GROUP BY eil.user_id, eil.material_card_id, eil.warehouse_id, mc.xom_ashyo, mc.is_consumable HAVING SUM(CASE WHEN eil.entry_type = 'DEBIT' THEN eil.quantity::numeric ELSE 0 END) - SUM(CASE WHEN eil.entry_type = 'CREDIT' THEN eil.quantity::numeric ELSE 0 END) > 0`);
      return r.ok ? Ok((r?.data ?? []).map(mapBalance)) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDepartmentBalance(departmentCode: string): Promise<Result<EmployeeBalance[]>>  {
  try {  
      const r = await exec(sql`SELECT ${BALANCE_COLS} FROM employee_inventory_ledger eil LEFT JOIN material_cards mc ON mc.id = eil.material_card_id JOIN users u ON u.id = eil.user_id WHERE u.department_code = ${departmentCode} GROUP BY eil.user_id, eil.material_card_id, eil.warehouse_id, mc.xom_ashyo, mc.is_consumable HAVING SUM(CASE WHEN eil.entry_type = 'DEBIT' THEN eil.quantity::numeric ELSE 0 END) - SUM(CASE WHEN eil.entry_type = 'CREDIT' THEN eil.quantity::numeric ELSE 0 END) > 0`);
      return r.ok ? Ok((r?.data ?? []).map(mapBalance)) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getStatement(userId: number, dateFrom: Date, dateTo: Date): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT eil.*, mc.xom_ashyo AS material_name, mc.unit_of_measure FROM employee_inventory_ledger eil LEFT JOIN material_cards mc ON mc.id = eil.material_card_id WHERE eil.user_id = ${userId} AND eil.created_at >= ${dateFrom} AND eil.created_at <= ${dateTo} ORDER BY eil.created_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async openLiabilityCase(caseNumber: string, data: { userId: number; incidentType: string; incidentDate: Date; description: string; assessedValue?: number; openedBy: number }): Promise<Result<Row | undefined>>  {
  try {  
      const r = await exec(sql`INSERT INTO employee_liability_cases (case_number, user_id, incident_type, incident_date, description, total_liability, currency, status, created_by) VALUES (${caseNumber}, ${data.userId}, ${data.incidentType}, ${data.incidentDate}, ${data.description}, ${data.assessedValue ?? 0}, 'UZS', 'OPEN', ${data.openedBy}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findLedger(userId: number, materialCardId: number | undefined, limit: number, offset: number): Promise<Result<{ items: LedgerRow[]; total: number }>> {
  try {  
      const conditions = [eq(employeeInventoryLedger.userId, userId)];
      if (materialCardId) conditions.push(eq(employeeInventoryLedger.materialCardId, materialCardId));
      const [items, [{ total }]] = await Promise.all([
        db.select().from(employeeInventoryLedger).where(and(...conditions)).limit(limit).offset(offset),
        db.select({ total: sql<number>`count(*)` }).from(employeeInventoryLedger).where(and(...conditions)),
      ]);
      return Ok({ items, total: Number(total) });  } catch (_e) {
    return Err(String(_e));
  }

  }
}
