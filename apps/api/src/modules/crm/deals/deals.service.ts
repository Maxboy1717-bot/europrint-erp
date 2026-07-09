/**
 * @module deals.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ICrmDealsRepository, CRM_DEALS_REPO } from './i-crm-deals.repo';
import { safeCall, Result, AppError } from '@common/result';
import { crmOwnerScope, crmSeesAllRows } from '../common/crm-row-scope';

/** Minimal user shape used for row-scoping (id + role from the JWT). */
type ScopeUser = { id?: number | null; role?: string | null } | null | undefined;

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(
    @Inject(CRM_DEALS_REPO) private readonly crmDealsRepo: ICrmDealsRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}, user?: ScopeUser): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const MAX_PAGE_LIMIT = 100;
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number((query.limit as number | undefined) ?? 10)));
    const offset = (page - 1) * limit;
    // Item A row-scoping: non-privileged callers see only their own deals; privileged see all.
    const ownerScope = crmOwnerScope(user);
    const result = await this.crmDealsRepo.findAll(limit, offset, ownerScope);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, total };

    });}

  async findOne(id: string, user?: ScopeUser) {
    const result = await this.crmDealsRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.dealNotFoundWithId', { args: { id } }));
    // Item A row-scoping: a non-privileged caller may only read a deal they own (assigned_to = self);
    // same 404 (not 403) so ownership/existence isn't leaked. Privileged roles bypass.
    if (!crmSeesAllRows(user?.role)) {
      const ownerRaw = (result.data as Record<string, unknown>).assigned_to;
      const ownerId = ownerRaw != null ? Number(ownerRaw) : null;
      if (ownerId == null || ownerId !== (user?.id ?? -1)) {
        throw new NotFoundException(await this.i18n.t('errors.dealNotFoundWithId', { args: { id } }));
      }
    }
    return result.data;
  }

  async create(dto: Record<string, unknown>, createdBy?: number){
    return safeCall(async () => {
    const result = await this.crmDealsRepo.create(dto, createdBy);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async update(id: string, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.crmDealsRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async remove(id: string){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.crmDealsRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };

    });}
}
