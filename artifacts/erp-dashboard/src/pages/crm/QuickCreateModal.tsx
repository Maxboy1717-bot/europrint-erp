/**
 * @module QuickCreateModal
 * @description Animated modal for quickly creating a CRM entity (lead, deal,
 * contact, or company). Owns mutation + form state; delegates form rendering
 * to QuickCreateModalSections.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  User, Building2, X, DollarSign, Sparkles,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queueCrmLead } from "@/lib/erp-offline-db";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { QuickCreateModalProps, EntityType } from "./crm-types";
import type { DuplicateEntry, QuickCreateFormState } from "./QuickCreateModalTypes";
import { INITIAL_FORM_STATE } from "./QuickCreateModalTypes";
import { DuplicateWarning, QuickCreateForm } from "./QuickCreateModalSections";

const ENTITY_LABELS: Partial<Record<EntityType, string>> = {
  leads:     "Lid",
  deals:     "Bitim",
  contacts:  "Kontakt",
  companies: "Kompaniya",
};

const ENTITY_ICONS: Partial<Record<EntityType, React.ElementType>> = {
  leads:     Sparkles,
  deals:     DollarSign,
  contacts:  User,
  companies: Building2,
};

function buildPayload(entityType: EntityType, form: QuickCreateFormState, force: boolean) {
  const phones = form.phone ? [{ value: form.phone, type: "WORK" }] : [];
  const emails = form.email ? [{ value: form.email, type: "WORK" }] : [];
  const map: Record<string, Record<string, unknown>> = {
    leads: {
      title: form.title,
      phones,
      emails,
      ...(form.source ? { sourceId: form.source } : {}),
      ...(form.description ? { comments: form.description } : {}),
      ...(form.amount ? { opportunity: parseFloat(form.amount) || 0, currencyId: form.currency } : {}),
    },
    deals: {
      title: form.title,
      opportunity: parseFloat(form.amount) || 0,
      currencyId: form.currency,
      ...(form.description ? { comments: form.description } : {}),
    },
    contacts: { name: form.title, phones, emails, force },
    companies: {
      title: form.title,
      phones,
      emails,
      stir: form.stir || undefined,
      ...(form.description ? { comments: form.description } : {}),
      force,
    },
  };
  return map[entityType];
}

const ENDPOINTS: Partial<Record<EntityType, string>> = {
  leads:     "/api/crm/leads",
  deals:     "/api/crm/deals",
  contacts:  "/api/crm/contacts",
  companies: "/api/crm/companies",
};

export function QuickCreateModal({ entityType, onClose }: QuickCreateModalProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [form, setForm] = useState<QuickCreateFormState>(INITIAL_FORM_STATE);
  const [duplicates, setDuplicates] = useState<DuplicateEntry[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const createMutation = useMutation<unknown, Error, boolean>({
    mutationFn: async (force: boolean) => {
      const endpoint = ENDPOINTS[entityType];
      if (!endpoint) throw new Error("Unknown entity type");
      // vision 13-crm#50: lead capture works offline (queued + auto-synced on
      // reconnect, server-wins). Deals/contacts/companies stay online-only.
      if (entityType === "leads" && !navigator.onLine) {
        await queueCrmLead(buildPayload("leads", form, force));
        return { __offlineQueued: true };
      }
      return apiRequest("POST", endpoint, buildPayload(entityType, form, force));
    },
    onSuccess: (res: unknown) => {
      if ((res as { __offlineQueued?: boolean } | null)?.__offlineQueued) {
        toast({ title: "📵 Oflayn saqlandi", description: "Tarmoq tiklanganda avtomatik yuboriladi" });
        onClose();
        return;
      }
      queryClient.invalidateQueries({ queryKey: [`/api/crm/${entityType}`] });
      toast({ title: "Yaratildi" });
      onClose();
    },
    onError: (error: unknown) => {
      const errMsg = (error as Error)?.message || "";
      if (errMsg.startsWith("409:")) {
        try {
          const data = JSON.parse(errMsg.slice(4).trim());
          if (data.code === "DUPLICATE_DETECTED") {
            setDuplicates(data.duplicates || []);
            setShowDuplicateWarning(true);
            return;
          }
        } catch {
          // WHY: error message is not JSON — fall through to generic toast below.
        }
      }
      toast({ title: "Xatolik", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Nom kerak", variant: "destructive" });
      return;
    }
    setDuplicates([]);
    setShowDuplicateWarning(false);
    createMutation.mutate(false);
  };

  const handleForceCreate = () => {
    setShowDuplicateWarning(false);
    createMutation.mutate(true);
  };

  const EntityIcon = ENTITY_ICONS[entityType] ?? Sparkles;
  const entityLabel = ENTITY_LABELS[entityType] ?? "Yangi";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md bg-card border border-border/60 rounded-lg shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          data-testid="quick-create-modal"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/30">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <EntityIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">{entityLabel} yaratish</h3>
              <p className="text-[11px] text-muted-foreground">{t("asosiyMalumotlarniKiriting")}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-5">
            {showDuplicateWarning ? (
              <DuplicateWarning
                entityType={entityType}
                entityLabel={entityLabel}
                duplicates={duplicates}
                onBack={() => setShowDuplicateWarning(false)}
                onForceCreate={handleForceCreate}
                isPending={createMutation.isPending}
              />
            ) : (
              <QuickCreateForm
                entityType={entityType}
                entityLabel={entityLabel}
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isPending={createMutation.isPending}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
