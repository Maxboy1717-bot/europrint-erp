/**
 * @module council-members.controller
 * @description Kengash a'zoligi boshqaruvi (modul 04 Coordination, vizyon 04.1/04.2).
 *   Kengashga a'zo qo'shish / rolni o'zgartirish / chiqarish / ro'yxat. Zod (Qoida 3) + Result (Qoida 1).
 * @layer Controller (Director / Coordination)
 */
import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertOk } from '@common/http-result';
import { CouncilMembersRepository } from '../infrastructure/repositories/council-members.repository';
import { CouncilQuorumService } from '../application/council-quorum.service';

const RoleEnum = z.enum(['chair', 'secretary', 'member', 'guest']);

// Batch 5 Item 8 — kengash qarori kvorumini baholash (2/3 + oddiy ko'pchilik, Rais teng-tie).
const EvaluateSchema = z.object({
  presentCount: z.number().int().min(0),
  votesFor:     z.number().int().min(0),
  votesAgainst: z.number().int().min(0),
});

const AddSchema = z.object({
  userId:      z.number().int().positive(),
  role:        RoleEnum.optional().transform(v => v ?? 'member'),
  isPermanent: z.boolean().optional().transform(v => v ?? false),
});

const UpdateSchema = z.object({ role: RoleEnum });

@ApiThrottle()
@ApiTags('Council Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director', 'manager', 'ceo')
@UseInterceptors(AuditInterceptor)
@Controller()
export class CouncilMembersController {
  constructor(
    private readonly repo: CouncilMembersRepository,
    private readonly quorum: CouncilQuorumService,
  ) {}

  // Batch 5 Item 8 — kvorum ma'lumoti: ovoz beruvchi a'zolar soni + 2/3 talab.
  @ApiOperation({ summary: 'Get council quorum (2/3 requirement)' })
  @Get('councils/:councilId/quorum')
  async getQuorum(@Param('councilId') councilId: string) {
    const r = await this.quorum.getQuorum(Number(councilId));
    assertOk(r);
    return r.data;
  }

  // Kengash qarorini kvorum + oddiy ko'pchilik qoidasi bo'yicha baholaydi.
  @ApiOperation({ summary: 'Evaluate a council decision against quorum + majority' })
  @Post('councils/:councilId/quorum/evaluate')
  async evaluateQuorum(@Param('councilId') councilId: string, @Body() body: unknown) {
    const dto = EvaluateSchema.parse(body);
    const r = await this.quorum.evaluateDecision(Number(councilId), dto);
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'List council members' })
  @Get('councils/:councilId/members')
  async list(@Param('councilId') councilId: string) {
    const r = await this.repo.listByCouncil(Number(councilId));
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'Add / upsert council member' })
  @Post('councils/:councilId/members')
  async add(@Param('councilId') councilId: string, @Body() body: unknown) {
    const dto = AddSchema.parse(body);
    const r = await this.repo.add(Number(councilId), dto.userId, dto.role, dto.isPermanent);
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'Update council member role' })
  @Patch('council-members/:id')
  async updateRole(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateSchema.parse(body);
    const r = await this.repo.updateRole(Number(id), dto.role);
    assertOk(r);
    return { success: true };
  }

  @ApiOperation({ summary: 'Remove council member' })
  @Delete('council-members/:id')
  async remove(@Param('id') id: string) {
    const r = await this.repo.remove(Number(id));
    assertOk(r);
    return { success: true };
  }
}
