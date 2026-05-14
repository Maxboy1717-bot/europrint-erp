/** @module DocumentWorkflowPageHelpers @description Small, stateless helper components shared across DocumentWorkflow sections: DeadlineBadge. */

import { Badge } from "@/components/ui/badge";
import { DOC_TYPES_KEYS } from "./DocumentWorkflowPageTypes";
import { EPStatusPill } from "@/components/ep";

// ---------------------------------------------------------------------------
// DeadlineBadge
// ---------------------------------------------------------------------------

interface DeadlineBadgeProps {
  deadlineAt: string;
}

export function DeadlineBadge({ deadlineAt }: DeadlineBadgeProps) {
  if (!deadlineAt) return null;
  const ms    = new Date(deadlineAt).getTime() - Date.now();
  const mins  = Math.round(ms / 60000);
  const hours = Math.round(ms / 3600000);

  if (ms < 0)      return <Badge className="bg-red-800 text-white text-xs">⏰ Muddat o'tgan</Badge>;
  if (hours < 2)   return <Badge className="bg-[var(--ep-primary)] text-white text-xs">⚡ {mins} daq qoldi</Badge>;
  if (hours < 24)  return <EPStatusPill tone="warning">⏳ {hours} soat qoldi</EPStatusPill>;
  return null;
}

// ---------------------------------------------------------------------------
// docTypeLabel — translate a doc_type value to its i18n label via t()
// ---------------------------------------------------------------------------

type TFn = (key: string) => string;

export function docTypeLabel(docType: string, t: TFn): string {
  const entry = DOC_TYPES_KEYS.find(d => d.value === docType);
  return entry ? t(entry.key) : docType;
}
