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

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  { value: "STAGE_CHANGED", label: "Bosqich o'zgarganda", icon: RefreshCw },
  { value: "CREATED", label: "Yaratilganda", icon: Plus },
  { value: "FIELD_CHANGED", label: "Maydon o'zgarganda", icon: Edit },
  { value: "TIME_ELAPSED", label: "Vaqt o'tganda", icon: Clock },
];

export const ACTION_TYPES = [
  { value: "SEND_NOTIFICATION", label: "Xabar yuborish", icon: Bell },
  { value: "CREATE_TASK", label: "Vazifa yaratish", icon: ListChecks },
  { value: "CHANGE_STAGE", label: "Bosqichni o'zgartirish", icon: RefreshCw },
  { value: "CHANGE_FIELD", label: "Maydonni o'zgartirish", icon: Edit },
  { value: "SEND_EMAIL", label: "Email yuborish", icon: Mail },
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

export const LEAD_STAGES: Stage[] = [
  { id: 1, stageId: "NEW",         name: "Ishlov berilmagan", sort: 100, color: "#4CAF50" },
  { id: 2, stageId: "IN_PROGRESS", name: "Ishda",             sort: 200, color: "#2196F3" },
  { id: 3, stageId: "ANALYSIS",    name: "Tahlil qilish",     sort: 300, color: "#FF9800" },
  { id: 4, stageId: "FINAL",       name: "Yakunlash",         sort: 400, color: "#9C27B0" },
  { id: 5, stageId: "CONVERTED",   name: "Konvertatsiya",     sort: 500, color: "#22C55E" },
  { id: 6, stageId: "WON",         name: "Yutildi",           sort: 600, color: "#16A34A" },
  { id: 7, stageId: "LOST",        name: "Yo'qotildi",        sort: 700, color: "#EF4444" },
];

export const DEAL_STAGES: Stage[] = [
  { id: 1, stageId: "C0:NEW", name: "Yangi", sort: 100, color: "#4CAF50" },
  { id: 2, stageId: "C0:IN_PROGRESS", name: "Ishda", sort: 200, color: "#2196F3" },
  { id: 3, stageId: "C0:PAYMENT_PENDING", name: "To'lov kutilmoqda", sort: 300, color: "#FF9800" },
  { id: 4, stageId: "C0:ORDER", name: "Buyurtma", sort: 400, color: "#9C27B0" },
  { id: 5, stageId: "C0:DELIVERY_PENDING", name: "Yetkazish kutilmoqda", sort: 500, color: "#00BCD4" },
  { id: 6, stageId: "C0:DELIVERY", name: "Yetkazish", sort: 600, color: "#8BC34A" },
];

export const PROPOSAL_STAGES: Stage[] = [
  { id: 1, stageId: "NEW", name: "Yangi", sort: 100, color: "#6B7280" },
  { id: 2, stageId: "SENT", name: "Yuborildi", sort: 200, color: "#3B82F6" },
  { id: 3, stageId: "VIEWED", name: "Ko'rildi", sort: 300, color: "#8B5CF6" },
  { id: 4, stageId: "APPROVED", name: "Qabul qilindi", sort: 400, color: "#22C55E" },
  { id: 5, stageId: "DECLINED", name: "Rad etildi", sort: 500, color: "#EF4444" },
];

export const INVOICE_STAGES: Stage[] = [
  { id: 1, stageId: "NEW", name: "Yangi", sort: 100, color: "#6B7280" },
  { id: 2, stageId: "SENT", name: "Yuborildi", sort: 200, color: "#3B82F6" },
  { id: 3, stageId: "PARTIAL", name: "Qisman to'landi", sort: 300, color: "#F59E0B" },
  { id: 4, stageId: "PAID", name: "To'landi", sort: 400, color: "#22C55E" },
  { id: 5, stageId: "CANCELLED", name: "Bekor qilindi", sort: 500, color: "#6B7280" },
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
  leads: { label: "Lidlar", icon: PhoneIncoming, color: "#4CAF50" },
  deals: { label: "Bitimlar", icon: DollarSign, color: "#2196F3" },
  contacts: { label: "Kontaktlar", icon: User, color: "#9C27B0" },
  companies: { label: "Kompaniyalar", icon: Building2, color: "#FF9800" },
  proposals: { label: "Takliflar", icon: FileText, color: "#8B5CF6" },
  invoices: { label: "Fakturalar", icon: Receipt, color: "#F59E0B" },
  robots: { label: "Robotlar", icon: Bot, color: "#06B6D4" },
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
  onAddTask?: (id: number) => void;
}

export type EntityData = Lead | Deal | Contact | Company | Proposal | Invoice;
export type FilterableEntity = EntityData | Robot;

export interface KanbanColumnProps {
  stage: Stage;
  entities: FilterableEntity[];
  entityType: EntityType;
  totalValue?: number;
  onEntityClick?: (id: number) => void;
  onAddTask?: (id: number) => void;
  onQuickAdd?: () => void;
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
