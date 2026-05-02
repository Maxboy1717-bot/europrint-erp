import { sql, db } from '@workspace/db';
import { Ok, Err, Result, safeCall } from '@common/result';

import { Injectable } from '@nestjs/common';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

@Injectable()
export class PosPdfInventoryRepository {
  async getInventoryCountForPdf(countId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT ic.count_number, ic.warehouse_id, ic.created_at, icl.material_card_id, mc.xom_ashyo, mc.unit_of_measure, icl.system_qty, icl.actual_qty, icl.variance_qty FROM pos_inventory_counts ic JOIN pos_inventory_count_lines icl ON icl.count_id = ic.id JOIN material_cards mc ON mc.id = icl.material_card_id WHERE ic.id = ${countId} ORDER BY mc.xom_ashyo`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
