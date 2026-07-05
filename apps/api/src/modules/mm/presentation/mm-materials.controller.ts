/**
 * @module mm-materials.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk, unwrapOrNotFoundDefined } from '@common/http-result';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, NotFoundException} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CreateMaterialCommand} from '../application/commands/create-material.command';
import { UpdateMaterialCommand} from '../application/commands/update-material.command';
import { GetMaterialsQuery} from '../application/queries/get-materials.query';
import {
 CreateMaterialDtoSchema,
 UpdateMaterialDtoSchema,
 GetMaterialsDtoSchema,
} from './dto/material.dto';
import { LayerFormulaService } from '../application/layer-formula.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';

enum Role {
 WAREHOUSE_MANAGER = 'warehouse_manager',
 SUPER_ADMIN = 'super_admin',
}

@ApiThrottle()
@ApiTags('Mm Materials')
@Controller('mm/materials')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MmMaterialsController {
  private readonly logger = new Logger(MmMaterialsController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus,
 private readonly layerFormula: LayerFormulaService) {}

 @ApiOperation({ summary: 'kg<->list konvertatsiya (qatlam formulasi, vision #7)' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get(':id/sheet-conversion')
 @Roles(Role.WAREHOUSE_MANAGER, Role.SUPER_ADMIN)
 async sheetConversion(
 @Param('id') id: string,
 @Query('kg') kg?: string,
 @Query('sheets') sheets?: string) {
 // Ombor kg bilan kirim/chiqim qiladi -> material config'i bo'yicha list-soni hisoblanadi.
 const materialId = parseInt(id, 10);
 if (!Number.isFinite(materialId)) throw new BadRequestException('Material id raqam bo\'lishi kerak');
 const opts: { totalKg?: number; sheetCount?: number } = {};
 if (kg != null && kg !== '') opts.totalKg = Number(kg);
 if (sheets != null && sheets !== '') opts.sheetCount = Number(sheets);
 const r = await this.layerFormula.convert(materialId, opts);
 if (!r.ok) {
   if (r.error.code === 'NOT_FOUND') throw new NotFoundException(r.error.message);
   throw new BadRequestException(r.error.message);
 }
 return r.data;
}

 @ApiOperation({ summary: 'Get materials' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get()
 async getMaterials(@Query() queryParams: Record<string, unknown>) {

 const parsed = GetMaterialsDtoSchema.parse(queryParams);
 const query = new GetMaterialsQuery(
 parsed.category,
 parsed.isActive,
 parsed.lowStock,
 parsed.page,
 parsed.limit);

 const result = await this.queryBus.execute(query);

 assertOk(result);
 return {
 statusCode: HttpStatus.OK,
 data: (result).data,
};

}

 @ApiOperation({ summary: 'Get material stats' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get('stats')
 @Roles(Role.WAREHOUSE_MANAGER, Role.SUPER_ADMIN)
 async getMaterialStats() {

 const result = await this.commandBus.execute({
 type: 'GetMaterialStatsQuery',
});

 assertOk(result);
 return {
 statusCode: HttpStatus.OK,
 data: (result).data,
};

}

 @ApiOperation({ summary: 'Get material by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 async getMaterialById(@Param('id') id: string) {

 const result = await this.commandBus.execute({
 type: 'GetMaterialByIdQuery',
 id,
});

 return {
 statusCode: HttpStatus.OK,
 data: unwrapOrNotFoundDefined(result, 'Material not found'),
};

}

 @ApiOperation({ summary: 'Create material' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post()
 @Roles(Role.WAREHOUSE_MANAGER, Role.SUPER_ADMIN)
 async createMaterial(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {

 const parsed = CreateMaterialDtoSchema.parse(body);
 const cmd = new CreateMaterialCommand(
 parsed.materialCode,
 parsed.name,
 parsed.category,
 parsed.unitOfMeasure,
 parsed.minStock,
 parsed.maxStock,
 parsed.unitCost,
 user.id);

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Material created');
 return {
 statusCode: HttpStatus.CREATED,
 data: (result).data,
};

}

 @ApiOperation({ summary: 'Update material' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Put(':id')
 @Roles(Role.WAREHOUSE_MANAGER, Role.SUPER_ADMIN)
 async updateMaterial(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {

 const parsed = UpdateMaterialDtoSchema.parse(body);
 const cmd = new UpdateMaterialCommand(
 id,
 parsed.name,
 parsed.category,
 parsed.unitOfMeasure,
 parsed.minStock,
 parsed.maxStock,
 parsed.unitCost,
 parsed.isActive,
 user.id);

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Material updated');
 return {
 statusCode: HttpStatus.OK,
 data: (result).data,
};

}

 @ApiOperation({ summary: 'Toggle material active' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id/toggle-active')
 @Roles(Role.SUPER_ADMIN)
 async toggleMaterialActive(@Param('id') id: string, @Body() body: { isActive: boolean}) {

 const cmd = new UpdateMaterialCommand(id, undefined, undefined, undefined, undefined, undefined, undefined, body.isActive);

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Material status toggled');
 return {
 statusCode: HttpStatus.OK,
 data: (result).data,
};

}
}
