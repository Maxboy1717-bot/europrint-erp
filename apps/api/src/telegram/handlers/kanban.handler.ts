/**
 * @module kanban.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { TelegramService } from '../telegram.service'

interface Task {
  id: string
  title: string
  priority: string
  due_date: string
  assignee_name: string
  assignee_chat_id: string
  days_until_due: number
}

@Injectable()
export class KanbanHandler {
  private readonly logger = new Logger(KanbanHandler.name)

  constructor(
    private telegramService: TelegramService,
    private readonly i18n: I18nService,
  ) {}

  async onTaskAssigned(task: Task): Promise<void> {
    try {
      const priorityEmoji = {
        HIGH: '🔴',
        MEDIUM: '🟡',
        LOW: '🟢',
      }
      const emoji = priorityEmoji[task.priority as keyof typeof priorityEmoji] || '⚪'

      const text = await this.i18n.t('telegram.kanban.taskAssigned', {
        args: {
          emoji,
          title: task.title,
          assigneeName: task.assignee_name,
          dueDate: task.due_date,
          priority: task.priority,
          id: task.id,
        },
      })
      await this.telegramService.sendMessage(task.assignee_chat_id, text)
      this.logger.log(`Task assigned notified: ${task.id}`)
    } catch (err) {
      this.logger.error(`onTaskAssigned error: ${String(err)}`)
    }
  }

  async onTaskDueSoon(task: Task): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.kanban.taskDueSoon', {
        args: {
          title: task.title,
          dueDate: task.due_date,
          daysUntilDue: task.days_until_due,
        },
      })
      await this.telegramService.sendMessage(task.assignee_chat_id, text)
      this.logger.log(`Task due soon reminder: ${task.id}`)
    } catch (err) {
      this.logger.error(`onTaskDueSoon error: ${String(err)}`)
    }
  }
}
