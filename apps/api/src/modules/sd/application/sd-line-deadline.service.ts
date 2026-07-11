/**
 * @module sd-line-deadline.service
 * @description SD per-line deadline scheduling (06-sd #29). Result<T> only; the
 *   controller delegates here and this service delegates to the repository (Qoida 15).
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  ISdLineDeadlineRepo, SD_LINE_DEADLINE_REPO,
  LineDeadlineRow, OrderLineDeadlines, PerLineSchedulingRow, SetLineDeadlineInput,
} from '../domain/repositories/i-sd-line-deadline.repo';

@Injectable()
export class SdLineDeadlineService {
  constructor(
    @Inject(SD_LINE_DEADLINE_REPO) private readonly repo: ISdLineDeadlineRepo,
  ) {}

  getOrderLineDeadlines(orderId: number): Promise<Result<OrderLineDeadlines>> {
    return this.repo.getOrderLineDeadlines(orderId);
  }

  setPerLineScheduling(orderId: number, enabled: boolean): Promise<Result<PerLineSchedulingRow>> {
    return this.repo.setPerLineScheduling(orderId, enabled);
  }

  setLineDeadline(input: SetLineDeadlineInput): Promise<Result<LineDeadlineRow>> {
    return this.repo.setLineDeadline(input);
  }
}
