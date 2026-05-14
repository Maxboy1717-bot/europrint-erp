/**
 * @module knowledge-base.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { z } from 'zod';
import { KnowledgeBaseRepository } from '../../infrastructure/repositories/drizzle-knowledge-base.repo';

export const CreateKnowledgeBaseSchema = z.object({
  title:     z.string().min(1),
  titleRu:   z.string().default(''),
  content:   z.string().default(''),
  contentRu: z.string().default(''),
  category:  z.string().default('other'),
  tags:      z.array(z.string()).default([]),
  order:     z.number().int().default(0),
  isActive:  z.boolean().default(true),
});

export const UpdateKnowledgeBaseSchema = CreateKnowledgeBaseSchema.partial();

export type CreateKnowledgeBaseDto = z.infer<typeof CreateKnowledgeBaseSchema>;
export type UpdateKnowledgeBaseDto = z.infer<typeof UpdateKnowledgeBaseSchema>;

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly repo: KnowledgeBaseRepository) {}

  async findAll(category?: string, search?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.findAll(category, search);
      if (!result.ok) throw new BadRequestException(result.error.message);
      return result.data;
    });
  }

  async findById(id: string) {
    const result = await this.repo.findById(id);
    if (!result.ok) throw new BadRequestException(result.error.message);
    if (!result.data) throw new NotFoundException(`Knowledge base #${id} topilmadi`);
    return result.data;
  }

  async create(body: Record<string, unknown>) {
    const dto = CreateKnowledgeBaseSchema.parse(body);
    const result = await this.repo.insert(dto);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }

  async update(id: string, body: Record<string, unknown>) {
    const dto = UpdateKnowledgeBaseSchema.parse(body);
    const existing = await this.repo.findById(id);
    if (!existing.ok) throw new BadRequestException(existing.error.message);
    if (!existing.data) throw new NotFoundException(`Knowledge base #${id} topilmadi`);
    const result = await this.repo.update(id, dto);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing.ok) throw new BadRequestException(existing.error.message);
    if (!existing.data) throw new NotFoundException(`Knowledge base #${id} topilmadi`);
    const result = await this.repo.remove(id);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }

  async uploadFile(title: string, titleRu: string, category: string, filename: string) {
    const result = await this.repo.insert({
      title,
      titleRu:   titleRu ?? title,
      content:   `Fayl yuklandi: ${filename}`,
      contentRu: `Файл загружен: ${filename}`,
      category:  category ?? 'other',
      tags:      [],
      order:     0,
      isActive:  true,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }
}
