/**
 * @module qc-material-scan.service
 * @description Business-logic service for the per-roll scan log (Vision 09-qc#11).
 *   Delegates to QcMaterialScanRepository; returns Result<T>, never throws.
 */

import { Injectable } from '@nestjs/common';
import {
  QcMaterialScanRepository,
  FindScansFilter,
} from '../infrastructure/repositories/qc-material-scan.repository';

export interface RecordScanDto {
  orderId?: number;
  sessionId?: number;
  lot?: string;
  materialId?: number;
  workCenterId?: number;
  shiftId?: number;
  scannedBy?: number;
  tabletId?: string;
  localSeqNo?: number;
  notes?: string;
}

@Injectable()
export class QcMaterialScanService {
  constructor(private readonly repo: QcMaterialScanRepository) {}

  recordScan(dto: RecordScanDto): ReturnType<QcMaterialScanRepository['recordScan']> {
    return this.repo.recordScan({
      orderId: dto.orderId ?? null,
      sessionId: dto.sessionId ?? null,
      lot: dto.lot ?? null,
      materialId: dto.materialId ?? null,
      workCenterId: dto.workCenterId ?? null,
      shiftId: dto.shiftId ?? null,
      scannedBy: dto.scannedBy ?? null,
      tabletId: dto.tabletId ?? null,
      localSeqNo: dto.localSeqNo ?? null,
      notes: dto.notes ?? null,
    });
  }

  listScans(filter: FindScansFilter): ReturnType<QcMaterialScanRepository['findScans']> {
    return this.repo.findScans(filter);
  }
}
