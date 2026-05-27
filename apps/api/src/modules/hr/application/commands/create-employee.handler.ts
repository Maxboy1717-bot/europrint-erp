/**
 * @module create-employee.handler
 * @description CQRS handler — Phase 2 / Task 2.4 (Add Employee transaction).
 *
 *   Multi-table writes are wrapped in `db.transaction(...)`:
 *     1. INSERT into employees           (always)
 *     2. INSERT into users               (only when CreateEmployeeCommand
 *                                         .createUserAccount is provided)
 *     3. INSERT into audit_logs          (always — inline audit envelope)
 *
 *   Any failure inside the callback throws, which rolls every prior
 *   statement back atomically. The global AuditInterceptor still writes
 *   the request-level audit envelope AFTER the controller returns; the
 *   inline audit row here is the transactional, machine-readable record
 *   tied 1:1 to the employee row.
 *
 *   Why a dedicated handler when the repo already does its own tx:
 *     - the repo handles the "employee-only" Add path used by legacy
 *       compat controllers,
 *     - this handler is the canonical entry point that also covers the
 *       "employee + new user account" case the legacy repo did not.
 *     - controllers can dispatch through CommandBus instead of poking the
 *       repo, which keeps the use-case discoverable from a single place.
 *
 * @see apps/api/src/modules/hr/application/commands/create-employee.command.ts
 * @see apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr-base.repo.ts
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db, hrEmployees, users } from '@shared/db';
import { Result, Err, Ok } from '@common/types/result.type';
import { TashkentTimeService } from '@common/time';
import { CreateEmployeeCommand } from './create-employee.command';

const _time = new TashkentTimeService();

interface CreatedEmployee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  /** UUID of the linked auth user; null when no account was requested. */
  userId: string | null;
}

/**
 * Discriminated-union outcome from the db.transaction callback.
 *
 * Using a typed union instead of throw lets us distinguish
 * "expected business-rule failure" (no INSERT row) from
 * "unexpected DB exception" (connection lost, constraint violated, etc.).
 * The outer try/catch still handles the latter.
 */
type TxOutcome =
  | { kind: 'ok';  row:     CreatedEmployee }
  | { kind: 'err'; message: string };

@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeHandler
  implements ICommandHandler<CreateEmployeeCommand>
{
  private readonly logger = new Logger(CreateEmployeeHandler.name);

  async execute(cmd: CreateEmployeeCommand): Promise<Result<CreatedEmployee>> {
    this.logger.log(
      `Creating employee ${cmd.firstName} ${cmd.lastName} (actor=${cmd.actorUserId})`,
    );

    let outcome: TxOutcome;
    try {
      outcome = await db.transaction(async (tx): Promise<TxOutcome> => {
        // 1) Optional user account — must come first so the FK from
        //    employees.user_id can be set on the employee INSERT.
        let userId: string | null = null;
        if (cmd.createUserAccount) {
          const userInsert = await tx
            .insert(users)
            .values({
              email:         cmd.emailWork ?? `${cmd.createUserAccount.username}@local`,
              password_hash: cmd.createUserAccount.passwordHash,
              full_name:     `${cmd.firstName} ${cmd.lastName}`.trim(),
              role:          cmd.createUserAccount.role as never,
              is_active:     true,
            } as typeof users.$inferInsert)
            .returning({ id: users.id });
          const u = userInsert[0];
          if (!u) {
            // Expected business-rule failure: driver returned nothing.
            // Return err so the tx auto-rolls-back without an exception stack.
            return { kind: 'err' as const, message: 'CreateEmployee: user INSERT returned no row' };
          }
          userId = u.id as string;
        }

        // 2) Employee row.
        const empInsert = await tx
          .insert(hrEmployees)
          .values({
            employee_code:   cmd.employeeCode ?? `EMP-${Date.now()}`,
            first_name:      cmd.firstName,
            last_name:       cmd.lastName,
            middle_name:     cmd.middleName,
            department_id:   cmd.departmentId,
            position_id:     cmd.positionId,
            hire_date:       cmd.hireDate,
            base_salary:     String(cmd.baseSalary),
            employment_type: cmd.employmentType,
            status:          cmd.status,
            phone_number:    cmd.phoneNumber,
            email_work:      cmd.emailWork,
            gender:          cmd.gender,
            date_of_birth:   cmd.dateOfBirth,
          } as typeof hrEmployees.$inferInsert)
          .returning();
        const emp = empInsert[0];
        if (!emp) {
          return { kind: 'err' as const, message: 'CreateEmployee: employee INSERT returned no row' };
        }

        // 3) Inline audit log — records who created the employee and the
        //    payload, in the same transaction as the writes above. Either
        //    everything commits, or nothing does.
        const auditPayload = {
          actorUserId: cmd.actorUserId,
          employeeCode: emp.employee_code,
          createdWithUserAccount: cmd.createUserAccount !== null,
        };
        await tx.execute(sql`
          INSERT INTO audit_logs (id, table_name, record_id, action, new_values, user_id, created_at)
          VALUES (
            gen_random_uuid()::text,
            'employees',
            ${String(emp.id)},
            'CREATE',
            ${JSON.stringify(auditPayload)}::jsonb,
            ${String(cmd.actorUserId)},
            ${_time.now()}
          )
        `);

        return {
          kind: 'ok' as const,
          row: {
            id:           emp.id,
            employeeCode: emp.employee_code as string,
            firstName:    emp.first_name as string,
            lastName:     emp.last_name as string,
            userId,
          },
        };
      });
    } catch (err) {
      // Unexpected DB-level exception (connection lost, constraint violated, etc.)
      const message = (err as Error)?.message ?? 'Transaction failed';
      this.logger.error({ msg: 'CreateEmployee transaction rolled back', error: message });
      return Err(`Failed to create employee: ${message}`);
    }

    if (outcome.kind === 'err') {
      this.logger.warn({ msg: 'CreateEmployee logic failure', error: outcome.message });
      return Err(outcome.message);
    }
    return Ok(outcome.row);
  }
}
