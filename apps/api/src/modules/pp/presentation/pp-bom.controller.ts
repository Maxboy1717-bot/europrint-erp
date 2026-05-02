import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger , InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Result } from '@common/result';
import { GetBomsQuery } from '../application/queries/get-boms.query';
import { ApproveBomCommand } from '../application/commands/approve-bom.handler';
import { z } from 'zod';

enum Role {
  TECHNOLOGIST = 'technologist',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

const CreateBomDtoSchema = z.object({
  productId: z.number(),
  items: z.array(z.any()),
  reason: z.string().min(5),
});

const ApproveBomDtoSchema = z.object({
  approvedBy: z.number(),
  reason: z.string().min(5),
});

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('pp/bom')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpBomController {
  private readonly logger = new Logger(PpBomController.name);

  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @Get()
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listBoms(@Query('page') page?: string, @Query('limit') limit?: string) {
    return await this.queryBus.execute(new GetBomsQuery({ page: Number(page), limit: Number(limit) }));
  }

  @Get(':id')
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getById(@Param('id') id: number){
    this.logger.log('Getting BOM');
    return {};
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: z.infer<typeof CreateBomDtoSchema>){
    CreateBomDtoSchema.parse(dto);
    this.logger.log('Creating BOM');
    return 0;
  }

  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveBom(@Param('id') id: number, @Body() dto: z.infer<typeof ApproveBomDtoSchema>){
    const parsed = ApproveBomDtoSchema.parse(dto);
    const command = new ApproveBomCommand(id, parsed.approvedBy);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }
}
