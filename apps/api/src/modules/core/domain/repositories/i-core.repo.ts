/**
 * @module i-core.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { Panel } from '../aggregates/panel.aggregate';

export interface ICoreRepo {
  findPanelByUserId(userId: string): Promise<Result<Panel | null>>;
  savePanelForUser(userId: string, layout: Panel['layout'], name?: string): Promise<Result<Panel>>;
  updatePanelLayout(userId: string, layout: Panel['layout']): Promise<Result<Panel>>;
  getDefaultPanel(): Promise<Result<Panel | null>>;
}

export const CORE_REPO = Symbol('CORE_REPO');
