import { assertFound } from '@common/assertions';
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../hr/common/db-rows';
import { ApplicationsService } from './applications.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApplicationResponseCreateSchema, ApplicationResponseCreateDto } from './dto/applications.dto';

const HR_ROLES = ['hr_manager', 'hr_specialist', 'director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Roles(...HR_ROLES)
@Controller('application-responses')
export class ApplicationResponsesController {
  private readonly logger = new Logger(ApplicationResponsesController.name);

  constructor(private readonly svc: ApplicationsService) {}

  @Get()
  async list(
    @Query('applicationId') applicationId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const _rListResponses = await this.svc.listResponses(
      applicationId ? safeInt(applicationId, 0) : null,
      safeInt(limit, 50),
      safeInt(offset, 0),
    );
    assertOk(_rListResponses);
    return _rListResponses.data;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const _rGetById = await this.svc.getResponseById(safeInt(id, 0));
    assertOk(_rGetById);
    assertFound(_rGetById.data, 'Application response not found');
    return _rGetById.data;
  }

  @Post()
  @UsePipes(new ZodValidationPipe(ApplicationResponseCreateSchema))
  async create(@Body() body: ApplicationResponseCreateDto) {
    return unwrapOrThrow(await this.svc.createResponse(body));
  }
}
