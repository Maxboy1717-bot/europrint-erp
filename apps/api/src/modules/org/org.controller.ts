import {
  Controller, Get, Param, ParseIntPipe, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { OrgService } from './org.service';

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin', 'viewer')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org V2')
@ApiBearerAuth()
@Controller('org')
export class OrgController {
  constructor(private readonly service: OrgService) {}

  @ApiOperation({ summary: 'Razryad darajalari (1–6) koeffitsientlari bilan' })
  @Get('razryad')
  async getRazryad() {
    return unwrapOrInternal(await this.service.getRazryad());
  }

  @ApiOperation({ summary: 'Bo\'limlar ro\'yxati (xodim + karta soni bilan)' })
  @Get('departments')
  async getDepartments() {
    return unwrapOrInternal(await this.service.getDepartments());
  }

  @ApiOperation({ summary: 'Org kartalar (org_functions) razryad + xodim soni bilan' })
  @Get('functions')
  async getFunctions(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.service.getFunctions(departmentId, status));
  }

  @ApiOperation({ summary: 'Bitta org karta (to\'liq)' })
  @Get('functions/:id')
  async getFunctionById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.getFunctionById(id);
    return unwrapOrThrow(result);
  }
}
