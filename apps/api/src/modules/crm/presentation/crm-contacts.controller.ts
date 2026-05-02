import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { safeInt } from '../../hr/common/db-rows';
import {
  BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Patch, Post, Query, UseGuards,
  UseInterceptors, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CrmContactsService } from '../application/crm-contacts.service';
import {
  CheckContactDuplicatesDtoSchema, CheckContactDuplicatesDto,
  CreateContactDtoSchema, CreateContactDto,
} from './dto/crm-contacts.dto';

const CRM_WRITE_ROLES = ['sales_manager', 'super_admin', 'director', 'crm_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('crm')
export class CrmContactsController {
  private readonly logger = new Logger(CrmContactsController.name);

  constructor(private readonly svc: CrmContactsService) {}

  @Get('contacts')
  async listContacts(@Query('search') search?: string, @Query('companyId') companyId?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listContacts(search, companyId ? safeInt(companyId, 0) : null, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Get('contacts/:id')
  async getContact(@Param('id') id: string) {
    const _rGetContact = await this.svc.getContact(safeInt(id, 0));
    assertOk(_rGetContact);
    const r = _rGetContact.data as Record<string, unknown>;
    assertFound(r, 'Contact not found');
    return r;
  }

  @Post('contacts/check-duplicates')
  @UsePipes(new ZodValidationPipe(CheckContactDuplicatesDtoSchema))
  async checkContactDuplicates(@Body() body: CheckContactDuplicatesDto) {
    return { duplicates: await this.svc.checkDuplicates(body.email, body.phone) };
  }

  @Post('contacts')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateContactDtoSchema))
  async createContact(@Body() body: CreateContactDto) {
    assertRequired(body.first_name, 'first_name required');
    return unwrapOrThrow(await this.svc.createContact(body));
  }

  @Patch('contacts/:id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  @UsePipes(new ZodValidationPipe(CreateContactDtoSchema))
  async updateContact(@Param('id') id: string, @Body() body: CreateContactDto) {
    const _rUpdateContact = await this.svc.updateContact(safeInt(id, 0), body);
    assertOk(_rUpdateContact);
    const r = _rUpdateContact.data as Record<string, unknown>;
    assertFound(r, 'Contact not found');
    return r;
  }

  @Delete('contacts/:id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_WRITE_ROLES)
  async deleteContact(@Param('id') id: string) {
    await this.svc.deleteContact(safeInt(id, 0));
    return { deleted: true, id: safeInt(id, 0) };
  }
}
