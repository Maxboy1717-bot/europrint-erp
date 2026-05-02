import { Injectable } from '@nestjs/common';

type WhereCondition = Record<string, unknown>;
type RowData = Record<string, unknown>;

@Injectable()
export class Database {
  select(_table: string) {
    return {
      where: (_conditions: WhereCondition) => ({
        orderBy: (_field: string, _dir: string) => ({
          orderBy: (_field2: string, _dir2: string) => ({
            first: () => Promise.resolve(null),
          }),
          first: () => Promise.resolve(null),
        }),
        first: () => Promise.resolve(null),
        then: (_cb: (rows: RowData[]) => void) => Promise.resolve([]),
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.resolve({ done: true }),
        }),
      }),
      then: (_cb: (rows: RowData[]) => void) => Promise.resolve([]),
    };
  }

  insert(_table: string) {
    return {
      values: (_data: RowData) => Promise.resolve(0),
    };
  }

  update(_table: string) {
    return {
      set: (_data: RowData) => ({
        where: (_conditions: WhereCondition) => Promise.resolve(null),
      }),
    };
  }
}
