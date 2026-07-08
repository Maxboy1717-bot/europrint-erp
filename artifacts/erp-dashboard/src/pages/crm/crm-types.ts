/**
 * @module crm-types
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import {
  PhoneIncoming,
  DollarSign,
  User,
  Building2,
  FileText,
  Receipt,
  Bot,
  RefreshCw,
  Plus,
  Edit,
  Clock,
  Bell,
  ListChecks,
  Mail,
  Send,
  Sparkles,
  Settings,
  Zap,
} from "lucide-react";
import { safeStorage } from '@/lib/safeStorage';

import { tLabel } from '@/lib/i18n/tLabel';
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

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const adminData = safeStorage.getItem('admin');
      if (adminData) {
        const parsed = JSON.parse(adminData);
        setUserId(parsed.user?.id || parsed.userId || null);
      }
    } catch (e) {
      // silently ignore — user session not available yet
    }
  }, []);
  
  return userId;
}

export { useDebounce } from '@/hooks/useDebounce';

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

export interface Lead {
  id: number;
  title: string;
  name: string | null;
  lastName: string | null;
  companyTitle: string | null;
  statusId: string;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  sourceId: string | null;
  assignedById: string | null;
  dateCreate: string;
  opportunity?: number;
}

export interface Deal {
  id: number;
  title: string;
  stageId: string;
  opportunity: number;
  currencyId: string;
  contactIds: number[];
  companyId: number | null;
  assignedById: string | null;
  dateCreate: string;
  dateModify: string;
  probability?: number;
}

export interface Contact {
  id: number;
  name: string | null;
  secondName: string | null;
  lastName: string | null;
  post: string | null;
  companyId: number | null;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  assignedById: string | null;
  dateCreate: string;
  companyTitle?: string;
}

export interface Company {
  id: number;
  title: string;
  industry: string | null;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  address: string | null;
  assignedById: string | null;
  dateCreate: string;
  dealCount?: number;
  revenue?: number;
}

export interface Proposal {
  id: number;
  number: string;
  title: string;
  dealId: number | null;
  contactId: number | null;
  companyId: number | null;
  status: string;
  totalAmount: number;
  currency: string;
  validUntil: string | null;
  assignedById: string | null;
  createdAt: string;
  dateCreate: string;
}

export interface Invoice {
  id: number;
  number: string;
  title: string;
  dealId: number | null;
  contactId: number | null;
  companyId: number | null;
  status: string;
  stageId: string | null;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  dueDate: string | null;
  assignedById: string | null;
  createdAt: string;
  dateCreate: string;
}

export interface Robot {
  id: number;
  entityType: string;
  stageId: string | null;
  name: string;
  nameRu: string | null;
  description: string | null;
  triggerType: string;
  triggerConditions: Record<string, unknown>;
  delayMinutes: number | null;
  actionType: string;
  actionConfig: Record<string, unknown>;
  targetType: string | null;
  targetUserId: string | null;
  isActive: boolean;
  sort: number;
  createdAt: string;
}

// Robot trigger and action types with labels
export const TRIGGER_TYPES = [
  { value: "STAGE_CHANGED", label: tLabel('crm.crm-.bosqichOzgarganda', "Bosqich o'zgarganda"), icon: RefreshCw },
  { value: "CREATED", label: tLabel('crm.crm-.yaratilganda', "Yaratilganda"), icon: Plus },
  { value: "FIELD_CHANGED", label: tLabel('crm.crm-.maydonOzgarganda', "Maydon o'zgarganda"), icon: Edit },
  { value: "TIME_ELAPSED", label: tLabel('crm.crm-.vaqtOtganda', "Vaqt o'tganda"), icon: Clock },
];

export const ACTION_TYPES = [
  { value: "SEND_NOTIFICATION", label: tLabel('crm.crm-.xabarYuborish', "Xabar yuborish"), icon: Bell },
  { value: "CREATE_TASK", label: tLabel('crm.crm-.vazifaYaratish', "Vazifa yaratish"), icon: ListChecks },
  { value: "CHANGE_STAGE", label: tLabel('crm.crm-.bosqichniOzgartirish', "Bosqichni o'zgartirish"), icon: RefreshCw },
  { value: "CHANGE_FIELD", label: tLabel('crm.crm-.maydonniOzgartirish', "Maydonni o'zgartirish"), icon: Edit },
  { value: "SEND_EMAIL", label: tLabel('crm.crm-.emailYuborish', "Email yuborish"), icon: Mail },
  { value: "SEND_TELEGRAM", label: "Telegram xabar", icon: Send },
  { value: "AI_ANALYZE", label: "AI tahlil qilish", icon: Sparkles },
];

export const ENTITY_COLORS: Record<string, string> = {
  leads: "border-l-4 border-l-green-500",
  deals: "border-l-4 border-l-blue-500",
  contacts: "border-l-4 border-l-purple-500",
  companies: "border-l-4 border-l-orange-500",
};

export interface Stage {
  id: number;
  stageId: string;
  name: string;
  nameRu?: string | null;
  sort: number;
  color: string | null;
}

// Stage keys below MUST match the real values persisted by the backend:
//  - Leads:  crm_leads.status_id (coarse Bitrix CHECK state) = NEW/IN_PROCESS/CONVERTED/JUNK
//            (see apps/api/src/modules/crm/leads/lead-status-id.util.ts). ANALYSIS/FINAL/WON/
//            CONVERTED/LOST are finer lifecycle stages persisted verbatim in status_description
//            (crm_leads.statusId, as exposed to the FE) when the card is dragged into that column.
//  - Deals:  crm_deals.status (DealStatus VO) = qualification/proposal/negotiation/won/lost
//            (see apps/api/src/modules/crm/domain/value-objects/deal-status.vo.ts).
// VISION-3340 #28: previous keys (IN_PROGRESS, C0:NEW, ...) were stale Bitrix-style values that
// never matched what gets written to the DB, so real rows fell into no Kanban column at all.
export const LEAD_STAGES: Stage[] = [
  { id: 1, stageId: "NEW",         name: "Ishlov berilmagan", sort: 100, color: "#4CAF50" },
  { id: 2, stageId: "IN_PROCESS",  name: "Ishda",             sort: 200, color: "#2196F3" },
  { id: 3, stageId: "ANALYSIS",    name: "Tahlil qilish",     sort: 300, color: "#FF9800" },
  { id: 4, stageId: "FINAL",       name: "Yakunlash",         sort: 400, color: "#9C27B0" },
  { id: 5, stageId: "CONVERTED",   name: "Konvertatsiya",     sort: 500, color: "#22C55E" },
  { id: 6, stageId: "WON",         name: "Yutildi",           sort: 600, color: "#16A34A" },
  { id: 7, stageId: "LOST",        name: tLabel('crm.crm-.yoqotildi', "Yo'qotildi"),        sort: 700, color: "#EF4444" },
  { id: 8, stageId: "JUNK",        name: tLabel('crm.crm-.nomaqbulLid', "Nomaqbul lid"),     sort: 800, color: "#6B7280" },
];

export const DEAL_STAGES: Stage[] = [
  { id: 1, stageId: "qualification", name: tLabel('crm.crm-.malakalashtirish', "Malakalashtirish"), sort: 100, color: "#4CAF50" },
  { id: 2, stageId: "proposal",      name: tLabel('crm.crm-.taklif', "Taklif"),                      sort: 200, color: "#2196F3" },
  { id: 3, stageId: "negotiation",   name: tLabel('crm.crm-.muzokara', "Muzokara"),                  sort: 300, color: "#FF9800" },
  { id: 4, stageId: "won",           name: tLabel('crm.crm-.yutildi', "Yutildi"),                    sort: 400, color: "#22C55E" },
  { id: 5, stageId: "lost",          name: tLabel('crm.crm-.yoqotildi', "Yo'qotildi"),                sort: 500, color: "#EF4444" },
];

export const PROPOSAL_STAGES: Stage[] = [
  { id: 1, stageId: "NEW", name: tLabel('crm.crm-.yangi', "Yangi"), sort: 100, color: "#6B7280" },
  { id: 2, stageId: "SENT", name: "Yuborildi", sort: 200, color: "#3B82F6" },
  { id: 3, stageId: "VIEWED", name: tLabel('crm.crm-.korildi', "Ko'rildi"), sort: 300, color: "#8B5CF6" },
  { id: 4, stageId: "APPROVED", name: "Qabul qilindi", sort: 400, color: "#22C55E" },
  { id: 5, stageId: "DECLINED", name: "Rad etildi", sort: 500, color: "#EF4444" },
];

export const INVOICE_STAGES: Stage[] = [
  { id: 1, stageId: "NEW", name: tLabel('crm.crm-.yangi', "Yangi"), sort: 100, color: "#6B7280" },
  { id: 2, stageId: "SENT", name: "Yuborildi", sort: 200, color: "#3B82F6" },
  { id: 3, stageId: "PARTIAL", name: tLabel('crm.crm-.qismanTolandi', "Qisman to'landi"), sort: 300, color: "#F59E0B" },
  { id: 4, stageId: "PAID", name: tLabel('crm.crm-.tolandi', "To'landi"), sort: 400, color: "#22C55E" },
  { id: 5, stageId: "CANCELLED", name: tLabel('crm.crm-.bekorQilindi', "Bekor qilindi"), sort: 500, color: "#6B7280" },
];

export const PROPOSAL_STATUS_MAP: Record<string, string> = {
  draft: "NEW",
  sent: "SENT",
  viewed: "VIEWED",
  approved: "APPROVED",
  declined: "DECLINED",
};

export const INVOICE_STATUS_MAP: Record<string, string> = {
  draft: "NEW",
  sent: "SENT",
  partial: "PARTIAL",
  paid: "PAID",
  overdue: "SENT",
  cancelled: "CANCELLED",
};

export const ENTITY_CONFIG = {
  leads: { label: tLabel('crm.crm-.lidlar', "Lidlar"), icon: PhoneIncoming, color: "#4CAF50" },
  deals: { label: tLabel('crm.crm-.bitimlar', "Bitimlar"), icon: DollarSign, color: "#2196F3" },
  contacts: { label: tLabel('crm.crm-.kontaktlar', "Kontaktlar"), icon: User, color: "#9C27B0" },
  companies: { label: tLabel('crm.crm-.kompaniyalar', "Kompaniyalar"), icon: Building2, color: "#FF9800" },
  proposals: { label: tLabel('crm.crm-.takliflar', "Takliflar"), icon: FileText, color: "#8B5CF6" },
  invoices: { label: tLabel('crm.crm-.fakturalar', "Fakturalar"), icon: Receipt, color: "#F59E0B" },
  robots: { label: tLabel('crm.crm-.robotlar', "Robotlar"), icon: Bot, color: "#06B6D4" },
};

export interface QuickScore {
  score: number;
  churnRisk: "low" | "medium" | "high";
  hasIssues: boolean;
}

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

export type EntityData = Lead | Deal | Contact | Company | Proposal | Invoice;
export type FilterableEntity = EntityData | Robot;

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
