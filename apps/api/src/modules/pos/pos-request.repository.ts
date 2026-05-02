import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@workspace/db';
import { posMaterialRequestLines } from '@workspace/db';

@Injectable()
export class PosRequestRepository {
  async insertRequestLines(lineValues: (typeof posMaterialRequestLines.$inferInsert)[]): Promise<Result<void>> {
    try {
      await db.insert(posMaterialRequestLines).values(lineValues);
      return Ok(undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
