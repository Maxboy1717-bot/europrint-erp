/**
 * @module materials.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IMaterialsSvcRepository, MATERIALS_SVC_REPO } from './i-materials-svc.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(@Inject(MATERIALS_SVC_REPO) private readonly materialsSvcRepo: IMaterialsSvcRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.materialsSvcRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const rows = result.data;
    const { page = 1, limit = 20 } = query;
    const total = rows.length;
    const data = (rows as Record<string, unknown>[]).slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit)).map((r) => ({
      ...r,
      costPerUnit: Number(r['costPerUnit'] || 0),
      quantityOnHand: Number(r['quantityOnHand'] || 0),
    }));
    return { data, pagination: { total, page, limit } };
  
    });}
}
