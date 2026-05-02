import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class OrgExportRepository {
  async getFlatNodes(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT d.id, d.name, d.name_ru AS "nameRu", d.tskp, d.tskp_ru AS "tskpRu", d.level AS "hierarchyLevel", d.node_type AS "nodeType", u.full_name AS "headUserName", (SELECT COUNT(*)::int FROM employee_org_departments eod JOIN users eu ON eu.id = eod.user_id AND eu.deleted_at IS NULL WHERE eod.org_department_id = d.id) AS "employeeCount", p.name AS "parentName" FROM org_departments d LEFT JOIN users u ON u.id = d.head_user_id AND u.deleted_at IS NULL LEFT JOIN org_departments p ON p.id = d.parent_id WHERE d.is_active = true ORDER BY d.level ASC, d.name ASC`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
