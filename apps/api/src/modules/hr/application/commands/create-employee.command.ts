/**
 * @module create-employee.command
 * @description CQRS command DTO for the Add Employee use-case.
 *
 *   Phase 2 / Task 2.4 — paired with `create-employee.handler.ts`. The
 *   command captures the immutable input; the handler runs the actual
 *   multi-table transaction (employee + linked user row + inline audit).
 */

export class CreateEmployeeCommand {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly hireDate: string,
    public readonly employeeCode: string | null,
    public readonly middleName: string | null,
    public readonly departmentId: number | null,
    public readonly positionId: number | null,
    public readonly baseSalary: number,
    public readonly phoneNumber: string | null,
    public readonly emailWork: string | null,
    public readonly gender: string | null,
    public readonly dateOfBirth: string | null,
    public readonly employmentType: string,
    public readonly status: string,
    /**
     * Optional user-account link. When provided the handler INSERTs a
     * matching `users` row in the SAME transaction so the FK from
     * `employees.user_id` is satisfied on commit (or rolled back if any
     * step fails).
     */
    public readonly createUserAccount: {
      username: string;
      passwordHash: string;
      role: string;
    } | null,
    public readonly actorUserId: number,
  ) {}
}
