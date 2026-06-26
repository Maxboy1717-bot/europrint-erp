/**
 * @module card-required-knowledge.service
 * @description Business-logic service for KARTAga kerakli domen-bilim (EP-ORG-122, T11-03).
 *   Returns Result<T> / throws Nest HTTP exceptions for the controller; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { z } from 'zod';
import {
  CardRequiredKnowledgeRepository,
  CardRequiredKnowledgeRow,
} from '../../infrastructure/repositories/drizzle-card-required-knowledge.repo';

// 'critical' = MES/oylik bloklovchi talab, 'required' = majburiy, 'recommended' = tavsiya.
export const KNOWLEDGE_IMPORTANCE = ['critical', 'required', 'recommended'] as const;

export const CreateCardKnowledgeSchema = z.object({
  cardId:          z.coerce.number().int().positive(),
  knowledgeName:   z.string().min(1).max(500),
  knowledgeNameRu: z.string().max(500).optional(),
  description:     z.string().max(4000).optional(),
  category:        z.string().max(100).optional(),
  importance:      z.enum(KNOWLEDGE_IMPORTANCE).default('required'),
  courseId:        z.coerce.number().int().positive().nullish(),
  sortOrder:       z.coerce.number().int().default(0),
  isActive:        z.boolean().default(true),
});

// Update: cardId is immutable here (knowledge belongs to one card); everything else optional.
export const UpdateCardKnowledgeSchema = CreateCardKnowledgeSchema.omit({ cardId: true }).partial();

export type CreateCardKnowledgeDto = z.infer<typeof CreateCardKnowledgeSchema>;
export type UpdateCardKnowledgeDto = z.infer<typeof UpdateCardKnowledgeSchema>;

@Injectable()
export class CardRequiredKnowledgeService {
  constructor(private readonly repo: CardRequiredKnowledgeRepository) {}

  async listByCard(cardId: number): Promise<Result<CardRequiredKnowledgeRow[], AppError>> {
    return safeCall(async () => {
      const result = await this.repo.findByCard(cardId);
      if (!result.ok) throw new BadRequestException(result.error.message);
      return result.data;
    });
  }

  async findById(id: number): Promise<CardRequiredKnowledgeRow> {
    const result = await this.repo.findById(id);
    if (!result.ok) throw new BadRequestException(result.error.message);
    if (!result.data) throw new NotFoundException(`Domen-bilim #${id} topilmadi`);
    return result.data;
  }

  async create(body: unknown, createdBy?: number): Promise<CardRequiredKnowledgeRow> {
    const dto = CreateCardKnowledgeSchema.parse(body);
    const result = await this.repo.insert({
      card_id:           dto.cardId,
      knowledge_name:    dto.knowledgeName,
      knowledge_name_ru: dto.knowledgeNameRu ?? null,
      description:       dto.description ?? null,
      category:          dto.category ?? null,
      importance:        dto.importance,
      course_id:         dto.courseId ?? null,
      sort_order:        dto.sortOrder,
      is_active:         dto.isActive,
      created_by:        createdBy ?? null,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }

  async update(id: number, body: unknown): Promise<CardRequiredKnowledgeRow> {
    const dto = UpdateCardKnowledgeSchema.parse(body);
    const patch: Record<string, unknown> = {};
    if (dto.knowledgeName !== undefined) patch.knowledge_name = dto.knowledgeName;
    if (dto.knowledgeNameRu !== undefined) patch.knowledge_name_ru = dto.knowledgeNameRu;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.category !== undefined) patch.category = dto.category;
    if (dto.importance !== undefined) patch.importance = dto.importance;
    if (dto.courseId !== undefined) patch.course_id = dto.courseId;
    if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;
    if (dto.isActive !== undefined) patch.is_active = dto.isActive;

    const result = await this.repo.update(id, patch);
    if (!result.ok) throw new BadRequestException(result.error.message);
    if (!result.data) throw new NotFoundException(`Domen-bilim #${id} topilmadi`);
    return result.data;
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    const result = await this.repo.softDelete(id);
    if (!result.ok) throw new BadRequestException(result.error.message);
    if (!result.data) throw new NotFoundException(`Domen-bilim #${id} topilmadi`);
    return { id: result.data.id, deleted: true };
  }
}
