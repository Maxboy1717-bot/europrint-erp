/**
 * @module pos-printer-config.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { PRINTER_DEFAULT_PORT } from '@common/constants/app.constants';
import { Injectable } from '@nestjs/common';
import { db, posPrinterConfig } from '@workspace/db';
import { eq, desc } from '@workspace/db';

type Row = Record<string, unknown>;

@Injectable()
export class PosPrinterConfigRepository {
  async getAll(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select()
        .from(posPrinterConfig)
        .orderBy(desc(posPrinterConfig.createdAt));
      return Ok(rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async create(body: {
    name?: string;
    printerIp: string;
    printerPort?: number;
    printFormat?: string;
    notes?: string;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .insert(posPrinterConfig)
        .values({
          name:        body.name        ?? 'Printer',
          printerIp:   body.printerIp,
          printerPort: body.printerPort ?? PRINTER_DEFAULT_PORT,
          printFormat: body.printFormat ?? 'ZPL',
          notes:       body.notes       ?? null,
          isActive:    true,
          createdAt:   new Date(),
          updatedAt:   new Date(),
        })
        .returning();
      return Ok((rows[0] ?? {}) as Row);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async update(
    id: number,
    body: {
      name?: string;
      printerIp?: string;
      printerPort?: number;
      printFormat?: string;
      isActive?: boolean;
      notes?: string;
    },
  ): Promise<Result<Row>> {
    try {
      const patch: Partial<typeof posPrinterConfig.$inferInsert> = {};
      if (body.name        !== undefined) patch.name        = body.name;
      if (body.printerIp   !== undefined) patch.printerIp   = body.printerIp;
      if (body.printerPort !== undefined) patch.printerPort = body.printerPort;
      if (body.printFormat !== undefined) patch.printFormat = body.printFormat;
      if (body.isActive    !== undefined) patch.isActive    = body.isActive;
      if (body.notes       !== undefined) patch.notes       = body.notes;
      patch.updatedAt = new Date();

      const rows = await db
        .update(posPrinterConfig)
        .set(patch)
        .where(eq(posPrinterConfig.id, id))
        .returning();
      return Ok((rows[0] ?? {}) as Row);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getForTest(id: number): Promise<Result<Row | undefined>> {
    try {
      const rows = await db
        .select({
          printerIp:   posPrinterConfig.printerIp,
          printerPort: posPrinterConfig.printerPort,
          printFormat: posPrinterConfig.printFormat,
        })
        .from(posPrinterConfig)
        .where(eq(posPrinterConfig.id, id));
      return Ok(rows[0] as Row | undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getActiveConfig(): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select({
          id:          posPrinterConfig.id,
          name:        posPrinterConfig.name,
          printerIp:   posPrinterConfig.printerIp,
          printerPort: posPrinterConfig.printerPort,
          printFormat: posPrinterConfig.printFormat,
        })
        .from(posPrinterConfig)
        .where(eq(posPrinterConfig.isActive, true))
        .orderBy(desc(posPrinterConfig.createdAt))
        .limit(1);
      return Ok((rows[0] ?? null) as Row | null);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
