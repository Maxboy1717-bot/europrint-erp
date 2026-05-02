import { Injectable, BadRequestException } from '@nestjs/common';
import { Ok, Result, safeCall } from '@common/result';
import { OrderStatusRepository } from './order-status.repository';

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['incomplete', 'cancelled'],
  incomplete: ['pending_design', 'pending_sample_lab', 'pending_manager_completion', 'cancelled'],
  pending_design: ['pending_manager_completion', 'cancelled'],
  pending_sample_lab: ['pending_manager_completion', 'cancelled'],
  pending_manager_completion: ['pending_technology', 'cancelled'],
  pending_technology: ['pending_advance', 'incomplete', 'cancelled'],
  pending_advance: ['ready_for_planning', 'cancelled'],
  ready_for_planning: ['planned', 'pending_advance', 'cancelled'],
  planned: ['released_to_production', 'ready_for_planning', 'cancelled'],
  released_to_production: ['in_production', 'cancelled'],
  in_production: ['pending_qc_final', 'cancelled'],
  pending_qc_final: ['ready_for_fg_warehouse', 'qc_failed', 'rework'],
  qc_failed: ['rework', 'cancelled'],
  rework: ['in_production', 'pending_qc_final', 'cancelled'],
  ready_for_fg_warehouse: ['in_fg_warehouse'],
  in_fg_warehouse: ['delivery_planned'],
  delivery_planned: ['in_delivery', 'in_fg_warehouse'],
  in_delivery: ['delivered', 'in_fg_warehouse'],
  delivered: ['partially_paid', 'fully_paid'],
  partially_paid: ['fully_paid'],
  fully_paid: [],
  cancelled: [],
};

@Injectable()
export class OrderStatusService {
  constructor(private readonly repo: OrderStatusRepository) {}

  getStatusChain(): Result<{ chain: string[]; transitions: Record<string, string[]> }> {
    return Ok({ chain: Object.keys(STATUS_TRANSITIONS), transitions: STATUS_TRANSITIONS });
  }

  async getStatusLog(orderId: string) {
    return this.repo.getStatusLog(orderId);
  }

  async transition(orderId: string, body: Record<string, unknown>, userId: number) {
    return safeCall(async () => {
      const newStatus = String(body['status'] ?? '');
      if (!newStatus) throw new BadRequestException('status talab qilinadi');
      const log = await this.repo.insertTransitionLog(orderId, newStatus, userId, body['notes']);
      await this.repo.updateOrderStatus(orderId, newStatus);
      return { success: true, log };
    });
  }

  async designApproved(orderId: string, userId: number) {
    return safeCall(async () => {
      await this.repo.insertDesignApprovalLog(orderId, userId);
      await this.repo.updateOrderStatus(orderId, 'pending_technology');
      return { success: true };
    });
  }

  async techApproved(orderId: string) {
    return safeCall(async () => {
      await this.repo.updateOrderStatus(orderId, 'pending_advance');
      return { success: true };
    });
  }

  async advanceReceived(orderId: string) {
    return safeCall(async () => {
      await this.repo.updateOrderStatus(orderId, 'ready_for_planning');
      return { success: true };
    });
  }

  async qcResult(orderId: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const passed = body['passed'] === true || body['passed'] === 'true';
      const newStatus = passed ? 'ready_for_fg_warehouse' : 'qc_failed';
      await this.repo.updateOrderStatus(orderId, newStatus);
      return { success: true, status: newStatus };
    });
  }

  async mesComplete(orderId: string) {
    return safeCall(async () => {
      await this.repo.updateOrderStatus(orderId, 'pending_qc_final');
      return { success: true };
    });
  }

  async deliveryFailed(orderId: string) {
    return safeCall(async () => {
      await this.repo.updateOrderStatus(orderId, 'in_fg_warehouse');
      return { success: true };
    });
  }
}
