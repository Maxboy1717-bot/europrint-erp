/**
 * @module knowledge-graph.controller
 * @description REST surface for the AI Bilim Grafigi. Row-level RBAC:
 * `allowedTypes` is ALWAYS computed server-side from `entity-role-map.ts` +
 * the caller's JWT role — never trusted from the client. A non-privileged
 * role gets a silently filtered result (missing entity types), not a 403 on
 * the whole call — Faza A tekshirish rejasi §7 verifies this explicitly.
 */

import { Body, Controller, ForbiddenException, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { unwrapOrThrow } from '@common/http-result';
import { hasAishaRole } from '../../aisha/application/tools/_helpers';
import { ENTITY_TYPE_ROLE_MAP, ALL_ENTITY_TYPES } from '../domain/constants/entity-role-map';
import { KNOWLEDGE_GRAPH_REPO, type IKnowledgeGraphRepository } from '../domain/repositories/i-knowledge-graph.repository';
import {
  NodesQuerySchema, EdgesQuerySchema, SearchQuerySchema, CreateLinkSchema,
  type NodesQueryDto, type EdgesQueryDto, type SearchQueryDto, type CreateLinkDto,
} from './dto/knowledge-graph.dto';

function allowedTypesFor(role: string | undefined | null, requested?: string): string[] {
  const candidates = requested ? [requested] : ALL_ENTITY_TYPES;
  return candidates.filter((t) => {
    const need = ENTITY_TYPE_ROLE_MAP[t];
    return need === null || need === undefined || hasAishaRole(role, need);
  });
}

@ApiTags('Knowledge Graph')
@ApiBearerAuth()
@Controller('knowledge-graph')
@UseGuards(JwtAuthGuard)
export class KnowledgeGraphController {
  constructor(@Inject(KNOWLEDGE_GRAPH_REPO) private readonly repo: IKnowledgeGraphRepository) {}

  @Get('nodes')
  async listNodes(
    @Query(new ZodValidationPipe(NodesQuerySchema)) q: NodesQueryDto,
    @CurrentUser() user: { id: number; role?: string },
  ) {
    const allowedTypes = allowedTypesFor(user.role, q.entityType);
    const result = await this.repo.listNodes({ entityType: q.entityType, query: q.query, limit: q.limit, allowedTypes });
    return { data: unwrapOrThrow(result) };
  }

  @Get('edges')
  async listEdges(
    @Query(new ZodValidationPipe(EdgesQuerySchema)) q: EdgesQueryDto,
    @CurrentUser() user: { id: number; role?: string },
  ) {
    const allowedTypes = allowedTypesFor(user.role, q.sourceType);
    const result = await this.repo.listEdges({ isBroken: q.isBroken, sourceType: q.sourceType, sourceId: q.sourceId, limit: q.limit, allowedTypes });
    return { data: unwrapOrThrow(result) };
  }

  @Get('search')
  async search(
    @Query(new ZodValidationPipe(SearchQuerySchema)) q: SearchQueryDto,
    @CurrentUser() user: { id: number; role?: string },
  ) {
    const allowedTypes = allowedTypesFor(user.role, q.entityType);
    const result = await this.repo.listNodes({ entityType: q.entityType, query: q.query, limit: q.limit, allowedTypes });
    return { data: unwrapOrThrow(result) };
  }

  @Post('links')
  async createLink(
    @Body(new ZodValidationPipe(CreateLinkSchema)) body: CreateLinkDto,
    @CurrentUser() user: { id: number; role?: string },
  ) {
    const allowedTypes = allowedTypesFor(user.role);
    if (!allowedTypes.includes(body.sourceType) || !allowedTypes.includes(body.targetType)) {
      throw new ForbiddenException("Ushbu entity-turlarini bog'lashga ruxsatingiz yo'q");
    }
    const result = await this.repo.createManualLink({ ...body, createdBy: user.id });
    return { data: unwrapOrThrow(result) };
  }
}
