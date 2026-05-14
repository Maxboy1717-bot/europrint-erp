/**
 * @module QuickCreateModal
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  User,
  Building2,
  X,
  Phone,
  Mail,
  DollarSign,
  Tag,
  FileText,
  Sparkles,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuickCreateModalProps, EntityType } from "./crm-types";

interface DuplicateEntry {
  id: number;
  name?: string;
  title?: string;
}

const SOURCE_OPTIONS = [
  { value: "CALL",     label: "Qo'ng'iroq" },
  { value: "WEBFORM",  label: "Veb-forma" },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "EMAIL",    label: "Email" },
  { value: "WEB",      label: "Veb-sayt" },
  { value: "INBOUND",  label: "Kiruvchi" },
  { value: "PARTNER",  label: "Hamkor" },
  { value: "OTHER",    label: "Boshqa" },
];

const CURRENCY_OPTIONS = [
  { value: "UZS", label: "UZS — So'm" },
  { value: "USD", label: "USD — Dollar" },
  { value: "EUR", label: "EUR — Yevro" },
  { value: "RUB", label: "RUB — Rubl" },
];

export function QuickCreateModal({ entityType, onClose }: QuickCreateModalProps) {
  const { toast } = useToast();
  const [title, setTitle]       = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [stir, setStir]         = useState("");
  const [source, setSource]     = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount]     = useState("");
  const [currency, setCurrency] = useState("UZS");
  const [duplicates, setDuplicates] = useState<DuplicateEntry[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const createMutation = useMutation<unknown, Error, boolean>({
    mutationFn: async (force: boolean) => {
      const endpoints: Partial<Record<EntityType, string>> = {
        leads:     "/api/crm/leads",
        deals:     "/api/crm/deals",
        contacts:  "/api/crm/contacts",
        companies: "/api/crm/companies",
      };
      const phones = phone ? [{ value: phone, type: "WORK" }] : [];
      const emails = email ? [{ value: email, type: "WORK" }] : [];
      const payloads: Record<string, Record<string, unknown>> = {
        leads: {
          title,
          phones,
          emails,
          ...(source ? { sourceId: source } : {}),
          ...(description ? { comments: description } : {}),
          ...(amount ? { opportunity: parseFloat(amount) || 0, currencyId: currency } : {}),
        },
        deals: {
          title,
          opportunity: parseFloat(amount) || 0,
          currencyId: currency,
          ...(description ? { comments: description } : {}),
        },
        contacts: { name: title, phones, emails, force },
        companies: {
          title,
          phones,
          emails,
          stir: stir || undefined,
          ...(description ? { comments: description } : {}),
          force,
        },
      };
      const endpoint = endpoints[entityType];
      if (!endpoint) throw new Error("Unknown entity type");
      return apiRequest("POST", endpoint, payloads[entityType]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/crm/${entityType}`] });
      toast({ title: "Yaratildi" });
      onClose();
    },
    onError: async (error: unknown) => {
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
    if (!title.trim()) {
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

  const entityLabels: Partial<Record<EntityType, string>> = {
    leads:     "Lid",
    deals:     "Bitim",
    contacts:  "Kontakt",
    companies: "Kompaniya",
  };

  const entityIcons: Partial<Record<EntityType, React.ElementType>> = {
    leads:     Sparkles,
    deals:     DollarSign,
    contacts:  User,
    companies: Building2,
  };

  const EntityIcon = entityIcons[entityType] ?? Sparkles;
  const showStir   = entityType === "companies";
  const showSource = entityType === "leads";
  const showAmount = entityType === "deals" || entityType === "leads";

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
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/30">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <EntityIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">{entityLabels[entityType]} yaratish</h3>
              <p className="text-[11px] text-muted-foreground">Asosiy ma'lumotlarni kiriting</p>
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
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-[var(--ep-yellow)] dark:text-yellow-400 text-sm">
                      Duplikat topildi
                    </div>
                    <div className="text-xs text-[var(--ep-yellow)] dark:text-yellow-500 mt-0.5">
                      Xuddi shunday {entityLabels[entityType]?.toLowerCase()} mavjud:
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {(Array.isArray(duplicates) ? duplicates : []).map((d) => (
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
                      <Badge variant="outline" className="text-xs shrink-0">
                        #{d.id}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDuplicateWarning(false)}
                    className="flex-1"
                  >
                    Orqaga
                  </Button>
                  <Button
                    onClick={handleForceCreate}
                    disabled={createMutation.isPending}
                    className="flex-1"
                    data-testid="button-force-create"
                  >
                    {createMutation.isPending ? "..." : "Baribir yaratish"}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    Nomi *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${entityLabels[entityType]} nomi`}
                    className="h-9"
                    data-testid="input-quick-title"
                    autoFocus
                  />
                </div>

                {entityType !== "deals" && (
                  <>
                    {/* Phone + Email side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          Telefon
                        </label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+998901234567"
                          className="h-9"
                          data-testid="input-quick-phone"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          Email
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
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
                          value={stir}
                          onChange={(e) => setStir(e.target.value)}
                          placeholder="123456789"
                          className="h-9"
                          data-testid="input-quick-stir"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Source (leads only) */}
                {showSource && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Manba
                    </label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger className="h-9" data-testid="select-quick-source">
                        <SelectValue placeholder="Manbani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Amount (deals + leads) */}
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
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="h-9 flex-1"
                        data-testid="input-quick-amount"
                      />
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="h-9 w-[90px]" data-testid="select-quick-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    Izoh
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Qo'shimcha ma'lumot..."
                    className="min-h-[70px] resize-none text-sm"
                    data-testid="input-quick-description"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-9"
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 h-9"
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                        Yaratilmoqda...
                      </span>
                    ) : (
                      "Yaratish"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
