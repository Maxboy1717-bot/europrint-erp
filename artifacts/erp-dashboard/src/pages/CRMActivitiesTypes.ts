/**
 * @module CRMActivitiesTypes
 * @description Shared types and constants for CRMActivities.
 */

import { Phone, Calendar, CheckSquare, Mail, Video } from "lucide-react";
import type { ComponentType } from "react";

export interface Activity {
  id: number;
  type: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  dealId: number | null;
  contactId: number | null;
  companyId: number | null;
  assignedById: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Deal {
  id: number;
  title: string;
}

export interface Contact {
  id: number;
  name: string;
}

export interface NewActivityState {
  type: string;
  subject: string;
  description: string;
  priority: string;
  dealId: string;
  contactId: string;
  scheduledAt: string;
}

export const INITIAL_NEW_ACTIVITY: NewActivityState = {
  type: "call",
  subject: "",
  description: "",
  priority: "medium",
  dealId: "",
  contactId: "",
  scheduledAt: "",
};

export const activityTypes: {
  value: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { value: "call",    labelKey: "callType",      icon: Phone,       color: "bg-blue-500"   },
  { value: "meeting", labelKey: "meetingType",   icon: Calendar,    color: "bg-green-500"  },
  { value: "task",    labelKey: "taskType",      icon: CheckSquare, color: "bg-orange-500" },
  { value: "email",   labelKey: "emailType",     icon: Mail,        color: "bg-purple-500" },
  { value: "video",   labelKey: "videoCallType", icon: Video,       color: "bg-red-500"    },
];

export const priorityColors: Record<string, string> = {
  low:    "bg-gray-500",
  medium: "bg-yellow-500",
  high:   "bg-orange-500",
  urgent: "bg-red-500",
};

export function getActivityIcon(type: string): ComponentType<{ className?: string }> {
  const actType = activityTypes.find(t => t.value === type);
  return actType?.icon ?? CheckSquare;
}

export function getActivityColor(type: string): string {
  const actType = activityTypes.find(t => t.value === type);
  return actType?.color ?? "bg-gray-500";
}
