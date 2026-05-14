/**
 * @module types
 * @description React UI component.
 */

import { Phone, Calendar as CalendarIcon, ListTodo, FileText, Video, Mail, Smartphone, MessageCircle, MessageSquare, PhoneIncoming, PhoneOutgoing } from "lucide-react";

export interface Activity {
  id: number;
  type: "call" | "meeting" | "task" | "note" | "email" | "sms" | "whatsapp";
  subject: string;
  description?: string;
  deadline?: string;
  completed: boolean;
  createdAt: string;
  responsibleId?: string;
  responsibleName?: string;
  direction?: "incoming" | "outgoing";
  duration?: number;
  recording?: string;
  status?: "pending" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
}

export interface Comment {
  id: number;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  attachments?: { name: string; url: string }[];
}

export interface TimelineItem {
  id: number;
  type: "activity" | "comment" | "call" | "email" | "task" | "stage_change" | "note";
  data: Activity | Comment | Record<string, unknown>;
  createdAt: string;
}

export interface BitrixActivityPanelProps {
  entityType: "lead" | "deal" | "contact" | "company";
  entityId: number;
  phone?: string;
  email?: string;
  onActivityCreated?: () => void;
}

export const ACTIVITY_TYPE_OPTIONS = [
  { value: "call", label: "Qo'ng'iroq", icon: Phone },
  { value: "meeting", label: "Uchrashuv", icon: CalendarIcon },
  { value: "task", label: "Vazifa", icon: ListTodo },
  { value: "note", label: "Eslatma", icon: FileText },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Past", color: "text-[var(--ep-green)]" },
  { value: "medium", label: "O'rta", color: "text-[var(--ep-yellow)]" },
  { value: "high", label: "Yuqori", color: "text-[var(--ep-red)]" },
];

export const WHATSAPP_TEMPLATES = [
  { id: "greeting", label: "Salom xabari", text: "Assalomu alaykum! Qanday yordam bera olaman?" },
  { id: "followup", label: "Kuzatuv", text: "Oldingi suhbatimiz bo'yicha xabar berishni istedim..." },
  { id: "offer", label: "Taklif", text: "Sizga maxsus taklifimiz bor..." },
  { id: "reminder", label: "Eslatma", text: "Uchrashuvimiz haqida eslatib o'tmoqchiman..." },
];

export const MEETING_DURATIONS = [
  { value: "15", label: "15 daqiqa" },
  { value: "30", label: "30 daqiqa" },
  { value: "45", label: "45 daqiqa" },
  { value: "60", label: "1 soat" },
  { value: "90", label: "1.5 soat" },
  { value: "120", label: "2 soat" },
];

export const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];
