/**
 * @module procurement-request.service
 * @description P2P xarid so'rovi yaratish (Increment 1.3). So'rov header + qatorlar yoziladi va
 *   org-sxema bo'yicha tasdiq zanjiri (ProcurementApprovalChainService) `procurement_approvals`
 *   ga pending bosqichlar sifatida biriktiriladi. Returns Result<T>; never throws raw Errors.
 */
import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { TashkentTimeService } from '@common/time';
import { dbRows } from '../../../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { ProcurementApprovalChainService } from './procurement-approval-chain.service';

const _time = new TashkentTimeService();

export interface ProcurementItemInput {
  description: string;
  quantity?: number;
  unit?: string;
  estimatedPrice?: number;
  materialId?: number;
}
export interface CreateProcurementRequestInput {
  requesterEmployeeId: number;
  requesterUserId?: number;
  title: string;
  description?: string;
  vendorId?: number;
  paymentMode?: 'advance' | 'reimburse';
  targetWarehouseType?: string;
  neededByDate?: string;
  currency?: string;
  items: ProcurementItemInput[];
}

@Injectable()
export class ProcurementRequestService {
  private readonly logger = new Logger(ProcurementRequestService.name);
  constructor(private readonly approvalChain: ProcurementApprovalChainService) {}

  /**
   * Xarid so'rovi yaratadi: header + qatorlar + org-sxema tasdiq zanjiri (pending bosqichlar).
   * Status → 'pending_approval'.
   */
  async createRequest(
    input: CreateProcurementRequestInput,
    createdBy?: number,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      if (!input.title?.trim()) throw new BadRequestException('title majburiy');
      if (!input.items?.length) throw new BadRequestException('Kamida 1 qator (item) kerak');
      if (!input.requesterEmployeeId) throw new BadRequestException('requesterEmployeeId majburiy');

      // 1. So'rov beruvchining org-bo'limi (tasdiq zanjiri uchun)
      const deptR = await this.approvalChain.findEmployeeDepartment(input.requesterEmployeeId);
      const orgDepartmentId = deptR.ok ? deptR.data : null;

      // 2. Qatorlar + jami summa
      const lines = input.items.map((it) => {
        const qty = Number(it.quantity ?? 1);
        const price = Number(it.estimatedPrice ?? 0);
        return {
          materialId: it.materialId,
          description: it.description,
          quantity: qty,
          unit: it.unit ?? 'dona',
          estimatedPrice: price,
          lineTotal: qty * price,
        };
      });
      const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);

      // 3. Raqam (PR-YYYY-NNNNN)
      const cntR = await rawSql(sql`SELECT COUNT(*)::int AS c FROM procurement_requests`);
      const count = Number(dbRows(cntR)[0]?.['c'] ?? 0);
      const requestNumber = `PR-${_time.now().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      // 4. Header
      const reqR = await rawSql(sql`
        INSERT INTO procurement_requests
          (request_number, requester_employee_id, requester_user_id, org_department_id, title, description,
           vendor_id, total_amount, currency, payment_mode, target_warehouse_type, status, needed_by_date, created_by)
        VALUES (${requestNumber}, ${input.requesterEmployeeId}, ${input.requesterUserId ?? null}, ${orgDepartmentId},
           ${input.title}, ${input.description ?? null}, ${input.vendorId ?? null}, ${totalAmount},
           ${input.currency ?? 'UZS'}, ${input.paymentMode ?? 'advance'}, ${input.targetWarehouseType ?? null},
           'pending_approval', ${input.neededByDate ?? null}, ${createdBy ?? null})
        RETURNING id
      `);
      const requestId = Number(dbRows(reqR)[0]?.['id']);

      // 5. Qatorlar
      for (const l of lines) {
        await rawSql(sql`
          INSERT INTO procurement_request_items (request_id, material_id, description, quantity, unit, estimated_price, line_total)
          VALUES (${requestId}, ${l.materialId ?? null}, ${l.description}, ${l.quantity}, ${l.unit}, ${l.estimatedPrice}, ${l.lineTotal})
        `);
      }

      // 6. Org-sxema tasdiq zanjiri → procurement_approvals (pending)
      let chain: { approverUserId: number; orgDepartmentId: number; level: number | null; depth: number }[] = [];
      if (orgDepartmentId != null) {
        const chainR = await this.approvalChain.resolveChainFromDepartment(orgDepartmentId, input.requesterUserId);
        if (chainR.ok) chain = chainR.data;
      }
      for (const step of chain) {
        await rawSql(sql`
          INSERT INTO procurement_approvals (request_id, level, org_department_id, approver_user_id, status)
          VALUES (${requestId}, ${step.depth}, ${step.orgDepartmentId}, ${step.approverUserId}, 'pending')
        `);
      }
      if (chain.length === 0) {
        this.logger.warn(`[P2P] So'rov ${requestNumber}: tasdiq zanjiri bo'sh (org-bo'lim/head topilmadi)`);
      }

