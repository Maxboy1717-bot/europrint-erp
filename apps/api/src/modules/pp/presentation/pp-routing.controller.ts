import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Logger , InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { ApproveRoutingCommand } from '../application/commands/approve-routing.handler';
import { z } from 'zod';

enum Role {
  TECHNOLOGIST = 'technologist',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

const CreateRoutingDtoSchema = z.object({
  productId: z.number(),
  operations: z.array(z.any()),
  reason: z.string().min(5),
});

const ApproveRoutingDtoSchema = z.object({
  approvedBy: z.number(),
  reason: z.string().min(5),
});

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('pp/routing')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpRoutingController {
  private readonly logger = new Logger(PpRoutingController.name);

  constructor(private commandBus: CommandBus) {}

  @Get(':id')
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getById(@Param('id') id: number){
    this.logger.log('Getting routing');
    return {};
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: z.infer<typeof CreateRoutingDtoSchema>){
    CreateRoutingDtoSchema.parse(dto);
    this.logger.log('Creating routing');
    return 0;
  }

  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveRouting(
    @Param('id') id: number,
    @Body() dto: z.infer<typeof ApproveRoutingDtoSchema>,
  ){
    const parsed = ApproveRoutingDtoSchema.parse(dto);
    const command = new ApproveRoutingCommand(id, parsed.approvedBy);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }
}
