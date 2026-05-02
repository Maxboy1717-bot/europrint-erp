import { Result } from '@common/result';
export interface ICrmPipelinesRepository {
  findAll(): Promise<Result<object[]>>;
  findById(id: number): Promise<Result<object | null>>;
  findStagesByCategoryId(categoryId: number): Promise<Result<object[]>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  remove(id: number): Promise<Result<void>>;
}
export const CRM_PIPELINES_REPO = 'ICrmPipelinesRepository';
