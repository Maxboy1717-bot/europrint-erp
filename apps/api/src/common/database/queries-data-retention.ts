/**
 * @module queries-data-retention
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import {
  pos_movements_legacy, pos_movements_archive,
  hr_documents_legacy, hr_documents_archive,
} from '@shared/db';
import { and, lt, inArray, notInArray } from 'drizzle-orm';

export async function execArchivePosMovements(cutoff: Date): Promise<number> {
  return db.transaction(async (tx) => {
    const toArchive = await tx
      .select()
      .from(pos_movements_legacy)
      .where(and(
        lt(pos_movements_legacy.created_at, cutoff),
        inArray(pos_movements_legacy.status, ['completed', 'cancelled']),
      ));

    if (toArchive.length === 0) return 0;

    await tx.insert(pos_movements_archive).values(
      (Array.isArray(toArchive) ? toArchive : []).map(row => ({
        id: row.id,
        movement_number: row.movement_number,
        movement_type_id: row.movement_type_id,
        status: row.status,
        from_warehouse_id: row.from_warehouse_id,
        to_warehouse_id: row.to_warehouse_id,
        received_by_employee_id: row.received_by_employee_id,
        created_by: row.created_by,
        supplier_name: row.supplier_name,
        document_number: row.document_number,
        document_date: row.document_date,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        archived_at: new Date(),
        archive_reason: '7-yil POS data retention',
      })),
    ).onConflictDoNothing();

    const ids = (Array.isArray(toArchive) ? toArchive : []).map(r => r.id);
    await tx.delete(pos_movements_legacy).where(inArray(pos_movements_legacy.id, ids));

    return toArchive.length;
  });
}

export async function execArchiveEmployeeDocuments(cutoff: Date): Promise<number> {
  return db.transaction(async (tx) => {
    const toArchive = await tx
      .select()
      .from(hr_documents_legacy)
      .where(and(
        lt(hr_documents_legacy.created_at, cutoff),
        inArray(hr_documents_legacy.status, ['approved', 'rejected', 'archived']),
        notInArray(hr_documents_legacy.document_type, ['management_doc', 'director_order', 'company_policy']),
      ));

    if (toArchive.length === 0) return 0;

    await tx.insert(hr_documents_archive).values(
      (Array.isArray(toArchive) ? toArchive : []).map(row => ({
        id: row.id,
        employee_id: row.employee_id,
        document_type: row.document_type,
        title: row.title,
        content: row.content,
        pdf_url: row.pdf_url,
        status: row.status,
        initiated_by: row.initiated_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        archived_at: new Date(),
        archive_reason: '3-yil ishchi hujjat data retention',
      })),
    ).onConflictDoNothing();

    const ids = (Array.isArray(toArchive) ? toArchive : []).map(r => r.id);
    await tx.delete(hr_documents_legacy).where(inArray(hr_documents_legacy.id, ids));

    return toArchive.length;
  });
}

export async function execArchiveManagementDocuments(cutoff: Date): Promise<number> {
  return db.transaction(async (tx) => {
    const toArchive = await tx
      .select()
      .from(hr_documents_legacy)
      .where(and(
        lt(hr_documents_legacy.created_at, cutoff),
        inArray(hr_documents_legacy.status, ['approved', 'rejected', 'archived']),
        inArray(hr_documents_legacy.document_type, ['management_doc', 'director_order', 'company_policy']),
      ));

    if (toArchive.length === 0) return 0;

    await tx.insert(hr_documents_archive).values(
      (Array.isArray(toArchive) ? toArchive : []).map(row => ({
        id: row.id,
        employee_id: row.employee_id,
        document_type: row.document_type,
        title: row.title,
        content: row.content,
        pdf_url: row.pdf_url,
        status: row.status,
        initiated_by: row.initiated_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        archived_at: new Date(),
        archive_reason: '10-yil rahbar hujjat data retention',
      })),
    ).onConflictDoNothing();

    const ids = (Array.isArray(toArchive) ? toArchive : []).map(r => r.id);
    await tx.delete(hr_documents_legacy).where(inArray(hr_documents_legacy.id, ids));

    return toArchive.length;
  });
}
