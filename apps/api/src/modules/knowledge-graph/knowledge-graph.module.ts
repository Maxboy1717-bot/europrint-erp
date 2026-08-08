/**
 * @module knowledge-graph.module
 * @description AI Bilim Grafigi — native ERP-ichi graf (owner 2026-08-08).
 * Faza A: sxema + sinxronizatsiya (6 haqiqiy voqea) + REST + AIsha tool'lar
 * uchun repository. Faza B (Canvas UI) alohida FE ishi, backend o'zgarishsiz.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KnowledgeGraphController } from './presentation/knowledge-graph.controller';
import { KgSyncService } from './application/services/kg-sync.service';
import { DrizzleKnowledgeGraphRepository } from './infrastructure/repositories/drizzle-knowledge-graph.repository';
import { KNOWLEDGE_GRAPH_REPO } from './domain/repositories/i-knowledge-graph.repository';
import { OrderCreatedKgListener } from './infrastructure/event-handlers/order-created-kg.listener';
import { PpReleasedKgListener } from './infrastructure/event-handlers/pp-released-kg.listener';
import { MesCompletedKgListener } from './infrastructure/event-handlers/mes-completed-kg.listener';
import { QcPassedKgListener } from './infrastructure/event-handlers/qc-passed-kg.listener';
import { QcFailedKgListener } from './infrastructure/event-handlers/qc-failed-kg.listener';
import { WmsGoodsIssuedKgListener } from './infrastructure/event-handlers/wms-goods-issued-kg.listener';

const listeners = [
  OrderCreatedKgListener,
  PpReleasedKgListener,
  MesCompletedKgListener,
  QcPassedKgListener,
  QcFailedKgListener,
  WmsGoodsIssuedKgListener,
];

@Module({
  imports: [CqrsModule],
  controllers: [KnowledgeGraphController],
  providers: [
    { provide: KNOWLEDGE_GRAPH_REPO, useClass: DrizzleKnowledgeGraphRepository },
    KgSyncService,
    ...listeners,
  ],
  exports: [KNOWLEDGE_GRAPH_REPO],
})
export class KnowledgeGraphModule {}
