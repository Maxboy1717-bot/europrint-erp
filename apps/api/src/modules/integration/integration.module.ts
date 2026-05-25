/**
 * @module integration.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

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
// PA3-17 Wave 5: merged from former modules/sap/ (route prefix '/sap' preserved)
import { SapController } from './sap/sap.controller';
import { SapService } from './sap/sap.service';
import { SapRepository } from './sap/sap.repository';

@Module({
  imports: [AuthModule],
  controllers: [
    IntegrationMroController,
    IntegrationRequestsController,
    IntegrationEmployeeController,
    IntegrationExtendedController,
    IntegrationExtendedHrController,
    IntegrationMroPmController,
    // PA3-17 Wave 5: merged from modules/sap/
    SapController,
  ],
  providers: [
    IntegrationMroRepository,
    IntegrationEmployeeRepository,
    IntegrationExtendedMroRepository,
    IntegrationExtendedHrRepository,
    IntegrationMroService,
    IntegrationEmployeeService,
    // PA3-17 Wave 5: merged from modules/sap/
    SapRepository,
    SapService,
  ],
  exports: [SapService],
})
export class IntegrationModule {}