      return {
        id: requestId,
        requestNumber,
        status: 'pending_approval',
        totalAmount,
        orgDepartmentId,
        approvalSteps: chain.length,
        approvers: chain.map((c) => c.approverUserId),
      };
    });
  }

  /**
   * Tasdiq qadami (Increment 1.4): navbatdagi (eng past) pending bosqich rahbari approve/reject qiladi.
   * approve → keyingi bosqich pending qoladi (current_approval_level oshadi); oxirgi bo'lsa so'rov 'approved'.
   * reject → so'rov darhol 'rejected'. Faqat o'sha bosqichning belgilangan rahbari qaror qila oladi.
   */
  async decideApproval(
    requestId: number,
    approverUserId: number,
    action: 'approve' | 'reject',
    comments?: string,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      const req = dbRows(await rawSql(sql`
        SELECT id, status, current_approval_level FROM procurement_requests WHERE id = ${requestId}
      `))[0];
      if (!req) throw new NotFoundException(`So'rov topilmadi: ${requestId}`);
      if (req['status'] !== 'pending_approval') {
        throw new BadRequestException(`So'rov tasdiq holatida emas (status=${req['status']})`);
      }

      // Navbatdagi pending bosqich (eng past level)
      const step = dbRows(await rawSql(sql`
        SELECT id, level, approver_user_id FROM procurement_approvals
        WHERE request_id = ${requestId} AND status = 'pending'
        ORDER BY level ASC LIMIT 1
      `))[0];
      if (!step) throw new BadRequestException("Pending tasdiq bosqichi yo'q");
      if (Number(step['approver_user_id']) !== approverUserId) {
        throw new ForbiddenException(`Bu bosqichni faqat user ${step['approver_user_id']} tasdiqlaydi`);
      }

      const level = Number(step['level']);
      await rawSql(sql`
        UPDATE procurement_approvals
        SET status = ${action === 'approve' ? 'approved' : 'rejected'}, decided_at = NOW(), comments = ${comments ?? null}
        WHERE id = ${Number(step['id'])}
      `);

      if (action === 'reject') {
        await rawSql(sql`UPDATE procurement_requests SET status = 'rejected', updated_at = NOW() WHERE id = ${requestId}`);
        return { requestId, decision: 'rejected', level, finalized: true, requestStatus: 'rejected' };
      }

      const remaining = Number(dbRows(await rawSql(sql`
        SELECT COUNT(*)::int AS c FROM procurement_approvals WHERE request_id = ${requestId} AND status = 'pending'
      `))[0]?.['c'] ?? 0);

      if (remaining === 0) {
        await rawSql(sql`UPDATE procurement_requests SET status = 'approved', updated_at = NOW() WHERE id = ${requestId}`);
        return { requestId, decision: 'approved', level, finalized: true, requestStatus: 'approved' };
      }
      await rawSql(sql`
        UPDATE procurement_requests SET current_approval_level = ${level + 1}, updated_at = NOW() WHERE id = ${requestId}
      `);
      return { requestId, decision: 'approved', level, finalized: false, requestStatus: 'pending_approval', remainingSteps: remaining };
    });
  }

  /** So'rovni qatorlari + tasdiq bosqichlari bilan qaytaradi. */
  async getRequest(id: number): Promise<Result<Record<string, unknown> | null, AppError>> {
    return safeCall(async () => {
      const req = dbRows(await rawSql(sql`SELECT * FROM procurement_requests WHERE id = ${id}`))[0] ?? null;
      if (!req) return null;
      const items = dbRows(await rawSql(sql`SELECT * FROM procurement_request_items WHERE request_id = ${id} ORDER BY id`));
      const approvals = dbRows(await rawSql(sql`SELECT * FROM procurement_approvals WHERE request_id = ${id} ORDER BY level`));
      return { ...req, items, approvals };
    });
  }
}
