/**
 * @module enrollments.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Inject, Logger} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ILmsEnrollmentsRepository, LMS_ENROLLMENTS_REPO } from './i-lms-enrollments.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @Inject(LMS_ENROLLMENTS_REPO) private readonly lmsEnrollmentsRepo: ILmsEnrollmentsRepository,
    private readonly i18n: I18nService,
  ) {}

  async enroll(userId: number, courseId: number, dueAt?: Date | null): Promise<Result<object, AppError>> {
    const alreadyEnrolledMsg = await this.i18n.t('errors.alreadyEnrolled');
    return safeCall(async () => {
    const courseResult = await this.lmsEnrollmentsRepo.findCourseById(courseId);
    if (!courseResult.ok) throw new InternalServerErrorException(courseResult.error);
    if (!courseResult.data) throw new NotFoundException(`Kurs #${courseId} topilmadi`);

    const existResult = await this.lmsEnrollmentsRepo.findExistingEnrollment(userId, courseId);
    if (!existResult.ok) throw new InternalServerErrorException(existResult.error);
    if (existResult.data) throw new ConflictException(alreadyEnrolledMsg);

    const result = await this.lmsEnrollmentsRepo.enroll({ userId, courseId, dueAt });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async findAll(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.lmsEnrollmentsRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.lmsEnrollmentsRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Yozuv #${id} topilmadi`);
    return result.data;
  }

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.lmsEnrollmentsRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.lmsEnrollmentsRepo.remove(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}
}
