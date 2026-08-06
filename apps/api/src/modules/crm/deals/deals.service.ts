/**
 * @module deals.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ICrmDealsRepository, CRM_DEALS_REPO } from './i-crm-deals.repo';
import { safeCall, Result, AppError } from '@common/result';
import { crmOwnerScope, crmSeesAllRows, crmResolveOwnerId } from '../common/crm-row-scope';

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

  /**
   * Item 14 (vision 13-crm#14): row-scoped export + audit. A non-privileged manager exports ONLY
   * their own deals (COALESCE(assigned_by_id, manager_id) = self — corrected 2026-07-11, see
   * crm-row-scope.ts module doc comment; assigned_to is superseded as the scoping column);
   * super_admin/admin/director export all. Every export writes an audit_logs row (action='export')
   * — satisfies "eksport urinishi loglanadi". The audit write is NOT best-effort: if it fails the
   * whole export fails (the log is the point of this item).
   */
  async exportDeals(user?: ScopeUser): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const ownerScope = crmOwnerScope(user);
    const result = await this.crmDealsRepo.findAllForExport(ownerScope);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const rows = result.data;
    const auditRes = await this.crmDealsRepo.recordExportAudit({
      userId: user?.id ?? null,
      userRole: user?.role ?? null,
      rowCount: rows.length,
      scoped: ownerScope != null,
    });
    if (!auditRes.ok) throw new InternalServerErrorException(auditRes.error);
    return { data: rows, total: rows.length };

    });}

  async findOne(id: string, user?: ScopeUser) {
    const result = await this.crmDealsRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.dealNotFoundWithId', { args: { id } }));
    // Item A row-scoping — CORRECTED 2026-07-11 (owner interview log; see crm-row-scope.ts module
    // doc comment): a non-privileged caller may only read a deal they own, resolved via
    // crmResolveOwnerId (assigned_by_id, falling back to manager_id — assigned_to is superseded as
    // the authorization source). Same 404 (not 403) so ownership/existence isn't leaked. Privileged
    // roles bypass.
    if (!crmSeesAllRows(user?.role)) {
      const ownerId = crmResolveOwnerId(result.data as Record<string, unknown>);
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

  async update(id: string, dto: Record<string, unknown>, user?: ScopeUser){
    return safeCall(async () => {
    // audit 2026-08-06 T6 (IDOR item 4): was findOne(id) WITHOUT the user — ownership
    // scoping silently skipped, any manager could update any deal. Pass the caller.
    await this.findOne(id, user);
    const result = await this.crmDealsRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async clone(sourceId: string, user?: ScopeUser){
    return safeCall(async () => {
    // Ownership gate (Item A): findOne enforces that a non-privileged manager may only clone a deal
    // they own; privileged roles bypass. It throws NotFound (404) when the source is missing or not
    // owned — safeCall preserves that HTTP status. Then the repo copies the row into a new draft.
    await this.findOne(sourceId, user);
    const result = await this.crmDealsRepo.clone(sourceId, user?.id ?? undefined);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async remove(id: string, user?: ScopeUser){
    return safeCall(async () => {
    // audit 2026-08-06 T6 (IDOR item 4): same fix as update() — enforce ownership.
    await this.findOne(id, user);
    const result = await this.crmDealsRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };

    });}
}
