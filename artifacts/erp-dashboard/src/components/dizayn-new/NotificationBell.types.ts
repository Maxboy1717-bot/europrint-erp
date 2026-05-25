// i18next — notification type labels are translation data
/**
 * @module NotificationBell.types
 * @description Types and constants for the NotificationBell component.
 * Split from NotificationBell.tsx (Rule 16).
 */

import { AlertCircle, Package, GraduationCap, Info } from "lucide-react";

export type NotifType = "error" | "warning" | "success" | "info";

export interface Notification {
  id: string | number;
  type: NotifType;
  title: string;
  body?: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export interface NotificationBellProps {
  notifications?: Notification[];
  onMarkAllRead?: () => void;
  onMarkRead?: (id: string | number) => void;
  onViewAll?: () => void;
  onDismiss?: (id: string | number) => void;
  maxVisible?: number;
}

export const TYPE_CONFIG: Record<NotifType, {
  icon: React.ElementType;
  iconClass: string;
  dotClass: string;
  bgClass: string;
}> = {
  error:   { icon: AlertCircle,   iconClass: "text-[hsl(var(--error))]",   dotClass: "bg-[hsl(var(--error))]",   bgClass: "bg-[hsl(var(--error))]/10"   },
  warning: { icon: Package,       iconClass: "text-[hsl(var(--warning))]", dotClass: "bg-[hsl(var(--warning))]", bgClass: "bg-[hsl(var(--warning))]/10" },
  success: { icon: GraduationCap, iconClass: "text-[hsl(var(--success))]", dotClass: "bg-[hsl(var(--success))]", bgClass: "bg-[hsl(var(--success))]/10" },
  info:    { icon: Info,          iconClass: "text-[hsl(var(--info))]",    dotClass: "bg-[hsl(var(--info))]",    bgClass: "bg-[hsl(var(--info))]/10"    },
};

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "error",   title: "QC rad etildi",          body: "Buyurtma #2451 sifat nazoratidan o'tmadi",          time: "5 daqiqa oldin",  read: false, actionLabel: "Ko'rish", actionHref: "/qc" },
  { id: 2, type: "warning", title: "Material kam",            body: "Qog'oz A4 — 12% qoldi (minimum: 15%)",              time: "20 daqiqa oldin", read: false, actionLabel: "Xarid",   actionHref: "/mm/purchase" },
  { id: 3, type: "success", title: "LMS kurs tugallandi",     body: "Alisher N. — 'Xavfsizlik texnikasi' kursini tugatdi", time: "1 soat oldin",   read: false },
  { id: 4, type: "info",    title: "Yangi buyurtma",          body: "Buyurtma #2459 yaratildi — Iqtisodiyot nashriyoti", time: "2 soat oldin",    read: true },
  { id: 5, type: "warning", title: "Sertifikat muddati tugayapti", body: "Bobur K. sertifikati 5 kunda tugaydi",         time: "3 soat oldin",    read: true },
];
