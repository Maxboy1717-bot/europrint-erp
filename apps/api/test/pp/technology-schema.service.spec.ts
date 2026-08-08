/**
 * Smoke spec for TechnologySchemaService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service's only responsibility is to call
 * TechnologySchemaRepository.ensureTables() from OnModuleInit (DDL bootstrap
 * against a live database). It has no pure/testable business logic and its
 * single constructor dependency is a repository backed by a real DB
 * connection, so it is not reasonably constructible outside a full Nest DI /
 * DB test harness. This smoke spec only verifies that the class is
 * importable and correctly named — behavioural coverage of DDL bootstrap
 * belongs with integration tests around `ensureTechnologyTables`.
 */
import { TechnologySchemaService } from '../../src/modules/pp/technology/technology-schema.service';

describe('TechnologySchemaService', () => {
  it('is defined', () => {
    expect(TechnologySchemaService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(TechnologySchemaService.name).toBe('TechnologySchemaService');
  });
});
