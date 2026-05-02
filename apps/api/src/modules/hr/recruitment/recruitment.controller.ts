import { TashkentTimeService } from '@common/time';
import { RECRUITMENT_LIST_LIMIT } from '@common/constants/app.constants';
const _time = new TashkentTimeService();
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete, Logger, UseInterceptors } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RecruitmentService } from './recruitment.service';
import {
  CreateFunnelDto,
  MoveFunnelStageDto,
  QuickScreeningDto,
  ListFunnelDto,
} from './dto/create-funnel.dto';
import { CreateToolTestDto, ToolTestMatchQueryDto } from './dto/tool-test.dto';
import { CreateProductivityInterviewDto } from './dto/productivity-interview.dto';
import { CreateReferencesCheckDto, UpdateReferencesCheckDto } from './dto/references-check.dto';
import { CreateJobOfferDto, UpdateJobOfferStatusDto } from './dto/job-offer.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';


@ApiTags('HR Rekruter')
@ApiBearerAuth()

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('hr/recruitment')
export class RecruitmentController {
  private readonly logger = new Logger(RecruitmentController.name);
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter', 'SUPER_ADMIN', 'DIRECTOR')
  @ApiOperation({ summary: 'Rekrutment ro\'yxati' })
  async getRecruitmentList(@Query() _query: Record<string, unknown>) {
    const data = await this.recruitmentService.listFunnels({ page: 1, limit: RECRUITMENT_LIST_LIMIT });
    return data;
  }

  // ──────────────────── FUNNEL (Nomzod kuzatuv) ───────────────────────────

