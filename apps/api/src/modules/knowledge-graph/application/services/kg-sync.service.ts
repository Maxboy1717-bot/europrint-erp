/**
 * @module kg-sync.service
 * @description Turns real, verified golden-thread domain events into
 * kg_nodes/kg_edges rows. Each `upsertFromX` method is called by exactly one
 * thin `@EventsHandler` listener (infrastructure/event-handlers/). Idempotent
 * via the DB-level unique constraints on `kg_nodes`/`kg_edges` (ON CONFLICT
 * DO UPDATE) — a duplicate event fire is a safe no-op, not a double-insert.
 *
 * Entity-type / correlation-key mapping (verified against the real event
 * classes, NOT docs/EVENT_KATALOGI.md — see plan §0):
 *   sales_order        ← OrderCreatedEvent.orderId
 *   production_order    ← PpReleasedEvent.poId / MesCompletedEvent.ppId /
 *                          QcPassedEvent|QcFailedEvent.orderId / WmsGoodsIssuedEvent.payload.ppId
 *                          (same PP-order id space across these 4 events)
 *   production_session  ← MesCompletedEvent.sessionId
 *   qc_inspection        ← QcPassedEvent|QcFailedEvent.inspectionId
 *   material             ← WmsGoodsIssuedEvent.payload.materialId (edge target only,
 *                          no separate node in Faza A — see plan §6 non-goals)
 *
 * NOTE (honest scope limit, Q-40): OrderCreatedEvent's `orderId` (sales order)
 * is NOT correlated to `production_order` here — none of the PP/MES/QC/WMS
 * event payloads carry the originating sales_order_id, so building that edge
 * would require an extra DB lookup this phase intentionally defers rather
 * than fabricate.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { KNOWLEDGE_GRAPH_REPO, type IKnowledgeGraphRepository } from '../../domain/repositories/i-knowledge-graph.repository';

@Injectable()
export class KgSyncService {
  private readonly logger = new Logger(KgSyncService.name);

  constructor(@Inject(KNOWLEDGE_GRAPH_REPO) private readonly repo: IKnowledgeGraphRepository) {}

  async upsertFromOrderCreated(orderId: number, orderNumber: string, totalAmount: number, companyId: number): Promise<void> {
    const r = await this.repo.upsertNode({
      entityType: 'sales_order',
      entityId:   String(orderId),
      title:      orderNumber,
      metadata:   { totalAmount, companyId },
    });
    if (!r.ok) this.logger.warn({ orderId, error: r.error }, 'kg sync: OrderCreatedEvent upsert failed');
  }

  async upsertFromPpReleased(poId: number): Promise<void> {
    const r = await this.repo.upsertNode({
      entityType: 'production_order',
      entityId:   String(poId),
      title:      `PO #${poId}`,
    });
    if (!r.ok) this.logger.warn({ poId, error: r.error }, 'kg sync: PpReleasedEvent upsert failed');
  }

  async upsertFromMesCompleted(sessionId: number, ppId: number): Promise<void> {
    const node = await this.repo.upsertNode({
      entityType: 'production_session',
      entityId:   String(sessionId),
      title:      `Sessiya #${sessionId}`,
    });
    if (!node.ok) {
      this.logger.warn({ sessionId, error: node.error }, 'kg sync: MesCompletedEvent node upsert failed');
      return;
    }
    const edge = await this.repo.upsertEdge({
      sourceType: 'production_order', sourceId: String(ppId),
      targetType: 'production_session', targetId: String(sessionId),
      relationType: 'produced_in',
    });
    if (!edge.ok) this.logger.warn({ sessionId, ppId, error: edge.error }, 'kg sync: MesCompletedEvent edge upsert failed');
  }

  private async upsertQcEdge(inspectionId: string, orderId: number): Promise<void> {
    const node = await this.repo.upsertNode({
      entityType: 'qc_inspection',
      entityId:   inspectionId,
      title:      `QC #${inspectionId}`,
    });
    if (!node.ok) {
      this.logger.warn({ inspectionId, error: node.error }, 'kg sync: QC node upsert failed');
      return;
    }
    const edge = await this.repo.upsertEdge({
      sourceType: 'production_order', sourceId: String(orderId),
      targetType: 'qc_inspection', targetId: inspectionId,
      relationType: 'inspected_by',
    });
    if (!edge.ok) this.logger.warn({ inspectionId, orderId, error: edge.error }, 'kg sync: QC edge upsert failed');
  }

  async upsertFromQcPassed(inspectionId: string, orderId: number): Promise<void> {
    await this.upsertQcEdge(inspectionId, orderId);
  }

  /** Flags the same production_order→qc_inspection edge as broken — the AI-overlay flagship signal. */
  async upsertFromQcFailed(inspectionId: string, orderId: number, reason: string): Promise<void> {
    await this.upsertQcEdge(inspectionId, orderId);
    const r = await this.repo.markEdgeBroken({
      sourceType: 'production_order', sourceId: String(orderId),
      targetType: 'qc_inspection', targetId: inspectionId,
      relationType: 'inspected_by',
      reason: `QC rad etdi: ${reason}`,
    });
    if (!r.ok) this.logger.warn({ inspectionId, orderId, error: r.error }, 'kg sync: QcFailedEvent markEdgeBroken failed');
  }

  async upsertFromWmsGoodsIssued(ppId: number, materialId: number): Promise<void> {
    const edge = await this.repo.upsertEdge({
      sourceType: 'production_order', sourceId: String(ppId),
      targetType: 'material', targetId: String(materialId),
      relationType: 'issued_material',
    });
    if (!edge.ok) this.logger.warn({ ppId, materialId, error: edge.error }, 'kg sync: WmsGoodsIssuedEvent edge upsert failed');
  }
}
