/**
 * @module production.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { I18nService } from 'nestjs-i18n'
import { TelegramService } from '../telegram.service'

interface ShiftHandover {
  shift_number: number
  shift_lead_chat_id: string
  units_produced: number
  quality_issues: number
}

interface MesAlert {
  error_code: string
  equipment_name: string
  technician_chat_id: string
  downtime_minutes: number
}

interface QcResult {
  batch_id: string
  total_units: number
  defective_units: number
  pass_rate: number
  production_lead_chat_id: string
}

@Injectable()
export class ProductionHandler {
  private readonly logger = new Logger(ProductionHandler.name)

  constructor(
    private telegramService: TelegramService,
    private readonly i18n: I18nService,
  ) {}

  @Cron('0 14 * * *')
  async sendMorningShiftHandover(): Promise<void> {
    try {
      const shiftLeadId = process.env.SHIFT_LEAD_CHAT_ID || ''
      const text = await this.i18n.t('telegram.production.morningShiftHandover')
      await this.telegramService.sendMessage(shiftLeadId, text)
      this.logger.log('Morning shift handover reminder sent')
    } catch (err) {
      this.logger.error(`sendMorningShiftHandover error: ${String(err)}`)
    }
  }

  @Cron('0 22 * * *')
  async sendEveningShiftHandover(): Promise<void> {
    try {
      const shiftLeadId = process.env.SHIFT_LEAD_CHAT_ID || ''
      const text = await this.i18n.t('telegram.production.eveningShiftHandover')
      await this.telegramService.sendMessage(shiftLeadId, text)
      this.logger.log('Evening shift handover reminder sent')
    } catch (err) {
      this.logger.error(`sendEveningShiftHandover error: ${String(err)}`)
    }
  }

  async onMesEquipmentFailure(alert: MesAlert): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.production.mesEquipmentFailure', {
        args: {
          equipmentName: alert.equipment_name,
          errorCode: alert.error_code,
          downtimeMinutes: alert.downtime_minutes,
        },
      })
      await this.telegramService.sendMessage(alert.technician_chat_id, text)
      this.logger.log(`MES failure alert sent: ${alert.equipment_name}`)
    } catch (err) {
      this.logger.error(`onMesEquipmentFailure error: ${String(err)}`)
    }
  }

  async onQcResultsReady(result: QcResult): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.production.qcResultsReady', {
        args: {
          batchId: result.batch_id,
          totalUnits: result.total_units,
          defectiveUnits: result.defective_units,
          passRate: result.pass_rate,
        },
      })
      await this.telegramService.sendMessage(result.production_lead_chat_id, text)
      this.logger.log(`QC results notified: ${result.batch_id}`)
    } catch (err) {
      this.logger.error(`onQcResultsReady error: ${String(err)}`)
    }
  }
}
