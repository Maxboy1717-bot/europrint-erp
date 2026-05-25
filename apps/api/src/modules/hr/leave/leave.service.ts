/**
 * @module leave.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IHrLeaveSvcRepository, HR_LEAVE_SVC_REPO } from './i-hr-leave-svc.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    @Inject(HR_LEAVE_SVC_REPO) private readonly hrLeaveSvcRepo: IHrLeaveSvcRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const { page = 1, limit = 10, userId, status, leaveType } = query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await this.hrLeaveSvcRepo.findAll({ limit: Number(limit), offset, userId: userId !== undefined ? Number(userId) : undefined, status: status !== undefined ? String(status) : undefined, leaveType: leaveType !== undefined ? String(leaveType) : undefined });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
  
    });}

  async findOne(id: number) {
    const result = await this.hrLeaveSvcRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.notFound'));
    return result.data;
  }

  async create(dto: Record<string, unknown>){
    const userNotFoundMsg = await this.i18n.t('errors.userNotFound');
    return safeCall(async () => {
    const userResult = await this.hrLeaveSvcRepo.findUserById(Number(dto.userId));
    if (!userResult.ok) throw new InternalServerErrorException(userResult.error);
    if (!userResult.data) throw new NotFoundException(userNotFoundMsg);
    const result = await this.hrLeaveSvcRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async approve(id: number){
    const onlyPendingMsg = await this.i18n.t('errors.onlyPendingApprovable');
    return safeCall(async () => {
    const leave = await this.findOne(id);
    if (leave.status !== 'pending') throw new BadRequestException(onlyPendingMsg);
    const result = await this.hrLeaveSvcRepo.approve(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async reject(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.hrLeaveSvcRepo.reject(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
