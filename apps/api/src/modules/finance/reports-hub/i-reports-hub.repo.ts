import { Result } from '@common/result';

export interface IReportsHubRepository {
  getSummary(): Promise<Result<Record<string, unknown>>>;
}

export const REPORTS_HUB_REPO = 'IReportsHubRepository';
