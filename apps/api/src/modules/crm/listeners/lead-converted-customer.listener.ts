/**
 * @module lead-converted-customer.listener
 * @description Reacts to LeadConvertedEvent (published by ConvertLeadToDealHandler
 *   via CQRS EventBus) and promotes the won lead into the canonical customer base
 *   (sd_customers). Owner's flow: "lead yutilsa → sd_customers'ga konversiya".
 *   Without this a won CRM lead never becomes a customer that orders/quotes attach to.
 *
 *   Raw SQL is used deliberately: crm_leads is a Bitrix-style table (status_id,
 *   status_description, comments, ...) and sd_customers has CHECK constraints
 *   (segment ∈ vip/regular/new/potential, status ∈ active/inactive). The insert is
 *   idempotent — it skips if a customer with the same name already exists, so
 *   re-conversion does not create duplicates.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { LeadConvertedEvent } from '../domain/events/lead-converted.event';

@Injectable()
@EventsHandler(LeadConvertedEvent)
export class LeadConvertedCustomerListener implements IEventHandler<LeadConvertedEvent> {
  private readonly logger = new Logger(LeadConvertedCustomerListener.name);

  async handle(event: LeadConvertedEvent): Promise<void> {
    try {
      // The event carries only leadId — read the won lead's contact info from the
      // live crm_leads columns (contact_name/full_name/name, contact_phone, contact_email).
      const leadRes = await db.execute(sql`
        SELECT contact_name, full_name, name, contact_phone, contact_email
        FROM crm_leads WHERE id = ${event.leadId} LIMIT 1
      `);
      const lead = (leadRes.rows?.[0] ?? null) as Record<string, unknown> | null;
      if (!lead) {
        this.logger.warn({ leadId: event.leadId }, 'LeadConverted: lead not found, skipping customer creation');
        return;
      }

      const custName = String(
        lead['contact_name'] ?? lead['full_name'] ?? lead['name'] ?? '',
      ).trim() || `Lead #${event.leadId}`;
      const phone = lead['contact_phone'] ?? null;
      const email = lead['contact_email'] ?? null;

      // sd_customers live constraints: segment ∈ {vip,regular,new,potential},
      // status ∈ {active,inactive}. A converted lead is a brand-new customer → segment 'new'.
      // Idempotent: skip if a customer with this name already exists.
      await db.execute(sql`
        INSERT INTO sd_customers (name, phone, email, segment, status, is_blocked, notes)
        SELECT ${custName}, ${phone}, ${email}, 'new', 'active', false,
               ${'CRM lid #' + event.leadId + ' dan konvertatsiya qilindi (deal #' + event.dealId + ')'}
        WHERE NOT EXISTS (
          SELECT 1 FROM sd_customers WHERE name = ${custName}
        )
      `);
      this.logger.log({ leadId: event.leadId, dealId: event.dealId, customer: custName }, 'Lead converted → sd_customers ensured');
    } catch (e: unknown) {
      // Non-fatal: conversion (deal) already succeeded; customer creation is best-effort.
      this.logger.error({ leadId: event.leadId, error: (e as Error)?.message }, 'Failed to create sd_customers from converted lead');
    }
  }
}
