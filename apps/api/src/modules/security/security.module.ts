/**
 * @module security.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReportIncidentHandler } from './application/commands/report-incident.handler';
import { UpdateIncidentHandler } from './application/commands/update-incident.handler';
import { ResolveIncidentHandler } from './application/commands/resolve-incident.handler';
import { GetIncidentsHandler } from './application/queries/get-incidents.handler';
import { SecurityController } from './presentation/security.controller';
import { RaciController } from './presentation/raci.controller';
import { RaciService } from './application/raci.service';
import { RaciRepository } from './infrastructure/repositories/raci.repository';
import { RACI_REPO } from './domain/repositories/i-raci.repo';
import { INCIDENT_REPO } from './domain/repositories/i-incident.repo';
import { DrizzleIncidentRepository } from './infrastructure/repositories/drizzle-incident.repo';
import { IpBlockerGuard } from './infrastructure/guards/ip-blocker.guard';
import { AttendanceRepository } from './attendance/attendance.repository';
import { AttendanceService } from './attendance/attendance.service';
import { AccessRepository } from './access/access.repository';
import { AccessService } from './access/access.service';

const commandHandlers = [ReportIncidentHandler, UpdateIncidentHandler, ResolveIncidentHandler];
const queryHandlers = [GetIncidentsHandler];
const repositories = [
  {
    provide: INCIDENT_REPO,
    useClass: DrizzleIncidentRepository,
  },
];

@Module({
  imports: [CqrsModule],
  controllers: [SecurityController, RaciController],
  providers: [
    ...commandHandlers, ...queryHandlers, ...repositories,
    IpBlockerGuard, RaciRepository,
    { provide: RACI_REPO, useClass: RaciRepository },
    RaciService,
    AttendanceRepository, AttendanceService,
    AccessRepository, AccessService,
  ],
  exports: [INCIDENT_REPO, IpBlockerGuard],
})
export class SecurityModule {}
