import { Result } from '@common/result';

export interface IMaterialsSvcRepository {
  findAll(): Promise<Result<object[]>>;
}

export const MATERIALS_SVC_REPO = 'IMaterialsSvcRepository';
