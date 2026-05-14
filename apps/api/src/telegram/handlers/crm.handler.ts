/**
 * @module crm.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common'
import { TelegramService } from '../telegram.service'

interface Lead {
  id: string
  name: string
  company: string
  phone: string
}

interface Deal {
  id: string
  title: string
  amount: number
  currency: string
  stage: string
  assignee: string
  manager_chat_id: string
  director_chat_id: string
}

@Injectable()
export class CrmHandler {
  private readonly logger = new Logger(CrmHandler.name)

  constructor(private telegramService: TelegramService) {}

  async onLeadCreated(lead: Lead): Promise<void> {
    try {
      const managerChatId = process.env.CRM_MANAGER_CHAT_ID || ''
      const text = `
✅ <b>Yangi Lid Yaratildi</b>

👤 <b>Ism:</b> ${lead.name}
🏢 <b>Kompaniya:</b> ${lead.company}
📱 <b>Telefon:</b> ${lead.phone}

ID: <code>${lead.id}</code>
      `
      await this.telegramService.sendMessage(managerChatId, text)
      this.logger.log(`Lead notified: ${lead.id}`)
    } catch (err) {
      this.logger.error(`onLeadCreated error: ${String(err)}`)
    }
  }

  async onDealWon(deal: Deal): Promise<void> {
    try {
      const text = `
🎉 <b>Deal Yutildi!</b>

📋 <b>Deal:</b> ${deal.title}
💵 <b>Summa:</b> ${deal.amount.toLocaleString()} ${deal.currency}
👤 <b>Mas'ul:</b> ${deal.assignee}

CRM Status: <b>${deal.stage}</b>
      `
      await this.telegramService.sendMessage(deal.manager_chat_id, text)
      await this.telegramService.sendMessage(deal.director_chat_id, text)
      this.logger.log(`Deal won notified: ${deal.id}`)
    } catch (err) {
      this.logger.error(`onDealWon error: ${String(err)}`)
    }
  }
}