  @Post('funnel')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Nomzodni funnelga qo\'shish (HR CAPITAL 3-qadam: Oqim)' })
  @ApiResponse({ status: 201, description: 'Funnel yaratildi' })
  async createFunnel(@Body() dto: CreateFunnelDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.recruitmentService.createFunnel(dto, user.id));
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Funnel ro\'yxati (sahifalash, filtr)' })
  @ApiResponse({ status: 200, description: '{ data, total, page, limit }' })
  async listFunnels(@Query() query: ListFunnelDto) {
    return unwrapOrInternal(await this.recruitmentService.listFunnels(query));
  }

  @Get('funnel/kanban')
  @ApiOperation({ summary: 'Kanban ko\'rinish — barcha bosqichlar guruhlangan' })
  @ApiQuery({ name: 'vacancyId', required: false, type: Number })
  async kanban(@Query('vacancyId') vacancyId?: string) {
    return unwrapOrInternal(await this.recruitmentService.getFunnelKanban(vacancyId ? +vacancyId : undefined));
  }

  @Get('funnel/:id')
  @ApiOperation({ summary: 'Bitta funnel ma\'lumotlari' })
  async getFunnel(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.recruitmentService.getFunnelById(id));
  }

  @Patch('funnel/:id/move')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Funnel bosqichini almashtirish (state machine)' })
  @ApiParam({ name: 'id', description: 'Funnel ID' })
  async moveFunnelStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveFunnelStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.moveFunnelStage(id, dto, user.id));
  }

  @Patch('funnel/:id/screening')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Tez suhbat (4-qadam: Tez qayta ishlash)' })
  async quickScreening(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: QuickScreeningDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.quickScreening(id, dto, user.id));
  }

  // ──────────────────── TOOL TEST (A-J Shaxsiyat testi) ──────────────────

  @Post('tool-test')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Tool Test natijasini kiritish (HR CAPITAL Material #15-35)' })
  @ApiResponse({ status: 201, description: 'Test natijasi va interpretation qaytarildi' })
  async createToolTest(@Body() dto: CreateToolTestDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.recruitmentService.createToolTest(dto, user.id));
  }

  @Get('tool-test/candidate/:candidateId')
  @ApiOperation({ summary: 'Nomzodning barcha Tool Test natijalari' })
  async getToolTestByCandidate(@Param('candidateId', ParseIntPipe) candidateId: number) {
    return unwrapOrInternal(await this.recruitmentService.getToolTestByCandidate(candidateId));
  }

  @Post('tool-test/match')
  @ApiOperation({ summary: 'Tool Test natijasini lavozim ideal profiliga solishtirish' })
  @ApiResponse({ status: 200, description: 'Moslik foizi va tavsiya' })
  async matchPositionProfile(@Body() dto: ToolTestMatchQueryDto) {
    return unwrapOrInternal(await this.recruitmentService.matchPositionProfile(dto.toolTestId, dto.positionKey));
  }

  // ────────────────── PRODUKTIVLIK INTERVYUSI ─────────────────────────────

  @Post('productivity-interview')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Produktivlik intervyusi + Navedenie spravok (HR CAPITAL Material #55)' })
  @ApiResponse({ status: 201, description: 'Intervyu natijasi va klassifikatsiya (FLAGMAN/PROTSESSNIK/TRABLDAYKER)' })
  async createProductivityInterview(
    @Body() dto: CreateProductivityInterviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.createProductivityInterview(dto, user.id));
  }

  @Get('productivity-interview/candidate/:candidateId')
  @ApiOperation({ summary: 'Nomzodning produktivlik intervyulari' })
  async getProductivityInterview(@Param('candidateId', ParseIntPipe) candidateId: number) {
    return unwrapOrInternal(await this.recruitmentService.getProductivityInterview(candidateId));
  }

  // ──────────────────── KANAL ANALITIKASI ─────────────────────────────────

  @Get('channel-analytics')
  @ApiOperation({ summary: 'Yollash kanallari bo\'yicha konversiya analitikasi' })
  @ApiResponse({ status: 200, description: '{ data: ChannelAnalyticsRow[] }' })
  async getChannelAnalytics() {
    return unwrapOrInternal(await this.recruitmentService.getChannelAnalytics());
  }

  // ──────────────────── JOB OFFER ─────────────────────────────────────────

  @Post('job-offers')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Job Offer yaratish va saqlash' })
  @ApiResponse({ status: 201, description: 'Job Offer muvaffaqiyatli saqlandi' })
  async createSimpleJobOffer(@Body() body: CreateJobOfferDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.recruitmentService.createJobOffer(body, user.id));
  }

  // ──────────────────── HAFTALIK STATISTIKA ───────────────────────────────

  @Get('statistics/weekly')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Rekruter haftalik statistikasi (HR CAPITAL gamification)' })
  @ApiQuery({ name: 'recruiterId', required: false, type: Number })
  @ApiQuery({ name: 'weekStart', required: false, type: String, description: 'ISO date (masalan: YYYY-MM-DD)' })
  async getWeeklyStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query('recruiterId') recruiterId?: string,
    @Query('weekStart') weekStart?: string,
  ) {
    const targetRecruiterId = recruiterId ? +recruiterId : user.id;
    const weekDate = weekStart ? new Date(weekStart) : this.getCurrentWeekStart();
    return unwrapOrInternal(await this.recruitmentService.getWeeklyStatistics(targetRecruiterId, weekDate));
  }

  // ──────────────────── HR HEALTH CHECK ───────────────────────────────────

  @Get('health-check')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'HR sog\'lik tekshiruvi — HR CAPITAL 13 ta belgi asosida' })
  @ApiResponse({ status: 200, description: '{ healthScore, status, checks[] }' })
  async runHealthCheck() {
    return unwrapOrInternal(await this.recruitmentService.runHrHealthCheck());
  }

  // ──────────────────── REFERENCES CHECK ──────────────────────────────────

  @Post('references-check')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Navedenie spravok — oldingi ish joyiga qo\'ng\'iroq natijasini saqlash' })
  @ApiResponse({ status: 201, description: 'Reference Check yozuvi yaratildi' })
  async createReferencesCheck(
    @Body() dto: CreateReferencesCheckDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.createReferencesCheck(dto, user.id));
  }

  @Get('references-check/funnel/:funnelId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Funnel bo\'yicha barcha reference check yozuvlari' })
  async getReferencesChecksByFunnel(@Param('funnelId', ParseIntPipe) funnelId: number) {
    return unwrapOrInternal(await this.recruitmentService.getReferencesChecksByFunnel(funnelId));
  }

  @Patch('references-check/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Reference Check natijasini yangilash' })
  async updateReferencesCheck(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReferencesCheckDto,
  ) {
    return unwrapOrInternal(await this.recruitmentService.updateReferencesCheck(id, dto));
  }

  // ──────────────────────── JOB OFFER ─────────────────────────────────────

  @Post('job-offer')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Ish taklifi (Job Offer) yaratish' })
  @ApiResponse({ status: 201, description: 'Job Offer yaratildi' })
  async createJobOffer(
    @Body() dto: CreateJobOfferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.createJobOffer(dto, user.id));
  }

  @Get('job-offer/candidate/:candidateId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Nomzodning barcha Job Offer\'lari' })
  async getJobOffersByCandidate(@Param('candidateId', ParseIntPipe) candidateId: number) {
    return unwrapOrInternal(await this.recruitmentService.getJobOffersByCandidate(candidateId));
  }

  @Get('job-offer/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Bitta Job Offer ma\'lumotlari' })
  async getJobOfferById(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.recruitmentService.getJobOfferById(id));
  }

  @Patch('job-offer/:id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Job Offer statusini yangilash (SENT / ACCEPTED / DECLINED / EXPIRED)' })
  async updateJobOfferStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobOfferStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.updateJobOfferStatus(id, dto));
  }

  // Helper
  private getCurrentWeekStart(): Date {
    const now = _time.now();
    const day = now.getDay(); // 0=yakshanba
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // dushanba
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
}
