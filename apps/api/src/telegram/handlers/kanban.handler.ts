import { Injectable, Logger } from '@nestjs/common'
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

  constructor(private telegramService: TelegramService) {}

  async onTaskAssigned(task: Task): Promise<void> {
    try {
      const priorityEmoji = {
        HIGH: '🔴',
        MEDIUM: '🟡',
        LOW: '🟢',
      }
      const emoji = priorityEmoji[task.priority as keyof typeof priorityEmoji] || '⚪'

      const text = `
${emoji} <b>Vazifa Tayinlandi!</b>

📝 <b>Vazifa:</b> ${task.title}
👤 <b>Mas'ul:</b> ${task.assignee_name}
📅 <b>Muddati:</b> ${task.due_date}
🎯 <b>Prioritet:</b> ${task.priority}

ID: <code>${task.id}</code>
      `
      await this.telegramService.sendMessage(task.assignee_chat_id, text)
      this.logger.log(`Task assigned notified: ${task.id}`)
    } catch (err) {
      this.logger.error(`onTaskAssigned error: ${String(err)}`)
    }
  }

  async onTaskDueSoon(task: Task): Promise<void> {
    try {
      const text = `
⏰ <b>Vazifa Muddati Yaqinlashdi!</b>

📝 <b>Vazifa:</b> ${task.title}
📅 <b>Muddati:</b> ${task.due_date}
⏳ <b>Qolgan:</b> ${task.days_until_due} kun

Tezda tugatishni boshlang!
      `
      await this.telegramService.sendMessage(task.assignee_chat_id, text)
      this.logger.log(`Task due soon reminder: ${task.id}`)
    } catch (err) {
      this.logger.error(`onTaskDueSoon error: ${String(err)}`)
    }
  }
}
