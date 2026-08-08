/**
 * @module execute-erp-action.tool
 * @description Generic ERP-write dispatcher for AIsha. **NOT an arbitrary
 * executor** — a hard allow-listed `action → handler` registry, each entry
 * delegating to an existing, already-reviewed code path (never raw dynamic
 * dispatch or eval-like execution). HIGH stake: registered in
 * `HIGH_STAKE_TOOLS` (aisha-conversation.service.ts) so every call pauses
 * for human approval via `aisha_pending_approvals` before the registry ever
 * runs — the allow-list here is defense-in-depth UNDERNEATH that HITL gate,
 * not a replacement for it.
 */

import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { UpdateOrderStatusCommand } from '../../../sd/application/commands/update-order-status.handler';
import type { IAishaTool, ToolResult, AishaToolContext } from '../../domain/tool.interface';
import { AssignTaskTool } from './assign-task.tool';
import { CreateReminderTool } from './create-reminder.tool';
import { CreateLinkTool } from './create-link.tool';
import { provSource, provResult } from './_helpers';

type ActionHandler = (params: Record<string, unknown>, ctx: AishaToolContext | undefined) => Promise<Result<ToolResult<unknown>>>;

const ALLOWED_ACTIONS = ['create_task', 'create_reminder', 'change_order_status', 'create_link'] as const;

@Injectable()
export class ExecuteErpActionTool implements IAishaTool {
  readonly definition = {
    name: 'execute_erp_action',
    description:
      "HIGH: Ruxsat etilgan ERP amallaridan birini bajaradi (create_task | create_reminder | " +
      "change_order_status | create_link). Har doim inson tasdig'i talab qilinadi (HITL).",
    input_schema: {
      type: 'object' as const,
      properties: {
        action: { type: 'string', description: ALLOWED_ACTIONS.join(' | ') },
        params: { type: 'object', description: "Tanlangan amal uchun parametrlar" },
      },
      required: ['action', 'params'],
    },
  };

  readonly stakeLevel = 'high' as const;

  private readonly registry: Record<string, ActionHandler>;

  constructor(
    private readonly assignTaskTool: AssignTaskTool,
    private readonly createReminderTool: CreateReminderTool,
    private readonly createLinkTool: CreateLinkTool,
    private readonly commandBus: CommandBus,
  ) {
    this.registry = {
      create_task:         (params) => this.assignTaskTool.execute(params),
      create_reminder:     (params) => this.createReminderTool.execute(params),
      create_link:         (params, ctx) => this.createLinkTool.execute(params, ctx),
      change_order_status: (params, ctx) => this.changeOrderStatus(params, ctx),
    };
  }

  private async changeOrderStatus(params: Record<string, unknown>, _ctx: AishaToolContext | undefined): Promise<Result<ToolResult<unknown>>> {
    const orderId = parseInt(String(params['orderId'] ?? ''), 10);
    const newStatus = String(params['newStatus'] ?? '').trim();
    if (!Number.isFinite(orderId) || !newStatus) return Err(AppErr('VALIDATION', "orderId va newStatus majburiy"));

    return safeCall(async () => {
      const start = Date.now();
      const result = await this.commandBus.execute<UpdateOrderStatusCommand, Result<void>>(
        new UpdateOrderStatusCommand(orderId, newStatus),
      );
      if (!result.ok) throw new Error(result.error.message);
      return provResult({
        data: { orderId, newStatus },
        sources: [provSource({ type: 'database', identifier: 'sales_orders', startMs: start, rowCount: 1 })],
      });
    });
  }

  async execute(input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<unknown>>> {
    const action = String(input['action'] ?? '');
    const params = (input['params'] && typeof input['params'] === 'object' ? input['params'] : {}) as Record<string, unknown>;

    if (!(ALLOWED_ACTIONS as readonly string[]).includes(action)) {
      return Err(AppErr('VALIDATION', `Noma'lum yoki ruxsat etilmagan amal: '${action}'. Ruxsat etilganlar: ${ALLOWED_ACTIONS.join(', ')}`));
    }
    const handler = this.registry[action];
    if (!handler) return Err(AppErr('INTERNAL', `Amal ro'yxatga olinmagan: ${action}`));
    return handler(params, ctx);
  }
}

