/**
 * @module question-bank.controller
 * @description HTTP routes for AI-imtihon savollar banki (`hr_question_bank`, EP-ORG-046) — HR
 *   savol/tayanch-javob CRUD. `AiExamController.assignToCard` shu jadvaldan SELECT qiladi
 *   (drizzle-ai-exam.repo.ts assignExamToCard); bu controller yagona YOZUV yo'li (jadval avval
 *   faqat o'qilardi). Mirrors RazryadController/ErrorCatalogController: Zod-validated,
 *   Result-unwrapped. Soft-delete = is_active=false (table has NO deleted_at).
 */

import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query,
  UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { QuestionBankService } from './question-bank.service';
import type { QuestionBankInput } from './question-bank.repository';

/** hr_question_bank_category_check (SQLSTATE 23514) — DB CHECK bilan bir xil ro'yxat. */
const QUESTION_CATEGORIES = ['technical', 'behavioral', 'iq', 'leadership', 'tool', 'origin', 'replication'] as const;

const QuestionBankCreateSchema = z.object({
  /** NULL/omitted = karta-turidan mustaqil (umumiy savol); raqam = o'sha org_function'ga xos. */
  orgFunctionId:    z.number().int().positive().nullable().optional(),
  category:         z.enum(QUESTION_CATEGORIES),
  questionUz:       z.string().min(1).max(5000),
  questionRu:       z.string().max(5000).nullable().optional(),
  expectedKeywords: z.array(z.string().min(1).max(200)).max(50).optional(),
  difficulty:       z.number().int().min(1).max(5).optional(),
  lang:             z.string().min(2).max(5).optional(),
  /** NULL/omitted = razryaddan mustaqil (barcha razryadga ko'rinadi). */
  razryadLevelId:   z.number().int().positive().nullable().optional(),
}).strict();

const QuestionBankUpdateSchema = QuestionBankCreateSchema.partial();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Question Bank')
@ApiBearerAuth()
@Controller('org-structure/question-bank')
export class QuestionBankController {
  private readonly logger = new Logger(QuestionBankController.name);
  constructor(private readonly service: QuestionBankService) {}

  @ApiOperation({ summary: "List AI-exam question bank (hr_question_bank). ?orgFunctionId= bo'lsa faqat o'sha karta-turi" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('orgFunctionId') orgFunctionId?: string, @Query('all') all?: string) {
    const oid = orgFunctionId != null && orgFunctionId !== '' ? Number(orgFunctionId) : null;
    const includeArchived = all === 'true' || all === '1';
    const data = unwrapOrInternal(await this.service.list(Number.isFinite(oid as number) ? oid : null, includeArchived));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get question bank entry by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.findById(id));
  }

  @ApiOperation({ summary: 'Create question bank entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request / invalid org_function_id or razryad_level_id' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = QuestionBankCreateSchema.parse(body) as QuestionBankInput;
    this.logger.log('Creating question-bank entry');
    return unwrapOrThrow(await this.service.create(dto));
  }

  @ApiOperation({ summary: 'Update question bank entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = QuestionBankUpdateSchema.parse(body) as QuestionBankInput;
    return unwrapOrThrow(await this.service.update(id, dto));
  }

  @ApiOperation({ summary: 'Soft-delete (archive) question bank entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.softDelete(id));
  }
}
