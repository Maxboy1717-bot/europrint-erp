import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { Result, Err } from '@common/result';
import { LmsQuestionnaireRepository } from '../../infrastructure/repositories/drizzle-lms-questionnaire.repo';
import {
  CreateQQuestionDto, UpdateQQuestionDto,
  CreateQResponseDto,
  CreateQTemplateDto, UpdateQTemplateDto,
} from '../../presentation/dto/lms-questionnaire.dto';

const PRIVILEGED_ROLES = new Set([
  'hr_manager', 'training_officer', 'super_admin', 'director',
]);

function isPrivileged(role: string): boolean {
  return PRIVILEGED_ROLES.has(role.toLowerCase());
}

@Injectable()
export class LmsQuestionnaireService {
  constructor(private readonly repo: LmsQuestionnaireRepository) {}

  async listQuestions(): Promise<Result<object[]>> {
    return this.repo.findAllQuestions();
  }

  async createQuestion(dto: CreateQQuestionDto): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveQuestion(castTo<Record<string, unknown>>(dto));
  }

  async updateQuestion(id: string, dto: UpdateQQuestionDto): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateQuestion(id, castTo<Record<string, unknown>>(dto));
  }

  async deleteQuestion(id: string): Promise<Result<void>> {
    return this.repo.deleteQuestion(id);
  }

  async listResponses(questionId?: string): Promise<Result<object[]>> {
    return this.repo.findAllResponses(questionId);
  }

  async createResponse(dto: CreateQResponseDto, userId: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveResponse(castTo<Record<string, unknown>>(dto), userId);
  }

  async getResponse(
    id: string,
    user: { id: number; role: string },
  ): Promise<Result<Record<string, unknown>>> {
    if (!isPrivileged(user.role)) {
      return Err('Bu ma\'lumotga kirish huquqi yo\'q');
    }
    return this.repo.findResponseById(id);
  }

  async listTemplates(): Promise<Result<object[]>> {
    return this.repo.findAllTemplates();
  }

  async getTemplate(id: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.findTemplateById(id);
  }

  async createTemplate(dto: CreateQTemplateDto, userId: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveTemplate(castTo<Record<string, unknown>>(dto), userId);
  }

  async updateTemplate(id: string, dto: UpdateQTemplateDto): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateTemplate(id, castTo<Record<string, unknown>>(dto));
  }

  async deleteTemplate(id: string): Promise<Result<void>> {
    return this.repo.deleteTemplate(id);
  }

  async listQuestionnaireQuestions(templateId?: string): Promise<Result<object[]>> {
    return this.repo.findQuestionnaireQuestions(templateId);
  }

  async createQuestionnaireQuestion(dto: CreateQQuestionDto): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveQuestionnaireQuestion(castTo<Record<string, unknown>>(dto));
  }

  async deleteQuestionnaireQuestion(id: string): Promise<Result<void>> {
    return this.repo.deleteQuestionnaireQuestion(id);
  }

  async exportResponse(
    id: string,
    user: { id: number; role: string },
  ): Promise<Result<Record<string, unknown>>> {
    if (!isPrivileged(user.role)) {
      return Err('Bu ma\'lumotga kirish huquqi yo\'q');
    }
    return this.repo.findResponseById(id);
  }
}
