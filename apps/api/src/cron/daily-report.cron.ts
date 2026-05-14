/**
 * @module daily-report.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { db, hr_daily_reports, hrEmployees, hrPositions } from '@shared/db'
import { and, eq, ilike, isNull, not, notInArray, or } from 'drizzle-orm'
import { CronStatusService } from './cron-status.service'

@Injectable()
export class DailyReportCron {
  private readonly logger = new Logger(DailyReportCron.name)
  constructor(private readonly cronStatus: CronStatusService) {}

  @Cron('0 20 * * 1-5')
  async markAbsentEmployees(): Promise<void> {
    const jobName = 'DailyReportCron'
    try {
      const today = _time.now().toISOString().split('T')[0]

      const alreadyReported = await db
        .select({ employee_id: hr_daily_reports.employee_id })
        .from(hr_daily_reports)
        .where(eq(hr_daily_reports.report_date, today))
      const reportedIds = (Array.isArray(alreadyReported) ? alreadyReported : []).map(r => r.employee_id)

      const baseQuery = db
        .select({ id: hrEmployees.id, position_name: hrPositions.name })
        .from(hrEmployees)
        .leftJoin(hrPositions, eq(hrPositions.id, hrEmployees.position_id))
        .where(
          and(
            eq(hrEmployees.status, 'active'),
            isNull(hrEmployees.deleted_at),
            or(isNull(hrPositions.name), not(ilike(hrPositions.name, '%mashina operator%'))),
            or(isNull(hrPositions.name), not(ilike(hrPositions.name, '%mashin operator%'))),
            or(isNull(hrPositions.name), not(ilike(hrPositions.name, '%machine operator%'))),
            reportedIds.length > 0 ? notInArray(hrEmployees.id, reportedIds) : undefined,
          ),
        )

      const activeEmps = await baseQuery
      if (activeEmps.length === 0) {
        this.logger.log(`✅ DailyReportCron: no absent employees to mark on ${today}`)
        this.cronStatus.recordSuccess(jobName)
        return
      }

      await db.insert(hr_daily_reports).values(
        (Array.isArray(activeEmps) ? activeEmps : []).map(e => ({
          employee_id: e.id,
          report_date: today,
          tasks_completed: '',
          status: 'absent',
          is_auto_absent: true,
        })),
      ).onConflictDoNothing()

      this.logger.log(`✅ DailyReportCron: auto-absent marked for ${activeEmps.length} employees on ${today}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ DailyReportCron error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }
}
