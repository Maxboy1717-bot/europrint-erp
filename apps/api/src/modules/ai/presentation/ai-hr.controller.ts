import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {Controller, Post, Body, Param, ParseIntPipe, UseGuards, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/user.types';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { HrAiService } from '../services/hr-ai.service';
import { HrAiExtService } from '../services/hr-ai-ext.service';
import {
  AiHrClassifyProductivityDtoSchema, AiHrClassifyProductivityDto,
  AiHrInterviewQuestionsDtoSchema, AiHrInterviewQuestionsDto,
  AiHrAnalyzeToolTestDtoSchema, AiHrAnalyzeToolTestDto,
  AiHrOnboardingPlanDtoSchema, AiHrOnboardingPlanDto,
  AiHrPerformanceReviewDtoSchema, AiHrPerformanceReviewDto,
} from './dto/ai-hr.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('AI — HR')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('ai/hr')
export class AiHrController {
  private readonly logger = new Logger(AiHrController.name);
  constructor(
    private readonly hrAi: HrAiService,
    private readonly hrAiExt: HrAiExtService,
  ) {}

  @Post('screen/:candidateId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Nomzodni AI avtomatik skrining qilish' })
  async screenCandidate(@Param('candidateId', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.hrAi.screenCandidate(id, user.id));
  }

  @Post('classify-productivity')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Intervyu izohlariga asoslanib Flagman/Processnik/Unproductive aniqlash' })
  @UsePipes(new ZodValidationPipe(AiHrClassifyProductivityDtoSchema))
  async classifyProductivity(@Body() body: AiHrClassifyProductivityDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.hrAi.classifyProductivity(body.candidateId, body.interviewNotes, user.id));
  }

  @Post('interview-questions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Lavozimga mos intervyu savollarini AI generatsiya qilish' })
  @UsePipes(new ZodValidationPipe(AiHrInterviewQuestionsDtoSchema))
  async generateInterviewQuestions(@Body() body: AiHrInterviewQuestionsDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.hrAi.generateInterviewQuestions(body.positionTitle, body.candidateBackground, user.id));
  }

  @Post('analyze-tool-test/:toolTestId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Tool Test A-J natijasini AI tahlil qilish' })
  @UsePipes(new ZodValidationPipe(AiHrAnalyzeToolTestDtoSchema))
  async analyzeToolTest(@Param('toolTestId', ParseIntPipe) id: number, @Body() body: AiHrAnalyzeToolTestDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.hrAiExt.analyzeToolTest(id, body.positionTitle, user.id));
  }

  @Post('onboarding-plan')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @ApiOperation({ summary: 'Yangi xodim uchun AI onboarding reja generatsiya' })
  @UsePipes(new ZodValidationPipe(AiHrOnboardingPlanDtoSchema))
  async generateOnboardingPlan(@Body() body: AiHrOnboardingPlanDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.hrAiExt.generateOnboardingPlan(body.positionTitle, body.department, body.employeeName, user.id));
  }

  @Post('performance-review/:employeeId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Xodim performance tahlili (AI)' })
  @UsePipes(new ZodValidationPipe(AiHrPerformanceReviewDtoSchema))
  async performanceReview(@Param('employeeId', ParseIntPipe) id: number, @Body() body: AiHrPerformanceReviewDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.hrAiExt.performanceReview(id, body.period, body.kpiData, user.id));
  }
}
