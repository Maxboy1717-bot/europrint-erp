/**
 * @module marketing-group2.service
 * @description Business-logic service for Marketing GURUH 2 endpoints:
 *   blog, budget, calendar, competitors, lead-contacts.
 *   Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { DrizzleMarketingGroup2Repository } from '../infrastructure/repositories/drizzle-marketing-group2.repo';

@Injectable()
export class MarketingGroup2Service {
  private readonly logger = new Logger(MarketingGroup2Service.name);

  constructor(private readonly repo: DrizzleMarketingGroup2Repository) {}

  // ── Blog ──────────────────────────────────────────────────────────────────

  getBlogPosts(opts: { limit?: number; offset?: number; status?: string }): Promise<Result<{ data: unknown[]; total: number }>> {
    return this.repo.getBlogPosts(opts);
  }

  getBlogPostById(id: string): Promise<Result<unknown>> {
    return this.repo.getBlogPostById(id);
  }

  createBlogPost(data: Record<string, unknown>): Promise<Result<unknown>> {
    return this.repo.createBlogPost(data);
  }

  updateBlogPost(id: string, data: Record<string, unknown>): Promise<Result<unknown>> {
    return this.repo.updateBlogPost(id, data);
  }

  publishBlogPost(id: string): Promise<Result<unknown>> {
    return this.repo.publishBlogPost(id);
  }

  deleteBlogPost(id: string): Promise<Result<{ message: string }>> {
    return this.repo.deleteBlogPost(id);
  }

  // ── Budget ────────────────────────────────────────────────────────────────

  getBudgetLines(opts: { year?: number; month?: number }): Promise<Result<unknown[]>> {
    return this.repo.getBudgetLines(opts);
  }

  getBudgetLineById(id: string): Promise<Result<unknown>> {
    return this.repo.getBudgetLineById(id);
  }

  createBudgetLine(data: Record<string, unknown>): Promise<Result<unknown>> {
    return this.repo.createBudgetLine(data);
  }

  updateBudgetLine(id: string, data: Record<string, unknown>): Promise<Result<unknown>> {
    return this.repo.updateBudgetLine(id, data);
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  getCalendarEvents(opts: { from?: string; to?: string }): Promise<Result<unknown[]>> {
    return this.repo.getCalendarEvents(opts);
  }

  getCalendarEventById(id: number): Promise<Result<unknown>> {
    return this.repo.getCalendarEventById(id);
  }

  createCalendarEvent(data: Record<string, unknown>): Promise<Result<unknown>> {
    return this.repo.createCalendarEvent(data);
  }

  // ── Competitors ───────────────────────────────────────────────────────────

  getCompetitors(): Promise<Result<unknown[]>> {
    return this.repo.getCompetitors();
  }

  // ── Lead Contacts ─────────────────────────────────────────────────────────

  getLeadContacts(leadId: string): Promise<Result<unknown[]>> {
    return this.repo.getLeadContacts(leadId);
  }

  createLeadContact(leadId: string, data: Record<string, unknown>): Promise<Result<unknown>> {
    return this.repo.createLeadContact(leadId, data);
  }

  softDeleteLead(id: string): Promise<Result<{ message: string }>> {
    return this.repo.softDeleteLead(id);
  }
}
