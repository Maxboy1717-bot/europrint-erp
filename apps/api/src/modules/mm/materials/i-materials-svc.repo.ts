/**
 * @module i-materials-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface IMaterialsSvcRepository {
  findAll(): Promise<Result<object[]>>;
}

export const MATERIALS_SVC_REPO = 'IMaterialsSvcRepository';
