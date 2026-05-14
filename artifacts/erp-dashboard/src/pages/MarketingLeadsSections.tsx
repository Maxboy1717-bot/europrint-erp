/**
 * @module MarketingLeadsSections
 * @description Lead table rows, filter bar, KPI stat chips, loss-analysis panel,
 * and the contact-log side-panel for MarketingLeads. No routing / mutation logic.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowRightCircle, CheckCircle2, Mail, MessageSquare, Pencil, Phone, PhoneCall, Trash2, X } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  contactTypeLabels,
  outcomeLabels,
  scoreBadgeClass,
  sourceLabels,
  statusLabels,
  type ContactFormState,
  type ContactLog,
  type FilterKey,
  type LossAnalysis,
  type MarketingLead,
} from "./MarketingLeadsTypes";
import { EPStatusPill } from "@/components/ep";

// ─── Filter bar ──────────────────────────────────────────────────────────────

interface FilterBarProps {
  leads: MarketingLead[];
  overdueCount: number;
  filter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
}

export function LeadFilterBar({ leads, overdueCount, filter, onFilterChange }: FilterBarProps) {
  const arr = Array.isArray(leads) ? leads : [];
  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: `Hammasi (${arr.length})` },
    { key: "hot", label: `Issiq (${arr.filter(l => (l.score || 0) >= 60).length})` },
    { key: "overdue", label: `Muddati o'tgan (${overdueCount})` },
    { key: "lost", label: `Yo'qolgan (${arr.filter(l => l.status === "lost").length})` },
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap mb-4">
      {filters.map(f => (
        <Button
          key={f.key}
          variant={filter === f.key ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(f.key)}
          data-testid={`button-filter-${f.key}`}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}

// ─── Loss analysis panel ─────────────────────────────────────────────────────

interface LossAnalysisPanelProps {
  lossAnalysis: LossAnalysis | undefined;
}

export function LossAnalysisPanel({ lossAnalysis }: LossAnalysisPanelProps) {
  if (!lossAnalysis || !Array.isArray(lossAnalysis.breakdown) || lossAnalysis.breakdown.length === 0) {
    return null;
  }
  return (
    <div className="bg-card rounded-lg p-4 mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Yo'qotish sabablari tahlili
      </p>
      <div className="flex gap-3 flex-wrap">
        {(Array.isArray(lossAnalysis?.breakdown) ? lossAnalysis.breakdown : []).map(b => (
          <div key={b.reason} className="flex items-center gap-2 bg-muted/60 rounded-md px-3 py-1.5">
            <span className="text-sm font-medium text-foreground">{b.reason}</span>
            <EPStatusPill tone="neutral" className="text-xs">
              {b.count} ({b.percent}%)
            </EPStatusPill>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Lead list ───────────────────────────────────────────────────────────────

interface LeadListProps {
  leads: MarketingLead[];
  overdueIds: Set<string>;
  contactLeadId: string | null;
  convertToCrmMutation: UseMutationResult<unknown, Error, string>;
  onToggleContact: (id: string) => void;
  onEdit: (l: MarketingLead) => void;
  onDelete: (id: string) => void;
}

export function LeadList({
  leads,
  overdueIds,
  contactLeadId,
  convertToCrmMutation,
  onToggleContact,
  onEdit,
  onDelete,
}: LeadListProps) {
  const arr = Array.isArray(leads) ? leads : [];

  if (arr.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 text-center text-muted-foreground">
        Hozircha lidlar yo'q
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <div className="divide-y divide-outline-variant/30">
        {arr.map(l => (
          <div
            key={l.id}
            className="flex items-center justify-between gap-4 px-5 py-4 hover-elevate"
            data-testid={`card-lead-${l.id}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{l.name}</span>
                {l.company && <span className="text-sm text-muted-foreground">— {l.company}</span>}
                <Badge
                  className={`text-xs font-semibold no-default-hover-elevate ${scoreBadgeClass(l.score)}`}
                  data-testid={`badge-score-${l.id}`}
                >
                  {l.score || 0} ball
                </Badge>
                {overdueIds.has(l.id) && (
                  <Badge
                    className="bg-amber-100 text-amber-800 text-xs no-default-hover-elevate gap-1"
                    data-testid={`badge-overdue-${l.id}`}
                  >
                    <AlertTriangle className="h-3 w-3" /> Muddati o'tgan
                  </Badge>
                )}
                {l.crmLeadId && (
                  <Badge
                    className="bg-green-100 text-green-800 text-xs no-default-hover-elevate gap-1"
                    data-testid={`badge-crm-${l.id}`}
                  >
                    <CheckCircle2 className="h-3 w-3" /> CRM da
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                {l.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {l.phone}
                  </span>
                )}
                {l.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {l.email}
                  </span>
                )}
                {(l as MarketingLead & { lostReason?: string }).lostReason && (
                  <span className="text-[var(--ep-red)] text-xs">
                    Sabab: {(l as MarketingLead & { lostReason?: string }).lostReason}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs no-default-hover-elevate">
                {statusLabels[l.status || "new"]}
              </Badge>
              <Badge className="bg-primary/10 text-primary text-xs no-default-hover-elevate">
                {sourceLabels[l.source || "website"] || l.source}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onToggleContact(l.id)}
                data-testid={`button-contacts-${l.id}`}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              {!l.crmLeadId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => convertToCrmMutation.mutate(l.id)}
                  disabled={convertToCrmMutation.isPending}
                  data-testid={`button-convert-crm-${l.id}`}
                >
                  <ArrowRightCircle className="h-4 w-4" /> CRM
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(l)}
                data-testid={`button-edit-lead-${l.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-[var(--ep-red)]"
                onClick={() => onDelete(l.id)}
                data-testid={`button-delete-lead-${l.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Contact log side-panel ──────────────────────────────────────────────────

interface ContactLogPanelProps {
  contacts: ContactLog[];
  contactForm: ContactFormState;
  onContactFormChange: (f: ContactFormState) => void;
  onAddContact: () => void;
  isAddPending: boolean;
  onClose: () => void;
}

export function ContactLogPanel({
  contacts,
  contactForm,
  onContactFormChange,
  onAddContact,
  isAddPending,
  onClose,
}: ContactLogPanelProps) {
  return (
    <div
      className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg z-50 flex flex-col"
      data-testid="panel-contact-log"
    >
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h3 className="font-semibold text-foreground">Aloqa logi</h3>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Hozircha aloqa yo'q</p>
        ) : (
          (Array.isArray(contacts) ? contacts : []).map(c => (
            <div key={c.id} className="bg-muted/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <PhoneCall className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {contactTypeLabels[c.type] || c.type}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(c.contactedAt).toLocaleDateString("uz-UZ")}
                </span>
              </div>
              {c.summary && <p className="text-sm text-muted-foreground">{c.summary}</p>}
              {c.outcome && (
                <Badge className="text-xs mt-1 no-default-hover-elevate">
                  {outcomeLabels[c.outcome] || c.outcome}
                </Badge>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border/30 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Yangi aloqa qo'shish
        </p>
        <Select
          value={contactForm.type}
          onValueChange={v => onContactFormChange({ ...contactForm, type: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(contactTypeLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Qisqacha xulosa..."
          value={contactForm.summary}
          onChange={e => onContactFormChange({ ...contactForm, summary: e.target.value })}
          className="resize-none"
        />
        <Select
          value={contactForm.outcome}
          onValueChange={v => onContactFormChange({ ...contactForm, outcome: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(outcomeLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="w-full"
          onClick={onAddContact}
          disabled={isAddPending}
          data-testid="button-add-contact"
        >
          Qayd etish
        </Button>
      </div>
    </div>
  );
}
