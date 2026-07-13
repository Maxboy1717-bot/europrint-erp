/**
 * @module leads.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ICrmLeadsRepository, CRM_LEADS_REPO } from './i-crm-leads.repo';
import { safeCall, Result, AppError } from '@common/result';
import { crmOwnerScope, crmSeesAllRows } from '../common/crm-row-scope';

/** Minimal user shape used for row-scoping (id + role from the JWT). */
type ScopeUser = { id?: number | null; role?: string | null } | null | undefined;

@Injectable()
export class LeadsService {

  constructor(
    @Inject(CRM_LEADS_REPO) private readonly crmLeadsRepo: ICrmLeadsRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}, user?: ScopeUser): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    // Item A row-scoping — CORRECTED 2026-07-11 (owner interview log; see crm-row-scope.ts module
    // doc comment): non-privileged callers see only their own leads, resolved via
    // COALESCE(assigned_by_id, manager_id) — assigned_to is superseded as the scoping column;
    // super_admin/admin/director see all (ownerScope == null → no filter).
    const ownerScope = crmOwnerScope(user);
    const result = await this.crmLeadsRepo.findAll(limit, offset, ownerScope);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };

    });}

  async findOne(id: number, user?: ScopeUser) {
    const result = await this.crmLeadsRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.leadNotFoundWithId', { args: { id } }));
    // Item A row-scoping — CORRECTED 2026-07-11 (owner interview log; see crm-row-scope.ts module
    // doc comment): a non-privileged caller may only read a lead they own. Return the same 404 (not
    // 403) so ownership/existence isn't leaked. mapLeadRow resolves the authoritative owner id as
    // `ownerId` (assigned_by_id, falling back to manager_id via crmResolveOwnerId) — the pre-existing
    // `assignedById` field (sourced from assigned_to) stays for display only; it is superseded as
    // the authorization source. Privileged roles bypass.
    if (!crmSeesAllRows(user?.role)) {
      const ownerRaw = (result.data as Record<string, unknown>).ownerId;
      const ownerId = ownerRaw != null ? Number(ownerRaw) : null;
      if (ownerId == null || ownerId !== (user?.id ?? -1)) {
        throw new NotFoundException(await this.i18n.t('errors.leadNotFoundWithId', { args: { id } }));
      }
    }
    return result.data;
  }

  async create(dto: Record<string, unknown>, createdBy?: number){
    return safeCall(async () => {
    const result = await this.crmLeadsRepo.create(dto, createdBy);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.crmLeadsRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.crmLeadsRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };

    });}

  /** A3: logs an outbound email as a real lead activity (honest queued record, not fake-sent). */
  async logEmail(leadId: number, subject: string, body: string, managerId: number | null){
    return safeCall(async () => {
    await this.findOne(leadId); // 404 if the lead does not exist
    const result = await this.crmLeadsRepo.logEmail(leadId, subject, body, managerId);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
    });}
}
