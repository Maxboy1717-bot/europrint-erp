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
import { CouncilVotesRepository } from '../infrastructure/repositories/council-votes.repository';

const RoleEnum = z.enum(['chair', 'secretary', 'member', 'guest']);
const VoteEnum = z.enum(['for', 'against', 'abstain']);

// Batch 5 Item 8 — kengash qarori kvorumini baholash (2/3 + oddiy ko'pchilik, Rais teng-tie).
// Owner decision 2026-07-13 (chat): eski aggregat-integer yo'l (presentCount/votesFor/votesAgainst)
// o'zgarmasdan ishlaydi (Q-46, yagona chaqiruvchi shu controller edi); yangi decisionRef berilsa
// council_votes jadvalidagi haqiqiy ovozlardan tally hisoblanadi (aggregat maydonlar e'tiborga olinmaydi).
const EvaluateSchema = z.object({
  presentCount: z.number().int().min(0).optional(),
  votesFor:     z.number().int().min(0).optional(),
  votesAgainst: z.number().int().min(0).optional(),
  decisionRef:  z.string().min(1).max(200).optional(),
}).refine(
  d => d.decisionRef !== undefined
    || (d.presentCount !== undefined && d.votesFor !== undefined && d.votesAgainst !== undefined),
  { message: 'decisionRef YOKI presentCount+votesFor+votesAgainst kerak' },
);

// Owner decision 2026-07-13 (chat) — per-member vote logging (council_votes).
const RecordVoteSchema = z.object({
  decisionRef:  z.string().min(1).max(200),
  voterUserId:  z.number().int().positive(),
  vote:         VoteEnum,
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
    private readonly votes: CouncilVotesRepository,
  ) {}

  // Batch 5 Item 8 — kvorum ma'lumoti: ovoz beruvchi a'zolar soni + 2/3 talab.
  @ApiOperation({ summary: 'Get council quorum (2/3 requirement)' })
  @Get('councils/:councilId/quorum')
  async getQuorum(@Param('councilId') councilId: string) {
    const r = await this.quorum.getQuorum(Number(councilId));
    assertOk(r);
    return r.data;
  }

  // Kengash qarorini kvorum + oddiy ko'pchilik qoidasi bo'yicha baholaydi. decisionRef berilsa
  // council_votes'dagi haqiqiy ovozlardan tally hisoblanadi; aks holda eski aggregat maydonlar ishlaydi.
  @ApiOperation({ summary: 'Evaluate a council decision against quorum + majority (aggregate counts or decisionRef vote tally)' })
  @Post('councils/:councilId/quorum/evaluate')
  async evaluateQuorum(@Param('councilId') councilId: string, @Body() body: unknown) {
    const dto = EvaluateSchema.parse(body);
    const cId = Number(councilId);
    if (dto.decisionRef !== undefined) {
      const tallyR = await this.votes.tallyVotes(cId, dto.decisionRef);
      assertOk(tallyR);
      const tally = tallyR.data ?? { presentCount: 0, votesFor: 0, votesAgainst: 0 };
      const r = await this.quorum.evaluateDecision(cId, tally);
      assertOk(r);
      return r.data;
    }
    const r = await this.quorum.evaluateDecision(cId, {
      presentCount: dto.presentCount ?? 0,
      votesFor: dto.votesFor ?? 0,
      votesAgainst: dto.votesAgainst ?? 0,
    });
    assertOk(r);
    return r.data;
  }

  // Owner decision 2026-07-13 (chat) — kengash a'zosining bitta qaror (decisionRef) bo'yicha
  // individual ovozini yozib qo'yadi (upsert: qayta yuborsa ovozi yangilanadi).
  @ApiOperation({ summary: 'Record an individual council member vote on a decision' })
  @Post('councils/:councilId/votes')
  async recordVote(@Param('councilId') councilId: string, @Body() body: unknown) {
    const dto = RecordVoteSchema.parse(body);
    const r = await this.votes.recordVote(Number(councilId), dto.decisionRef, dto.voterUserId, dto.vote);
    assertOk(r);
    return r.data;
  }

  // Bitta qaror (decisionRef) bo'yicha kim qanday ovoz berganini ko'rsatadi.
  @ApiOperation({ summary: 'List individual votes cast for a council decision' })
  @Get('councils/:councilId/votes/:decisionRef')
  async listVotes(@Param('councilId') councilId: string, @Param('decisionRef') decisionRef: string) {
    const r = await this.votes.listVotes(Number(councilId), decisionRef);
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
