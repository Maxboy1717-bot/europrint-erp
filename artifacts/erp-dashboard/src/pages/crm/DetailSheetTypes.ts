/**
 * @module DetailSheetTypes
 * @description Local interfaces, label constants, and pure helper functions
 * shared across the DetailSheet component family.
 */

import type { Lead, Deal, Contact, Company, Proposal, Invoice, EntityData } from "./crm-types";
import { PROPOSAL_STATUS_MAP, INVOICE_STATUS_MAP } from "./crm-types";

// ---------------------------------------------------------------------------
// Local entity interfaces (not part of crm-types.ts)
// ---------------------------------------------------------------------------

export interface CrmActivity {
  id: number;
  subject: string;
  type: string;
  isDone: boolean;
  dueDate: string | null;
}

export interface SdOrder {
  id: number;
  documentNumber: string;
  overallStatus: string;
}

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

export const HISTORY_ACTION_LABELS: Record<string, string> = {
  created: "Yaratildi",
  updated: "Yangilandi",
  stage_changed: "Bosqich o'zgardi",
  deleted: "O'chirildi",
};

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  sent: "Yuborildi",
  viewed: "Ko'rildi",
  approved: "Tasdiqlandi",
  declined: "Rad etildi",
  calculated: "Hisoblandi",
  revised: "Qayta ko'rildi",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  sent: "Yuborildi",
  partial: "Qisman to'landi",
  paid: "To'landi",
  overdue: "Kechikdi",
  cancelled: "Bekor qilindi",
};

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/** Derives the display title for any CRM entity. */
export function getEntityTitle(entity: EntityData | undefined, entityType: string): string {
  if (!entity) return "Yuklanmoqda...";
  if (entityType === "leads" || entityType === "deals") return (entity as Lead | Deal).title;
  if (entityType === "contacts") {
    const c = entity as Contact;
    return ([c.lastName, c.name, c.secondName]).filter(Boolean).join(" ") || "Nomsiz";
  }
  if (entityType === "proposals") {
    return (entity as Proposal).title || `Taklif #${(entity as Proposal).number}`;
  }
  if (entityType === "invoices") {
    return (entity as Invoice).title || `Faktura #${(entity as Invoice).number}`;
  }
  return (entity as Company).title;
}

/** Returns the current stage/status ID for progress-bar highlighting. */
export function getCurrentStageId(entity: EntityData | undefined, entityType: string): string {
  if (!entity) return "";
  if (entityType === "leads") return (entity as Lead).statusId;
  if (entityType === "deals") return (entity as Deal).stageId;
  if (entityType === "proposals") {
    return PROPOSAL_STATUS_MAP[(entity as Proposal).status] || (entity as Proposal).status;
  }
  if (entityType === "invoices") {
    return (
      INVOICE_STATUS_MAP[(entity as Invoice).status] ||
      (entity as Invoice).stageId ||
      (entity as Invoice).status
    );
  }
  return "";
}

/** Returns the first phone value if the entity exposes a phones array. */
export function getEntityPhone(entity: EntityData | undefined): string {
  if (!entity || !("phones" in entity)) return "";
  return entity.phones?.[0]?.value || "";
}

/** Returns the first email value if the entity exposes an emails array. */
export function getEntityEmail(entity: EntityData | undefined): string {
  if (!entity || !("emails" in entity)) return "";
  return entity.emails?.[0]?.value || "";
}

// ---------------------------------------------------------------------------
// API endpoint resolver
// ---------------------------------------------------------------------------

/** Maps a CRM entityType string to its REST API base path. */
export function resolveEndpoint(entityType: string): string {
  switch (entityType) {
    case "leads":      return "/api/crm/leads";
    case "deals":      return "/api/crm/deals";
    case "contacts":   return "/api/crm/contacts";
    case "companies":  return "/api/crm/companies";
    case "proposals":  return "/api/crm-bitrix/proposals";
    case "invoices":   return "/api/crm-bitrix/invoices";
    default:           return "/api/crm/leads";
  }
}

// ---------------------------------------------------------------------------
// History record interface (used by HistoryTab and DetailSheet)
// ---------------------------------------------------------------------------

export interface HistoryRecord {
  id: number;
  action: string;
  oldStageId?: string;
  newStageId?: string;
  fieldName?: string;
  createdAt: string;
  user?: { fullName?: string };
}
