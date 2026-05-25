/**
 * @module crm-types-data
 * @description Pure CRM interfaces and simple constants (no React/icon deps).
 * Split from crm-types.ts (Rule 16).
 *
 * Domain interfaces (Lead, Deal, Contact, Company, Proposal, Invoice, Robot, Stage)
 * are re-exported from crm-types.ts (single source of truth).
 * This file only owns the non-React constants, helpers, and compound types.
 */

// Re-export domain interfaces from canonical source (for consumers of this module)
export type {
  Lead,
  Deal,
  Contact,
  Company,
  Proposal,
  Invoice,
  Robot,
  Stage,
} from "./crm-types";

// Import for local use in compound type definitions below
import type {
  Lead,
  Deal,
  Contact,
  Company,
  Proposal,
  Invoice,
  Robot,
  Stage,
} from "./crm-types";

export type EntityType = "leads" | "deals" | "contacts" | "companies" | "proposals" | "invoices" | "robots";
export type ViewMode = "kanban" | "list" | "tasks" | "calendar" | "robots";
export type QuickFilter = "all" | "today" | "my" | "incoming";

export interface AdvancedFilters {
  dateFrom: string | null;
  dateTo: string | null;
  stageId: string | null;
  assignedById: string | null;
  sourceId: string | null;
  amountFrom: number | null;
  amountTo: number | null;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  dateFrom: null,
  dateTo: null,
  stageId: null,
  assignedById: null,
  sourceId: null,
  amountFrom: null,
  amountTo: null,
};

export const INCOMING_SOURCES = ["WEBFORM", "TELEGRAM", "CALL", "EMAIL", "WEB", "INBOUND"];

export function getActiveFilterCount(filters: AdvancedFilters): number {
  let count = 0;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  if (filters.stageId) count++;
  if (filters.assignedById) count++;
  if (filters.sourceId) count++;
  if (filters.amountFrom !== null) count++;
  if (filters.amountTo !== null) count++;
  return count;
}

export const ENTITY_COLORS: Record<string, string> = {
  leads: "border-l-4 border-l-green-500",
  deals: "border-l-4 border-l-blue-500",
  contacts: "border-l-4 border-l-purple-500",
  companies: "border-l-4 border-l-orange-500",
};

export const PROPOSAL_STATUS_MAP: Record<string, string> = {
  draft: "NEW", sent: "SENT", viewed: "VIEWED", approved: "APPROVED", declined: "DECLINED",
};

export const INVOICE_STATUS_MAP: Record<string, string> = {
  draft: "NEW", sent: "SENT", partial: "PARTIAL", paid: "PAID", overdue: "SENT", cancelled: "CANCELLED",
};

export interface QuickScore {
  score: number;
  churnRisk: "low" | "medium" | "high";
  hasIssues: boolean;
}

export type EntityData = Lead | Deal | Contact | Company | Proposal | Invoice;
export type FilterableEntity = EntityData | Robot;

export interface EntityCardProps {
  entity: FilterableEntity;
  entityType: EntityType;
  isDragging?: boolean;
  onClick?: (id: number) => void;
  onAddTask?: (id: number | string) => void;
  stageColor?: string;
  stageIndex?: number;
  totalStages?: number;
}

export interface KanbanColumnProps {
  stage: Stage;
  entities: FilterableEntity[];
  entityType: EntityType;
  totalValue?: number;
  onEntityClick?: (id: number) => void;
  onAddTask?: (id: number | string) => void;
  onQuickAdd?: () => void;
  stageIndex?: number;
  totalStages?: number;
}

export interface QuickCreateModalProps {
  entityType: EntityType;
  onClose: () => void;
}

export interface DetailSheetProps {
  entityId: number | null;
  entityType: EntityType;
  open: boolean;
  onClose: () => void;
  stages: Stage[];
}

export interface RobotsViewProps {
  robots: Robot[];
  isLoading: boolean;
}

export interface RobotFormData {
  name: string;
  description: string;
  entityType: string;
  triggerType: string;
  triggerConditions: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
}

export const DEFAULT_ROBOT_FORM: RobotFormData = {
  name: "",
  description: "",
  entityType: "leads",
  triggerType: "CREATED",
  triggerConditions: {},
  actionType: "SEND_NOTIFICATION",
  actionConfig: {},
  isActive: true,
};
