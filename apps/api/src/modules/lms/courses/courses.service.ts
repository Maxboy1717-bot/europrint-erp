import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { ILmsCoursesRepository, LMS_COURSES_REPO } from './i-lms-courses.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(@Inject(LMS_COURSES_REPO) private readonly lmsCoursesRepo: ILmsCoursesRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.lmsCoursesRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.lmsCoursesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Kurs #${id} topilmadi`);
    const [modulesResult, testsResult] = await Promise.all([
      this.lmsCoursesRepo.findModulesByCourseId(id),
      this.lmsCoursesRepo.findTestsByCourseId(id),
    ]);
    if (!modulesResult.ok) throw new InternalServerErrorException(modulesResult.error);
    if (!testsResult.ok) throw new InternalServerErrorException(testsResult.error);
    return { ...result.data, modules: modulesResult.data, tests: testsResult.data };
  }

  async create(dto: Record<string, unknown>, createdBy?: number){
    return safeCall(async () => {
    const result = await this.lmsCoursesRepo.create(dto, createdBy);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    this.logger.log(`courses: yangilanmoqda`);
    await this.findOne(id);
    const result = await this.lmsCoursesRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    this.logger.log(`courses: o'chirilmoqda`);
    await this.findOne(id);
    const result = await this.lmsCoursesRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}
}
