import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import {
  guidelines as guidelinesTable,
  contactSettings as contactTable,
  systemSettings as sysTable,
  adminFilters as filtersTable,
} from '@shared/db/europrint-compat';
import { eq } from 'drizzle-orm';

type GuidelineInsert  = { title: string; content: string; category: string; isActive: boolean; createdBy?: string };
type GuidelineUpdate  = Partial<GuidelineInsert> & { updatedAt: Date };
type FilterInsert     = { name: string; filterType: string; config: Record<string, unknown>; isActive: boolean };
type FilterUpdate     = Partial<FilterInsert> & { updatedAt: Date };
type ContactUpdate    = { phone?: string; email?: string; address?: string; telegram?: string; website?: string; workingHours?: string; updatedAt: Date };
type SystemUpdate     = { companyName?: string; timezone?: string; language?: string; currency?: string; logoUrl?: string; config?: Record<string, unknown>; updatedAt: Date };

@Injectable()
export class SettingsAdminRepo {
  async findAllGuidelines() {
    return db.select().from(guidelinesTable).orderBy(guidelinesTable.createdAt);
  }

  async insertGuideline(data: GuidelineInsert) {
    return db.insert(guidelinesTable).values({
      title:     data.title,
      content:   data.content,
      category:  data.category,
      isActive:  data.isActive,
      createdBy: data.createdBy ?? null,
    }).returning();
  }

  async updateGuideline(id: string, data: GuidelineUpdate) {
    return db.update(guidelinesTable).set({
      title:     data.title,
      content:   data.content,
      category:  data.category,
      isActive:  data.isActive,
      createdBy: data.createdBy,
      updatedAt: data.updatedAt,
    }).where(eq(guidelinesTable.id, id)).returning();
  }

  async deleteGuideline(id: string) {
    return db.delete(guidelinesTable).where(eq(guidelinesTable.id, id)).returning();
  }

  async getContactSettings() {
    return db.select().from(contactTable);
  }

  async upsertContactSettings(data: ContactUpdate) {
    const existing = await db.select().from(contactTable);
    if (existing.length === 0) {
      return db.insert(contactTable).values({ id: 1, ...data }).returning();
    }
    return db.update(contactTable).set(data).returning();
  }

  async getSystemSettings() {
    return db.select().from(sysTable);
  }

  async upsertSystemSettings(data: SystemUpdate) {
    const existing = await db.select().from(sysTable);
    if (existing.length === 0) {
      return db.insert(sysTable).values({ id: 1, ...data }).returning();
    }
    return db.update(sysTable).set(data).returning();
  }

  async findAllFilters() {
    return db.select().from(filtersTable).orderBy(filtersTable.createdAt);
  }

  async insertFilter(data: FilterInsert) {
    return db.insert(filtersTable).values({
      name:       data.name,
      filterType: data.filterType,
      config:     data.config,
      isActive:   data.isActive,
    }).returning();
  }

  async updateFilter(id: string, data: FilterUpdate) {
    return db.update(filtersTable).set({
      name:       data.name,
      filterType: data.filterType,
      config:     data.config,
      isActive:   data.isActive,
      updatedAt:  data.updatedAt,
    }).where(eq(filtersTable.id, id)).returning();
  }

  async deleteFilter(id: string) {
    return db.delete(filtersTable).where(eq(filtersTable.id, id)).returning();
  }
}
