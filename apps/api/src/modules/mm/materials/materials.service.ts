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
    const rawPage  = Number(query.page);
    const rawLimit = Number(query.limit);
    const page  = Number.isFinite(rawPage)  && rawPage  > 0 ? Math.floor(rawPage)  : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 200) : 20;
    const total = rows.length;
    const data = (rows as Record<string, unknown>[]).slice((page - 1) * limit, page * limit).map((r) => ({
      ...r,
      costPerUnit: Number(r['costPerUnit'] || 0),
      quantityOnHand: Number(r['quantityOnHand'] || 0),
    }));
    return { data, pagination: { total, page, limit } };
  
    });}
}
