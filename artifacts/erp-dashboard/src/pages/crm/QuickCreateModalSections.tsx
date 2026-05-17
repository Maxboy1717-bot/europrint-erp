/**
 * @module QuickCreateModalSections
 * @description Two presentational halves of the QuickCreateModal body:
 *   - DuplicateWarning: shown when the server returns DUPLICATE_DETECTED 409
 *   - QuickCreateForm: the actual create form
 *
 * Both receive their data and callbacks via props. State and mutations live
 * in the parent QuickCreateModal.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, User, Building2, Phone, Mail, DollarSign, Tag, FileText,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { EntityType } from "./crm-types";
import type { DuplicateEntry, QuickCreateFormState } from "./QuickCreateModalTypes";
import { SOURCE_OPTIONS, CURRENCY_OPTIONS } from "./QuickCreateModalTypes";

// ---------------------------------------------------------------------------
// DuplicateWarning
// ---------------------------------------------------------------------------

interface DuplicateWarningProps {
  entityType: EntityType;
  entityLabel: string;
  duplicates: DuplicateEntry[];
  onBack: () => void;
  onForceCreate: () => void;
  isPending: boolean;
}

export function DuplicateWarning({
  entityType,
  entityLabel,
  duplicates,
  onBack,
  onForceCreate,
  isPending,
}: DuplicateWarningProps) {
  const { t } = useTranslation("common");
  const rows = Array.isArray(duplicates) ? duplicates : [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
        <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] mt-0.5 shrink-0" />
        <div>
          <div className="font-medium text-[var(--ep-yellow)] dark:text-yellow-400 text-sm">
            {t("duplikatTopildi")}
          </div>
          <div className="text-xs text-[var(--ep-yellow)] dark:text-yellow-500 mt-0.5">
            Xuddi shunday {entityLabel.toLowerCase()} mavjud:
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-muted/20 text-sm"
          >
            {entityType === "contacts" ? (
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="flex-1 truncate font-medium">
              {d.name || d.title || `ID: ${d.id}`}
            </span>
            <Badge variant="outline" className="text-xs shrink-0">#{d.id}</Badge>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {t("back")}
        </Button>
        <Button
          onClick={onForceCreate}
          disabled={isPending}
          className="flex-1"
          data-testid="button-force-create"
        >
          {isPending ? "..." : "Baribir yaratish"}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuickCreateForm
// ---------------------------------------------------------------------------

interface QuickCreateFormProps {
  entityType: EntityType;
  entityLabel: string;
  form: QuickCreateFormState;
  setForm: (updater: (f: QuickCreateFormState) => QuickCreateFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function QuickCreateForm({
  entityType,
  entityLabel,
  form,
  setForm,
  onSubmit,
  onCancel,
  isPending,
}: QuickCreateFormProps) {
  const { t } = useTranslation("common");

  const showStir   = entityType === "companies";
  const showSource = entityType === "leads";
  const showAmount = entityType === "deals" || entityType === "leads";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Tag className="h-3 w-3" />
          {t("nomi")}
        </label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={`${entityLabel} nomi`}
          className="h-9"
          data-testid="input-quick-title"
          autoFocus
        />
      </div>

      {entityType !== "deals" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                {t("phone")}
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+998901234567"
                className="h-9"
                data-testid="input-quick-phone"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                {t("email1")}
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t("emailExampleCom")}
                className="h-9"
                data-testid="input-quick-email"
              />
            </div>
          </div>

          {showStir && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                STIR (INN)
              </label>
              <Input
                value={form.stir}
                onChange={(e) => setForm((f) => ({ ...f, stir: e.target.value }))}
                placeholder="123456789"
                className="h-9"
                data-testid="input-quick-stir"
              />
            </div>
          )}
        </>
      )}

      {showSource && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("manba")}
          </label>
          <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}>
            <SelectTrigger className="h-9" data-testid="select-quick-source">
              <SelectValue placeholder={t("manbaniTanlang")} />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showAmount && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" />
            {entityType === "deals" ? "Summa *" : "Byudjet"}
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0"
              className="h-9 flex-1"
              data-testid="input-quick-amount"
            />
            <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
              <SelectTrigger className="h-9 w-[90px]" data-testid="select-quick-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          {t("Izoh")}
        </label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder={t("qoshimchaMalumot")}
          className="min-h-[70px] resize-none text-sm"
          data-testid="input-quick-description"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9">
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1 h-9">
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full inline-block" />
              {t("yaratilmoqda")}
            </span>
          ) : (
            "Yaratish"
          )}
        </Button>
      </div>
    </form>
  );
}
