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

type GuidelineInsert  = { title: string; content: string; category: string; isActive: boolean; createdBy?: string };
type GuidelineUpdate  = Partial<GuidelineInsert> & { updatedAt: Date };
type FilterInsert     = { name: string; filterType: string; config: Record<string, unknown>; isActive: boolean };
type FilterUpdate     = Partial<FilterInsert> & { updatedAt: Date };
type ContactUpdate    = { phone?: string; email?: string; address?: string; telegram?: string; website?: string; workingHours?: string; updatedAt: Date };
type SystemUpdate     = { companyName?: string; timezone?: string; language?: string; currency?: string; logoUrl?: string; config?: Record<string, unknown>; updatedAt: Date };

@Injectable()
export class SettingsAdminRepo {
  async findAllGuidelines() {
    try {
      return await db.select().from(guidelinesTable).orderBy(guidelinesTable.createdAt);
    } catch (e) {
      throw new Error(`settings_admin.findAllGuidelines: ${String(e)}`);
    }
  }

  async insertGuideline(data: GuidelineInsert) {
    try {
      return await db.insert(guidelinesTable).values({
        title:     data.title,
        content:   data.content,
        category:  data.category,
        isActive:  data.isActive,
        createdBy: data.createdBy ?? null,
      }).returning();
    } catch (e) {
      throw new Error(`settings_admin.insertGuideline: ${String(e)}`);
    }
  }

  async updateGuideline(id: string, data: GuidelineUpdate) {
    try {
      return await db.update(guidelinesTable).set({
        title:     data.title,
        content:   data.content,
        category:  data.category,
        isActive:  data.isActive,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt,
      }).where(eq(guidelinesTable.id, id)).returning();
    } catch (e) {
      throw new Error(`settings_admin.updateGuideline: ${String(e)}`);
    }
  }

  async deleteGuideline(id: string) {
    try {
      return await db.delete(guidelinesTable).where(eq(guidelinesTable.id, id)).returning();
    } catch (e) {
      throw new Error(`settings_admin.deleteGuideline: ${String(e)}`);
    }
  }

  async getContactSettings() {
    try {
      return await db.select().from(contactTable);
    } catch (e) {
      throw new Error(`settings_admin.getContactSettings: ${String(e)}`);
    }
  }

  async upsertContactSettings(data: ContactUpdate) {
    try {
      const existing = await db.select().from(contactTable);
      if (existing.length === 0) {
        return await db.insert(contactTable).values({ id: 1, ...data }).returning();
      }
      return await db.update(contactTable).set(data).returning();
    } catch (e) {
      throw new Error(`settings_admin.upsertContactSettings: ${String(e)}`);
    }
  }

  async getSystemSettings() {
    try {
      return await db.select().from(sysTable);
    } catch (e) {
      throw new Error(`settings_admin.getSystemSettings: ${String(e)}`);
    }
  }

  async upsertSystemSettings(data: SystemUpdate) {
    try {
      const existing = await db.select().from(sysTable);
      if (existing.length === 0) {
        return await db.insert(sysTable).values({ id: 1, ...data }).returning();
      }
      return await db.update(sysTable).set(data).returning();
    } catch (e) {
      throw new Error(`settings_admin.upsertSystemSettings: ${String(e)}`);
    }
  }

  async findAllFilters() {
    try {
      return await db.select().from(filtersTable).orderBy(filtersTable.createdAt);
    } catch (e) {
      throw new Error(`settings_admin.findAllFilters: ${String(e)}`);
    }
  }

  async insertFilter(data: FilterInsert) {
    try {
      return await db.insert(filtersTable).values({
        name:       data.name,
        filterType: data.filterType,
        config:     data.config,
        isActive:   data.isActive,
      }).returning();
    } catch (e) {
      throw new Error(`settings_admin.insertFilter: ${String(e)}`);
    }
  }

  async updateFilter(id: string, data: FilterUpdate) {
    try {
      return await db.update(filtersTable).set({
        name:       data.name,
        filterType: data.filterType,
        config:     data.config,
        isActive:   data.isActive,
        updatedAt:  data.updatedAt,
      }).where(eq(filtersTable.id, id)).returning();
    } catch (e) {
      throw new Error(`settings_admin.updateFilter: ${String(e)}`);
    }
  }

  async deleteFilter(id: string) {
    try {
      return await db.delete(filtersTable).where(eq(filtersTable.id, id)).returning();
    } catch (e) {
      throw new Error(`settings_admin.deleteFilter: ${String(e)}`);
    }
  }
}
