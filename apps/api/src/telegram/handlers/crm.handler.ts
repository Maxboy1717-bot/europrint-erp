/**
 * @module crm.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
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

  constructor(
    private telegramService: TelegramService,
    private readonly i18n: I18nService,
  ) {}

  async onLeadCreated(lead: Lead): Promise<void> {
    try {
      const managerChatId = process.env.CRM_MANAGER_CHAT_ID || ''
      const text = await this.i18n.t('telegram.crm.leadCreated', {
        args: {
          name: lead.name,
          company: lead.company,
          phone: lead.phone,
          id: lead.id,
        },
      })
      await this.telegramService.sendMessage(managerChatId, text)
      this.logger.log(`Lead notified: ${lead.id}`)
    } catch (err) {
      this.logger.error(`onLeadCreated error: ${String(err)}`)
    }
  }

  async onDealWon(deal: Deal): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.crm.dealWon', {
        args: {
          title: deal.title,
          amount: deal.amount.toLocaleString(),
          currency: deal.currency,
          assignee: deal.assignee,
          stage: deal.stage,
        },
      })
      await this.telegramService.sendMessage(deal.manager_chat_id, text)
      await this.telegramService.sendMessage(deal.director_chat_id, text)
      this.logger.log(`Deal won notified: ${deal.id}`)
    } catch (err) {
      this.logger.error(`onDealWon error: ${String(err)}`)
    }
  }
}
