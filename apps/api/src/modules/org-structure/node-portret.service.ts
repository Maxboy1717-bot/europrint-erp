/**
 * @module node-portret.service
 * @description Business-logic service for the org-node "Portret" (lavozim
 *   kartochkasi) wizard + HR requests. Returns Result<T> from @common/result;
 *   never throws raw Errors. Tables are ensured lazily on first miss
 *   (same pattern as PositionFolderService).
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, safeCall, Result, AppError } from '@common/result';
import { NodePortretRepository, HrRequestInput } from './node-portret.repository';

@Injectable()
export class NodePortretService {
  constructor(private readonly repo: NodePortretRepository) {}

  // ─── Portret ───────────────────────────────────────────────────────────────

  async getPortret(nodeId: number): Promise<Result<object, AppError>> {
    let r = await this.repo.getPortret(nodeId);
    if (!r.ok) {
      await safeCall(() => this.repo.ensureTables());
      r = await this.repo.getPortret(nodeId);
    }
    if (!r.ok) return Err(r.error);
    return Ok({ portret: r.data ?? null });
  }

  async savePortret(
    nodeId: number,
    portretData: Record<string, unknown>,
    creatorId: number | null,
  ): Promise<Result<object, AppError>> {
    let r = await this.repo.upsertPortret(nodeId, portretData, creatorId);
    if (!r.ok) {
      await safeCall(() => this.repo.ensureTables());
      r = await this.repo.upsertPortret(nodeId, portretData, creatorId);
    }
    if (!r.ok) return r;
    return Ok({ portret: r.data });
  }

  // ─── HR Requests ─────────────────────────────────────────────────────────────

  async getHrRequests(nodeId: number): Promise<Result<object, AppError>> {
    let r = await this.repo.getHrRequests(nodeId);
    if (!r.ok) {
      await safeCall(() => this.repo.ensureTables());
      r = await this.repo.getHrRequests(nodeId);
    }
    if (!r.ok) return r;
    return Ok({ requests: Array.isArray(r.data) ? r.data : [] });
  }

  async createHrRequest(
    nodeId: number,
    dto: HrRequestInput,
    requesterId: number | null,
  ): Promise<Result<object, AppError>> {
    let r = await this.repo.createHrRequest(nodeId, dto, requesterId);
    if (!r.ok) {
      await safeCall(() => this.repo.ensureTables());
      r = await this.repo.createHrRequest(nodeId, dto, requesterId);
    }
    if (!r.ok) return r;
    return Ok({ request: r.data });
  }
}
