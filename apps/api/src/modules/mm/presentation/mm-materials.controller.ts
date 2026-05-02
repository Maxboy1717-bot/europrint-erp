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
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
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

enum Role {
 WAREHOUSE_MANAGER = 'warehouse_manager',
 SUPER_ADMIN = 'super_admin',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('mm/materials')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MmMaterialsController {
  private readonly logger = new Logger(MmMaterialsController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus) {}

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

 @Post()
 @Roles(Role.WAREHOUSE_MANAGER, Role.SUPER_ADMIN)
 async createMaterial(@Body() body: Record<string, unknown>) {

 const parsed = CreateMaterialDtoSchema.parse(body);
 const cmd = new CreateMaterialCommand(
 parsed.materialCode,
 parsed.name,
 parsed.category,
 parsed.unitOfMeasure,
 parsed.minStock,
 parsed.maxStock,
 parsed.unitCost);

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Material created');
 return {
 statusCode: HttpStatus.CREATED,
 data: (result).data,
};

}

 @Put(':id')
 @Roles(Role.WAREHOUSE_MANAGER, Role.SUPER_ADMIN)
 async updateMaterial(@Param('id') id: string, @Body() body: Record<string, unknown>) {

 const parsed = UpdateMaterialDtoSchema.parse(body);
 const cmd = new UpdateMaterialCommand(
 id,
 parsed.name,
 parsed.category,
 parsed.unitOfMeasure,
 parsed.minStock,
 parsed.maxStock,
 parsed.unitCost,
 parsed.isActive);

 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Material updated');
 return {
 statusCode: HttpStatus.OK,
 data: (result).data,
};

}

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
