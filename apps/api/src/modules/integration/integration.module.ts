import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IntegrationMroController, IntegrationRequestsController } from './integration-mro.controller';
import { IntegrationEmployeeController } from './integration-employee.controller';
import { IntegrationExtendedController } from './integration-extended.controller';
import { IntegrationExtendedHrController, IntegrationMroPmController } from './integration-extended-hr.controller';
import { IntegrationMroService } from './integration-mro.service';
import { IntegrationEmployeeService } from './integration-employee.service';
import { IntegrationMroRepository } from './integration-mro.repo';
import { IntegrationEmployeeRepository } from './integration-employee.repo';
import { IntegrationExtendedMroRepository } from './integration-extended-mro.repo';
import { IntegrationExtendedHrRepository } from './integration-extended-hr.repo';

@Module({
  imports: [AuthModule],
  controllers: [
    IntegrationMroController,
    IntegrationRequestsController,
    IntegrationEmployeeController,
    IntegrationExtendedController,
    IntegrationExtendedHrController,
    IntegrationMroPmController,
  ],
  providers: [
    IntegrationMroRepository,
    IntegrationEmployeeRepository,
    IntegrationExtendedMroRepository,
    IntegrationExtendedHrRepository,
    IntegrationMroService,
    IntegrationEmployeeService,
  ],
})
export class IntegrationModule {}
