/**
 * @module AuditConsoleTypes
 * @description Shared types and helpers for AuditConsole.
 */

import { Monitor, Server, Settings, Download, Layers, MessageSquare, Cpu, FileText } from "lucide-react";
import type { ReactElement } from "react";

export interface AuditDiffChange {
  field: string;
  old: unknown;
  new: unknown;
}

export interface AuditLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  documentNo?: string;
  source: string;
  sourceRef?: string;
  actorUserId?: string;
  actorFullName?: string;
  description?: string;
  diffJson?: AuditDiffChange[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  timestamp?: string;
  ipAddress?: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}

export interface AuditStats {
  totalLogs: number;
  actionStats: { actionType: string; count: number }[];
  entityStats: { entityType: string; count: number }[];
  sourceStats: { source: string; count: number }[];
  recentLogs: AuditLog[];
}

export interface AuditFilters {
  actionType: string;
  entityType: string;
  source: string;
  documentNo: string;
}

export interface AuditConsoleProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export function getActionBadgeColor(action: string): string {
  switch (action) {
    case "CREATE":          return "bg-green-500";
    case "UPDATE":          return "bg-blue-500";
    case "DELETE":          return "bg-red-500";
    case "APPROVE":         return "bg-emerald-500";
    case "CANCEL":          return "bg-orange-500";
    case "LOGIN":           return "bg-purple-500";
    case "LOGOUT":          return "bg-gray-500";
    case "SETTINGS_CHANGE": return "bg-yellow-500 text-foreground";
    case "STATUS_CHANGE":   return "bg-cyan-500";
    default:                return "bg-gray-500";
  }
}

export function getSourceIcon(source: string): ReactElement {
  switch (source) {
    case "UI_PAGE":      return <Monitor className="h-4 w-4" />;
    case "API_ENDPOINT": return <Server className="h-4 w-4" />;
    case "SYSTEM_JOB":   return <Settings className="h-4 w-4" />;
    case "IMPORT":       return <Download className="h-4 w-4" />;
    case "INTEGRATION":  return <Layers className="h-4 w-4" />;
    case "TELEGRAM":     return <MessageSquare className="h-4 w-4" />;
    case "IOT":          return <Cpu className="h-4 w-4" />;
    default:             return <FileText className="h-4 w-4" />;
  }
}

export function formatDiff(diffJson: AuditDiffChange[] | null | undefined): ReactElement[] | null {
  if (!diffJson || !Array.isArray(diffJson)) return null;
  return diffJson.map((change: AuditDiffChange, index: number) => (
    <div key={`k-${index}`} className="p-2 bg-muted rounded text-xs font-mono">
      <span className="text-muted-foreground">{change.field}: </span>
      <span className="text-[var(--ep-red)] line-through">{JSON.stringify(change.old)}</span>
      <span className="mx-1">→</span>
      <span className="text-[var(--ep-green)]">{JSON.stringify(change.new)}</span>
    </div>
  ));
}
