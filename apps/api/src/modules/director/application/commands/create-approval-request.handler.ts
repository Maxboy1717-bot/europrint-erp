/**
 * @module create-approval-request.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO, IApprovalRepo } from '../../domain/repositories/i-approval.repo';
import { ApprovalStatus } from '../../domain/enums/hitl-document-type.enum';
import { CreateApprovalRequestCommand } from './create-approval-request.command';
import { HitlApprovalRequestedEvent } from '../../domain/events/hitl-approval-requested.event';
import { WorkflowRulesService } from '../workflow-rules.service';
import {
  ApprovalStepsRepository,
  ApprovalStepInput,
} from '../../infrastructure/repositories/approval-steps.repository';

@CommandHandler(CreateApprovalRequestCommand)
export class CreateApprovalRequestHandler
  implements ICommandHandler<CreateApprovalRequestCommand>
{
  private readonly logger = new Logger(CreateApprovalRequestHandler.name);

  constructor(
    @Inject(APPROVAL_REPO) private readonly approvalRepo: IApprovalRepo,
    private readonly eventBus: EventBus,
    private readonly workflowRules: WorkflowRulesService,
    private readonly stepsRepo: ApprovalStepsRepository,
  ) {}

  async execute(
    command: CreateApprovalRequestCommand,
  ): Promise<Result<ApprovalRequest>> {
    // Check idempotency: findExistingPending
    const existingResult = await this.approvalRepo.findExistingPending(
      command.documentType,
      command.documentId,
    );

    if (!existingResult.ok) {
      return existingResult as Result<ApprovalRequest>;
    }

    if (existingResult.data) {
      this.logger.warn(
        `Tasdiqlash so'rovi allaqachon mavjud: ${command.documentId}`,
      );
      return {
        ok: true,
        data: existingResult.data,
      };
    }

    // Save new approval request
    const approval = new ApprovalRequest(
      '',
      command.documentType,
      command.documentId,
      command.documentNumber,
      command.amount,
      command.currency,
      ApprovalStatus.PENDING,
      command.requestedBy,
      null,
      null,
      null,
      null,
      null,
      command.notes,
      _time.now(),
      _time.now(),
    );

    const saveResult = await this.approvalRepo.save(approval);

    if (!saveResult.ok) {
      return saveResult;
    }

    // Emit event
    await this.eventBus.publish(new HitlApprovalRequestedEvent(
      saveResult.data.id,
      saveResult.data.documentType,
      saveResult.data.documentId,
      saveResult.data.amount,
      saveResult.data.currency,
      saveResult.data.requestedBy,
      saveResult.data.createdAt,
    ));

    // Resolve the GORIZONTAL approval chain and persist it as ordered steps.
    // Best-effort: a missing dept / empty chain / step failure must NOT fail the
    // approval creation (the request itself is already saved). Logged + ignored.
    await this.persistChain(
      Number(saveResult.data.id),
      command.documentType,
      command.requesterUserId,
    );

    this.logger.log(
      `Tasdiqlash so'rovi yaratildi: ${saveResult.data.id} (${command.documentType})`,
    );

    return saveResult;
  }

  /**
   * Resolve the active workflow chain for (documentType, requester dept) and
   * freeze it into approval_request_steps as ordered pending rows. Graceful:
   * no dept or no rule → zero step rows, no error surfaced to the caller.
   */
  private async persistChain(
    approvalRequestId: number,
    documentType: string,
    requesterUserId: number,
  ): Promise<void> {
    const deptResult = await this.stepsRepo.getUserOrgDepartmentId(requesterUserId);
    if (!deptResult.ok) {
      this.logger.warn(`Step chain: dept lookup failed: ${deptResult.error.message}`);
      return;
    }
    const sourceDeptId = deptResult.data;
    if (sourceDeptId == null) {
      // No org department → no horizontal chain. Graceful empty case.
      return;
    }

    const chainResult = await this.workflowRules.resolve(documentType, sourceDeptId);
    if (!chainResult.ok) {
      this.logger.warn(`Step chain: resolve failed: ${chainResult.error.message}`);
      return;
    }

    const rules = Array.isArray(chainResult.data) ? chainResult.data : [];
    if (rules.length === 0) return; // no rule for this dept/type → no steps

    const steps: ApprovalStepInput[] = rules.map((r, idx) => {
      const num = (v: unknown): number | null =>
        v == null ? null : Number(v);
      return {
        workflow_rule_id: num(r['id']),
        step_order: num(r['step_order']) ?? idx + 1,
        source_department_id: num(r['source_department_id']),
        approver_department_id: num(r['approver_department_id']),
        approver_function_id: num(r['approver_function_id']),
      };
    });

    const insertResult = await this.stepsRepo.insertSteps(approvalRequestId, steps);
    if (!insertResult.ok) {
      this.logger.warn(`Step chain: insert failed: ${insertResult.error.message}`);
    }
  }
}
