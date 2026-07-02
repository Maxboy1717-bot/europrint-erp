/**
 * @module get-low-stock.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result } from '@common/result';
import { GetLowStockQuery } from './get-low-stock.query';

interface LowStockRow {
  materialId: number;
  materialCode: string;
  materialName: string;
  warehouseId: number;
  currentQty: number;
  minQty: number;
}

@Injectable()
@QueryHandler(GetLowStockQuery)
export class GetLowStockHandler implements IQueryHandler<GetLowStockQuery> {
  private readonly logger = new Logger(GetLowStockHandler.name);

  async execute(_query: GetLowStockQuery): Promise<Result<object[]>> {
      // Kanonik manba: warehouse_stock + material_cards.min_stock (avval 7-qatorli
      // DEMO `stock_items` jadvalidan, qattiq-kodlangan threshold bilan o'qir edi).
      // PosLowStockJob'da ishlatiladigan haqiqiy so'rov bilan bir xillashtirildi
      // (pos-fifo.service.ts getLowStockMaterials()) — har material o'zining
      // min_stock qiymatiga nisbatan tekshiriladi, generik threshold emas.
      this.logger.debug('Fetching low stock items (material_cards.min_stock asosida)');

      const r = await runQuery<LowStockRow>(sql`
        SELECT
          mc.id           AS "materialId",
          mc.kod          AS "materialCode",
          mc.xom_ashyo    AS "materialName",
          ws.warehouse_id AS "warehouseId",
          COALESCE(ws.available_quantity, 0) AS "currentQty",
          COALESCE(mc.min_stock, 0)          AS "minQty"
        FROM warehouse_stock ws
        JOIN material_cards mc ON mc.id = ws.material_id
        WHERE COALESCE(ws.available_quantity, 0) < COALESCE(mc.min_stock, 0)
          AND COALESCE(mc.min_stock, 0) > 0
          AND mc.is_active = true
        ORDER BY (COALESCE(ws.available_quantity, 0) / NULLIF(mc.min_stock, 0)) ASC
        LIMIT 200
      `);

      this.logger.log(`Low stock items fetched: ${r.rows.length}`);
      return { ok: true, data: r.rows };
  }
}
