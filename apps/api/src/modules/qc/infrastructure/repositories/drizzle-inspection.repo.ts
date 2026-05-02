import { Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { db, qc_inspections } from '@shared/db';
import { execQcInspectionUpsert } from '@common/database/queries-remaining';
import { Inspection } from '../../domain/aggregates/inspection.aggregate';
import { IQcRepository } from '../../application/repositories/qc.repository';
import { InspectionStatus } from '../../domain/enums/inspection-status.enum';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleQcInspectionRepository implements IQcRepository {
  private readonly logger = new Logger(DrizzleQcInspectionRepository.name);

  async save(inspection: Inspection): Promise<void> {
    await execQcInspectionUpsert(inspection);
  }

  async findById(id: string): Promise<Inspection | null> {
    try {
      const rows = await db.select().from(qc_inspections).where(eq(qc_inspections.id, id)).limit(1);
      const row = rows[0] as Row | undefined;
      if (!row) return null;
      const inspection = new Inspection(Number(row['order_id']), String(row['batch_id'] ?? ''), Number(row['inspector_id']), Number(row['sample_size']));
      inspection.id = String(row['id'] ?? '');
      inspection.status = String(row['status'] ?? 'pending') as InspectionStatus;
      inspection.defectsFoundCount = Number(row['defects_found_count'] ?? 0);
      return inspection;
    } catch (error: unknown) {
      this.logger.error('Failed to find inspection: ' + (error as Error).message);
      return null;
    }
  }

  async findByOrderId(orderId: number): Promise<Inspection[]> {
    const rows = await db.select().from(qc_inspections).where(eq(qc_inspections.reference_id, String(orderId)));
    return rows.map((row) => {
      const inspection = new Inspection(Number((row as Row)['order_id']), String((row as Row)['batch_id'] ?? ''), Number((row as Row)['inspector_id']), Number((row as Row)['sample_size']));
      inspection.id = String((row as Row)['id'] ?? '');
      inspection.status = String((row as Row)['status'] ?? 'pending') as InspectionStatus;
      inspection.defectsFoundCount = Number((row as Row)['defects_found_count'] ?? 0);
      return inspection;
    });
  }

  async delete(id: string): Promise<void> {
    await db.delete(qc_inspections).where(eq(qc_inspections.id, id));
  }
}
