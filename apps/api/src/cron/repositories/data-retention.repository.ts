/**
 * @module data-retention.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { ensureDataRetentionArchiveTables } from '@common/database/ddl-migrations';
import { execArchivePosMovements, execArchiveEmployeeDocuments, execArchiveManagementDocuments } from '@common/database/queries-data-retention';

@Injectable()
export class DataRetentionRepository {
  async ensureArchiveTables(): Promise<void> {
    await ensureDataRetentionArchiveTables();
  }

  async archivePosMovements(cutoff: Date): Promise<number> {
    return execArchivePosMovements(cutoff);
  }

  async archiveEmployeeDocuments(cutoff: Date): Promise<number> {
    return execArchiveEmployeeDocuments(cutoff);
  }

  async archiveManagementDocuments(cutoff: Date): Promise<number> {
    return execArchiveManagementDocuments(cutoff);
  }
}
