/**
 * @module MarketingSocialInboxTypes
 * @description TypeScript interfaces, types, and constants for MarketingSocialInbox.
 * No JSX in this file.
 */

import { MessageSquare, MessageCircle, Send, Instagram, Facebook } from "lucide-react";

export interface SocialConversation {
  id: string;
  platform: string;
  externalId: string;
  contactName: string;
  contactPhone: string | null;
  contactAvatar: string | null;
  status: string;
  assignedTo: string | null;
  isAiHandling: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  priority: string | null;
  tags: string[] | null;
}

export interface SocialMessage {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  text: string;
  mediaUrl: string | null;
  mediaType: string | null;
  isAi: boolean;
  isAiGenerated: boolean;
  isRead: boolean;
  sentAt: string;
}

export interface InboxStats {
  totalConversations: number;
  openConversations: number;
  unreadCount: number;
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "hozirgina";
  if (diffMin < 60) return `${diffMin} min oldin`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} soat oldin`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

export const platformConfig: Record<string, { icon: typeof MessageSquare; color: string; label: string }> = {
  instagram: { icon: Instagram, color: "bg-purple-500/10 text-[var(--ep-purple)] dark:text-purple-400", label: "Instagram" },
  facebook:  { icon: Facebook,  color: "bg-blue-500/10 text-[var(--ep-blue)] dark:text-blue-400",   label: "Facebook"  },
  telegram:  { icon: Send,      color: "bg-sky-500/10 text-[var(--ep-blue)] dark:text-sky-400",       label: "Telegram"  },
  whatsapp:  { icon: MessageCircle, color: "bg-green-500/10 text-[var(--ep-green)] dark:text-green-400", label: "WhatsApp" },
};

export const statusLabels: Record<string, string> = {
  open:     "Ochiq",
  assigned: "Tayinlangan",
  resolved: "Hal qilingan",
};
