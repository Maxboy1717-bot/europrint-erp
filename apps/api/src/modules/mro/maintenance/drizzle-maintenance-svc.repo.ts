/**
 * @module drizzle-maintenance-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import {
  equipmentMaintenance, mro_equipment, mro_items,
  mro_facilities, mro_cleaning_schedules, mro_pm_schedules,
  mro_utility_readings, mro_canteen_logs,
} from '@shared/db';
import { eq, isNull, desc, count, ilike, sql, sum } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IMaintenanceSvcRepository } from './i-maintenance-svc.repo';

@Injectable()
export class DrizzleMaintenanceSvcRepository implements IMaintenanceSvcRepository {
  async findAll(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(equipmentMaintenance).where(isNull(equipmentMaintenance.deletedAt)).orderBy(desc(equipmentMaintenance.createdAt));
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Texnik xizmatlar topilmadi');
    }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(equipmentMaintenance).where(eq(equipmentMaintenance.id, id));
      return Ok((rows)[0] || null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Texnik xizmat #${id} topilmadi`);
    }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(equipmentMaintenance).values({ ...dto } as typeof equipmentMaintenance.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }

  async findEquipment(limit: number, offset: number): Promise<Result<{ data: Record<string, unknown>[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(mro_equipment).orderBy(desc(mro_equipment.created_at)).limit(limit).offset(offset),
        db.select({ count: count() }).from(mro_equipment),
      ]);
      const mapped = data.map((r) => ({
        id: r.id,
        inventoryNumber: r.inventory_number ?? '',
        name: r.name,
        type: r.category ?? '',
        location: r.location ?? '',
        status: r.status ?? 'active',
        lastMaintenanceDate: r.last_maintenance_date ?? null,
        purchaseDate: r.purchase_date ?? null,
      }));
      return Ok({ data: mapped, count: Number(countResult[0]?.count ?? 0) });
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Jihozlar topilmadi');
    }
  }

  async createEquipment(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const insert: Record<string, unknown> = {
        inventory_number: dto.inventoryNumber ?? null,
        name: dto.name,
        category: dto.type ?? null,
        location: dto.location ?? null,
        purchase_date: dto.purchaseDate ?? null,
        status: 'active',
      };
      const result = await db.insert(mro_equipment).values(insert as typeof mro_equipment.$inferInsert).returning();
      const r = result[0] as Record<string, unknown>;
      return Ok({
        id: r['id'],
        inventoryNumber: r['inventory_number'] ?? '',
        name: r['name'],
        type: r['category'] ?? '',
        location: r['location'] ?? '',
        status: r['status'] ?? 'active',
        lastMaintenanceDate: r['last_maintenance_date'] ?? null,
        purchaseDate: r['purchase_date'] ?? null,
      });
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Jihoz yaratishda xatolik');
    }
  }

  async updateEquipmentStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(mro_equipment)
        .set({ status, updated_at: new Date() })
        .where(eq(mro_equipment.id, id))
        .returning();
      if (!result[0]) return Err(`Jihoz #${id} topilmadi`);
      const r = result[0] as Record<string, unknown>;
      return Ok({
        id: r['id'],
        inventoryNumber: r['inventory_number'] ?? '',
        name: r['name'],
        type: r['category'] ?? '',
        location: r['location'] ?? '',
        status: r['status'] ?? 'active',
        lastMaintenanceDate: r['last_maintenance_date'] ?? null,
        purchaseDate: r['purchase_date'] ?? null,
      });
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Holat yangilashda xatolik');
    }
  }

  async findFacilities(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(mro_facilities).orderBy(desc(mro_facilities.created_at));
      return Ok(rows.map((r) => ({
        id: r.id,
        facilityCode: r.facility_code,
        name: r.name,
        facilityType: r.facility_type ?? 'office',
        totalAreaSqm: r.total_area_sqm !== null ? Number(r.total_area_sqm) : null,
        itemsCount: r.items_count ?? 0,
        responsibleEmployee: r.responsible_employee ?? null,
        status: r.status ?? 'active',
      })));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Binolar topilmadi'); }
  }

  async findCleaningSchedules(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(mro_cleaning_schedules).orderBy(desc(mro_cleaning_schedules.next_due_at));
      return Ok(rows.map((r) => ({
        id: r.id,
        zoneName: r.zone_name,
        taskType: r.task_type ?? 'daily',
        frequency: r.frequency ?? '',
        lastDoneAt: r.last_done_at ? r.last_done_at.toISOString().split('T')[0] : null,
        nextDueAt: r.next_due_at.toISOString().split('T')[0],
        assignedToName: r.assigned_to_name ?? null,
        status: r.status ?? 'pending',
      })));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Tozalash jadvali topilmadi'); }
  }

  async findPmSchedules(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(mro_pm_schedules).orderBy(desc(mro_pm_schedules.next_due_date));
      return Ok(rows.map((r) => ({
        id: r.id,
        equipmentId: r.equipment_id ?? 0,
        equipmentName: r.equipment_name,
        scheduleType: r.schedule_type ?? 'monthly',
        nextDueDate: r.next_due_date,
        lastCompletedDate: r.last_completed_date ?? null,
        intervalDays: r.interval_days ?? 30,
        status: r.status ?? 'scheduled',
        estimatedDurationHours: Number(r.estimated_duration_hours ?? 1),
        assignedTechName: r.assigned_tech_name ?? null,
      })));
    } catch (e: unknown) { return Err((e as Error)?.message || 'PM jadvali topilmadi'); }
  }

  async findUtilityReadings(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(mro_utility_readings).orderBy(desc(mro_utility_readings.reading_date));
      return Ok(rows.map((r) => ({
        id: r.id,
        utilityType: r.utility_type,
        meterCode: r.meter_code,
        facilityName: r.facility_name ?? null,
        currentReading: Number(r.current_reading),
        previousReading: Number(r.previous_reading),
        consumption: Number(r.consumption),
        unit: r.unit ?? 'kWh',
        unitCostUzs: Number(r.unit_cost_uzs ?? 0),
        totalCostUzs: Number(r.total_cost_uzs ?? 0),
        readingDate: r.reading_date,
      })));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Hisoblagichlar topilmadi'); }
  }

  async getCanteenStats(): Promise<Result<Record<string, unknown>>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [todayRows, allRows] = await Promise.all([
        db.select().from(mro_canteen_logs).where(eq(mro_canteen_logs.log_date, today)),
        db.select().from(mro_canteen_logs).orderBy(desc(mro_canteen_logs.log_date)).limit(30),
      ]);
      const totalMealsToday = todayRows.reduce((s, r) => s + (r.portion_count ?? 0), 0);
      const totalEmployeesServed = todayRows.reduce((s, r) => s + (r.employees_served ?? 0), 0);
      const costToday = todayRows.reduce((s, r) => s + Number(r.total_cost ?? 0), 0);
      const costPerMeal = totalMealsToday > 0 ? Math.round(costToday / totalMealsToday) : 0;
      const mealCounts: Record<string, number> = {};
      for (const r of allRows) {
        mealCounts[r.meal_name] = (mealCounts[r.meal_name] ?? 0) + (r.portion_count ?? 0);
      }
      const topMeals = Object.entries(mealCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      return Ok({ totalMealsToday, totalEmployeesServed, costToday, costPerMeal, topMeals, consumption: [] });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Oshxona statistikasi topilmadi'); }
  }

  async findSpareParts(search?: string): Promise<Result<Record<string, unknown>[]>> {
    try {
      const query = db.select().from(mro_items).orderBy(mro_items.name);
      const rows = search
        ? await db.select().from(mro_items).where(ilike(mro_items.name, `%${search}%`)).orderBy(mro_items.name)
        : await query;
      return Ok(rows.map((r) => {
        const qty = Number(r.current_stock ?? 0);
        const minStock = Number(r.min_stock ?? 0);
        const unitCost = Number(r.unit_cost ?? 0);
        return {
          id: r.id,
          partCode: `MRO-${String(r.id).padStart(4, '0')}`,
          name: r.name,
          category: r.category ?? '',
          quantity: qty,
          minStock,
          unit: r.unit ?? 'dona',
          unitCost,
          totalValue: Math.round(qty * unitCost),
          warehouseLocation: r.location ?? null,
          isLow: qty <= minStock,
        };
      }));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ehtiyot qismlar topilmadi'); }
  }
}
