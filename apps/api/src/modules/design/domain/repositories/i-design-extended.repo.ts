/**
 * @module i-design-extended.repo
 * @description Domain repository interface for design extended ops
 *   (orders, dashboard, revisions, notifications, AI generation).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/design-extended.repository.ts`.
 * @layer Domain (Design)
 */

import type { Result } from '@common/result';

export interface IDesignExtendedRepo {
  findOrdersList(): Promise<Result<object[]>>;
  findDashboardSummary(): Promise<Result<{
    byStatus: Record<string, number>;
    totalOrders: number;
    pendingApproval: number;
    failedChecks: number;
    wornTooling: number;
  }>>;
  findOrderRevisions(orderId: string): Promise<Result<object[]>>;
  findNotification(id: string): Promise<Result<{ id: string; read: boolean } | null>>;
  markNotificationRead(id: string): Promise<Result<void>>;
  updateOrderStatus(
    orderId: string,
    newStatus: string,
  ): Promise<Result<{ id: string; status: string }>>;
  findTemplates(): Promise<Result<{ id: string; name: string; category: string }[]>>;
  generateDesigns(
    orderId: string,
    prompt: string,
    count: number,
  ): Promise<Result<{ designs: unknown[]; generationTime: number }>>;
  verifyDesign(
    designId: string,
    checkTypes: string[],
  ): Promise<Result<{ checks: Record<string, unknown>; overallScore: number }>>;
  generateMockup(
    designId: string,
    productType: string,
  ): Promise<Result<{ mockupUrl: string; designId: string; productType: string }>>;
  approveDesign(designId: string): Promise<Result<{ id: string; status: string }>>;
  rejectDesign(
    designId: string,
    reason: string,
  ): Promise<Result<{ id: string; status: string; reason: string }>>;
}

export const DESIGN_EXTENDED_REPO = Symbol('DESIGN_EXTENDED_REPO');
