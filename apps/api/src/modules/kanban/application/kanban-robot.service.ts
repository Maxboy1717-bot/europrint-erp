/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   Cross-board safety check via id::text comparison combined with dependent
 *   INSERT ... SELECT statements for tag attachment, plus ON CONFLICT (card_id, tag_id)
 *   DO NOTHING upserts on composite-key junction tables (kanban_card_tags).
 *   Drizzle's onConflictDoNothing does not support multi-column unique targets
 *   with dynamically resolved tag IDs from a sub-select.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module kanban-robot.service
 * @description Generic event→action automation engine for Kanban boards.
 *   Lets non-developers configure rules like "when a card moves to
 *   'Done' column, notify the manager and tag it 'completed'".
 *
 *   Three trigger types are supported:
 *     - `card_moved`     fires when a card changes column
 *     - `card_created`   fires on new card insertion
 *     - `card_completed` fires when a card lands in a "done" column
 *
 *   Each robot is a row in `kanban_robots` with:
 *     - boardId      (scope: this board only)
 *     - trigger      (one of the three above)
 *     - actions[]    (JSON array of typed action descriptors)
 *     - isActive     (kill-switch)
 *
 *   Actions execute sequentially per robot. Errors in one action don't
 *   block the rest — see `_execute` try/catch.
 * @layer Application Service (Kanban — listens to board events)
 *
 * WHY A GENERIC EVENT→ACTION ENGINE (not hardcoded per-board logic)
 *   Each domain that uses kanban (sales pipeline, recruitment, internal
 *   requests, design jobs) wants slightly different automations. Hardcoding
 *   would put domain-specific notification/tagging logic in every domain
 *   module, and rule changes would need a deploy.
 *
 *   With a generic engine:
 *     - HR adds a robot "when candidate moves to 'Hired' → assign onboarding"
 *     - Sales adds "when deal moves to 'Won' → DM the rep"
 *   No code, no deploy. The action types form a small vocabulary
 *   (`notify`, `assign`, `tag`, `move`, `webhook`) shared across domains.
 *
 * WHY ACTIONS RUN SEQUENTIALLY (not in parallel)
 *   Later actions may depend on earlier ones (e.g. "tag the card, then
 *   notify everyone whose tag now matches"). Parallel would race.
 *
 *   The per-robot try/catch ensures one robot's failure doesn't block
 *   sibling robots on the same trigger — important because a misconfigured
 *   webhook URL would otherwise kill all automation for that board.
 *
 * WHY THIS LIVES IN A KANBAN MODULE INSTEAD OF A SHARED 'AUTOMATION' MODULE
 *   The triggers are kanban-shaped (card moved, column id, etc.). A truly
 *   generic automation engine would need a richer event vocabulary and
 *   queue/worker infrastructure that we don't need yet. If/when other
 *   domains want event automation (file uploads, form submissions),
 *   factor up into `automation/` — but premature abstraction would just
 *   add boilerplate.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { KanbanRepository } from '../infrastructure/kanban.repository';

interface RobotAction {
  type: string;
  targetColumnId?: string;
  targetUserId?: string;
  tagName?: string;
  message?: string;
}

/**
 * Robot triggerlarini bajarish uchun servis.
 * KanbanBoardsService dan chaqiriladi.
 */
@Injectable()
export class KanbanRobotService {
  private readonly logger = new Logger(KanbanRobotService.name);

  constructor(private readonly kanbanRepo: KanbanRepository) {}

  // ─── Karta ko'chirilganda ─────────────────────────────────────────────────

  async onCardMoved(data: {
    cardId: string; boardId: string;
    newColumnId: string; oldColumnId?: string;
    ownerUserId?: string | null;
  }): Promise<void> {
    await this._execute('card_moved', data);
  }

  // ─── Karta yaratilganda ───────────────────────────────────────────────────

  async onCardCreated(data: {
    cardId: string; boardId: string; columnId: string;
    ownerUserId?: string | null;
  }): Promise<void> {
    await this._execute('card_created', { ...data, newColumnId: data.columnId });
  }

  // ─── Karta yakunlanganda ──────────────────────────────────────────────────

  async onCardCompleted(data: {
    cardId: string; boardId: string; columnId: string;
    ownerUserId?: string | null;
  }): Promise<void> {
    await this._execute('card_completed', { ...data, newColumnId: data.columnId });
  }

  // ─── Umumiy trigger bajaruvchi ────────────────────────────────────────────

  private async _execute(
    triggerType: string,
    data: { cardId: string; boardId: string; newColumnId: string; ownerUserId?: string | null },
  ): Promise<void> {
    try {
      const robotsResult = await this.kanbanRepo.findActiveRobots(data.boardId, triggerType);
      if (!robotsResult.ok) {
        this.logger.error(`Robot trigger xato (${triggerType}): ${robotsResult.error.message}`);
        return;
      }
      const robots = robotsResult.data;

      for (const robot of robots) {
        const actions: RobotAction[] = Array.isArray(robot.actions)
          ? (robot.actions as RobotAction[])
          : [];

        await Promise.allSettled(
          actions.map(action =>
            this._executeAction(action, { ...data }).catch(err =>
              this.logger.warn(`Robot action xato (${action.type}): ${String(err)}`),
            ),
          ),
        );
      }
    } catch (err) {
      this.logger.error(`Robot trigger xato (${triggerType}): ${String(err)}`);
    }
  }

  private async _executeAction(
    action: RobotAction,
    data: { cardId: string; boardId: string; newColumnId: string; ownerUserId?: string | null },
  ): Promise<void> {
    switch (action.type) {
      case 'move_to_column':
        if (action.targetColumnId) {
          // Target ustun xuddi shu board ga tegishli ekanligini tekshirish
          const colCheck = await runQuery<{ id: string }>(sql`
            SELECT id::text AS id FROM kanban_columns
            WHERE id::text = ${action.targetColumnId}
              AND board_id = ${data.boardId}
              AND deleted_at IS NULL
            LIMIT 1
          `);
          if (!colCheck.rows[0]) {
            this.logger.warn(`move_to_column: ustun ${action.targetColumnId} board ${data.boardId} ga tegishli emas — o'tkazib yuborildi`);
            break;
          }
          await runQuery(sql`
            UPDATE kanban_cards
            SET column_id = ${action.targetColumnId}, updated_at = NOW()
            WHERE id = ${data.cardId} AND deleted_at IS NULL
          `);
        }
        break;

      case 'send_notification':
        if (data.ownerUserId) {
          const notifResult1 = await this.kanbanRepo.insertNotification({
            userId:  Number(data.ownerUserId),
            cardId:  data.cardId,
            type:    'task_assigned',
            title:   action.message ?? 'Robot bildirishnomasi',
            message: `Karta avtomatik harakatga duchor bo'ldi`,
          });
          if (!notifResult1.ok) {
            this.logger.warn(`insertNotification xato: ${notifResult1.error.message}`);
          }
        }
        break;

      case 'assign_user':
        if (action.targetUserId) {
          await runQuery(sql`
            UPDATE kanban_cards
            SET owner_user_id = ${action.targetUserId}, updated_at = NOW()
            WHERE id = ${data.cardId} AND deleted_at IS NULL
          `);
          const notifResult2 = await this.kanbanRepo.insertNotification({
            userId:  Number(action.targetUserId),
            cardId:  data.cardId,
            type:    'task_assigned',
            title:   'Vazifa sizga tayinlandi',
            message: 'Robot tomonidan avtomatik tayinlash',
          });
          if (!notifResult2.ok) {
            this.logger.warn(`insertNotification xato: ${notifResult2.error.message}`);
          }
        }
        break;

      case 'add_tag':
        if (action.tagName) {
          await runQuery(sql`
            INSERT INTO kanban_tags (name, board_id)
            VALUES (${action.tagName}, ${data.boardId})
            ON CONFLICT DO NOTHING
          `);
          await runQuery(sql`
            INSERT INTO kanban_card_tags (card_id, tag_id)
            SELECT ${data.cardId}, t.id::text
            FROM kanban_tags t
            WHERE t.name = ${action.tagName}
              AND t.board_id = ${data.boardId}
            ON CONFLICT (card_id, tag_id) DO NOTHING
          `);
        }
        break;

      // Karta "Done" ustuniga tushganda bog'liq buyurtmani yopish
      case 'close_sales_order': {
        const cardInfo = await runQuery<{ related_type: string; related_id: string }>(sql`
          SELECT related_type, related_id::text AS related_id
          FROM kanban_cards WHERE id = ${data.cardId} AND deleted_at IS NULL LIMIT 1
        `);
        const card = cardInfo.rows[0];
        if (card?.related_type === 'sales_order' && card?.related_id) {
          await runQuery(sql`
            UPDATE sales_orders
            SET status = 'closed', overall_status = 'CLOSED', updated_at = NOW()
            WHERE id = ${card.related_id}::integer
              AND deleted_at IS NULL
              AND status NOT IN ('closed', 'cancelled')
          `);
          this.logger.log(`Robot close_sales_order: buyurtma #${card.related_id} yopildi`);
        }
        break;
      }

      default:
        break;
    }
  }
}
