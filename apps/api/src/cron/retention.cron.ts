import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CronStatusService } from './cron-status.service'
import { DataRetentionRepository } from './repositories/data-retention.repository'

@Injectable()
export class RetentionCron {
  private readonly logger = new Logger(RetentionCron.name)

  constructor(
    private readonly cronStatus: CronStatusService,
    private readonly retentionRepo: DataRetentionRepository,
  ) {}

  @Cron('30 2 * * *')
  async runRetention(): Promise<void> {
    const jobName = 'RetentionCron'
    try {
      await this.retentionRepo.ensureArchiveTables()

      const posCutoff = _time.now()
      posCutoff.setFullYear(posCutoff.getFullYear() - 7)

      const empDocCutoff = _time.now()
      empDocCutoff.setFullYear(empDocCutoff.getFullYear() - 3)

      const mgmtDocCutoff = _time.now()
      mgmtDocCutoff.setFullYear(mgmtDocCutoff.getFullYear() - 10)

      const [posCount, empDocCount, mgmtDocCount] = await Promise.all([
        this.retentionRepo.archivePosMovements(posCutoff),
        this.retentionRepo.archiveEmployeeDocuments(empDocCutoff),
        this.retentionRepo.archiveManagementDocuments(mgmtDocCutoff),
      ])

      this.logger.log(`✅ RetentionCron: pos_archived=${posCount}, emp_docs_archived=${empDocCount}, mgmt_docs_archived=${mgmtDocCount}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) {
      this.logger.error(`❌ RetentionCron error: ${String(err)}`)
      this.cronStatus.recordFailure(jobName, String(err))
    }
  }
}
