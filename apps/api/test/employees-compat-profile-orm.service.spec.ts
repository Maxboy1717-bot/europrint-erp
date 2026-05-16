/**
 * Smoke spec for EmployeesCompatProfileOrmService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent employees-compat.service.spec.ts.
 */
import { EmployeesCompatProfileOrmService } from '../src/modules/compatibility/employees-compat-profile-orm.service';

describe('EmployeesCompatProfileOrmService', () => {
  it('is defined', () => {
    expect(EmployeesCompatProfileOrmService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(EmployeesCompatProfileOrmService.name).toBe('EmployeesCompatProfileOrmService');
  });
});
