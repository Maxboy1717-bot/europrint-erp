/**
 * @module settings-admin.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import {
  guidelines as guidelinesTable,
  contactSettings as contactTable,
  systemSettings as sysTable,
  adminFilters as filtersTable,
} from '@shared/db/europrint-compat';
import { eq } from 'drizzle-orm';
import { safeCall } from '@common/result';

type GuidelineInsert  = { title: string; content: string; category: string; isActive: boolean; createdBy?: string };
type GuidelineUpdate  = Partial<GuidelineInsert> & { updatedAt: Date };
type FilterInsert     = { name: string; filterType: string; config: Record<string, unknown>; isActive: boolean };
type FilterUpdate     = Partial<FilterInsert> & { updatedAt: Date };
type ContactUpdate    = { phone?: string; email?: string; address?: string; telegram?: string; website?: string; workingHours?: string; updatedAt: Date };
type SystemUpdate     = { companyName?: string; timezone?: string; language?: string; currency?: string; logoUrl?: string; config?: Record<string, unknown>; updatedAt: Date };

@Injectable()
export class SettingsAdminRepo {
  findAllGuidelines() {
    return safeCall(() => db.select().from(guidelinesTable).orderBy(guidelinesTable.createdAt), 'DB_ERROR');
  }

  insertGuideline(data: GuidelineInsert) {
    return safeCall(() => db.insert(guidelinesTable).values({
      title:     data.title,
      content:   data.content,
      category:  data.category,
      isActive:  data.isActive,
      createdBy: data.createdBy ?? null,
    }).returning(), 'DB_ERROR');
  }

  updateGuideline(id: string, data: GuidelineUpdate) {
    return safeCall(() => db.update(guidelinesTable).set({
      title:     data.title,
      content:   data.content,
      category:  data.category,
      isActive:  data.isActive,
      createdBy: data.createdBy,
      updatedAt: data.updatedAt,
    }).where(eq(guidelinesTable.id, id)).returning(), 'DB_ERROR');
  }

  deleteGuideline(id: string) {
    return safeCall(() => db.delete(guidelinesTable).where(eq(guidelinesTable.id, id)).returning(), 'DB_ERROR');
  }

  getContactSettings() {
    return safeCall(() => db.select().from(contactTable), 'DB_ERROR');
  }

  upsertContactSettings(data: ContactUpdate) {
    return safeCall(async () => {
      const existing = await db.select().from(contactTable);
      if (existing.length === 0) {
        return await db.insert(contactTable).values({ id: 1, ...data }).returning();
      }
      return await db.update(contactTable).set(data).returning();
    }, 'DB_ERROR');
  }

  getSystemSettings() {
    return safeCall(() => db.select().from(sysTable), 'DB_ERROR');
  }

  upsertSystemSettings(data: SystemUpdate) {
    return safeCall(async () => {
      const existing = await db.select().from(sysTable);
      if (existing.length === 0) {
        return await db.insert(sysTable).values({ id: 1, ...data }).returning();
      }
      return await db.update(sysTable).set(data).returning();
    }, 'DB_ERROR');
  }

  findAllFilters() {
    return safeCall(() => db.select().from(filtersTable).orderBy(filtersTable.createdAt), 'DB_ERROR');
  }

  insertFilter(data: FilterInsert) {
    return safeCall(() => db.insert(filtersTable).values({
      name:       data.name,
      filterType: data.filterType,
      config:     data.config,
      isActive:   data.isActive,
    }).returning(), 'DB_ERROR');
  }

  updateFilter(id: string, data: FilterUpdate) {
    return safeCall(() => db.update(filtersTable).set({
      name:       data.name,
      filterType: data.filterType,
      config:     data.config,
      isActive:   data.isActive,
      updatedAt:  data.updatedAt,
    }).where(eq(filtersTable.id, id)).returning(), 'DB_ERROR');
  }

  deleteFilter(id: string) {
    return safeCall(() => db.delete(filtersTable).where(eq(filtersTable.id, id)).returning(), 'DB_ERROR');
  }
}
