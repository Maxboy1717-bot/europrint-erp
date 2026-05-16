/**
 * MarketingDashboardDialogs.tsx
 * Dialog components for MarketingDashboard: NPS submit, AI Churn Signal.
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Star, Zap, Plus } from "lucide-react";
import { RISK_LABELS, RISK_COLORS } from "./MarketingDashboardTypes";
import { useTranslation } from '@/lib/i18n';

// ─── NPS Submission Form ──────────────────────────────────────────────────────
export function NpsSubmitDialog() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ score: "8", comment: "", customerId: "" });

  const { data: companies = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/crm/companies"],
    enabled: open,
  });

  const npsMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/nps", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/nps/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/churn-risk"] });
      setOpen(false);
      setForm({ score: "8", comment: "", customerId: "" });
      const cat = (data as { npsCategory?: string }).npsCategory;
      toast({
        title: cat === "promoter" ? "Promoter — Rahmat!" : cat === "passive" ? "Passive — Yaxshilash kerak" : "Detractor — CRM task yaratildi",
        description: `NPS ${form.score}/10 saqlandi. CRM harakati: ${(data as { crmActionTriggered?: boolean }).crmActionTriggered ? "Yaratildi" : "Kerak emas"}`,
        variant: cat === "detractor" ? "destructive" : "default",
      });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const scoreNum = parseInt(form.score);
  const npsCategory = scoreNum >= 9 ? "promoter" : scoreNum >= 7 ? "passive" : "detractor";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid="button-nps-add">
          <Plus className="h-3 w-3 mr-1" />{t("npsQoshish")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("mijozNpsBahosi")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("mijoz1")}</Label>
            <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
              <SelectTrigger data-testid="select-nps-customer" className="h-9">
                <SelectValue placeholder={t("mijozniTanlangIxtiyoriy")} />
              </SelectTrigger>
              <SelectContent>
                {(companies as Array<{ id: number; name: string }>).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("ball110")}</Label>
            <Select value={form.score} onValueChange={(v) => setForm({ ...form, score: v })}>
              <SelectTrigger data-testid="select-nps-score" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} — {n >= 9 ? "Promoter" : n >= 7 ? "Passive" : "Detractor"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className={`mt-2 text-xs px-2 py-1 rounded font-medium w-fit ${npsCategory === "promoter" ? "bg-green-100 text-[var(--ep-green)]" : npsCategory === "passive" ? "bg-yellow-100 text-[var(--ep-yellow)]" : "bg-red-100 text-[var(--ep-red)]"}`}>
              {npsCategory === "promoter" ? "Promoter — CRM tavsiya beradi" : npsCategory === "passive" ? "Passive — Qo'llab-quvvatlash kerak" : "Detractor — CRM task yaratiladi (24 soat)"}
            </div>
          </div>
          <div>
            <Label>{t("Izoh")}</Label>
            <Textarea placeholder={t("mijozIzohi")} value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3} data-testid="textarea-nps-comment" />
          </div>
          <Button className="w-full"
            onClick={() => npsMutation.mutate({ score: parseInt(form.score), comment: form.comment || undefined, customerId: form.customerId ? parseInt(form.customerId) : undefined })}
            disabled={npsMutation.isPending} data-testid="button-nps-submit">
            {npsMutation.isPending ? "Saqlanmoqda..." : "NPS Saqlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AI Churn Signal ──────────────────────────────────────────────────────────
interface AiSignalResult {
  riskCustomersCount: number;
  npsAvg: string;
  aiSignal: {
    churnRiskLevel?: string;
    urgentActions?: string[];
    retentionCampaignIdea?: string;
    predictedChurnNextMonth?: number;
    keyInsight?: string;
  };
}

export function AiChurnSignal() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [result, setResult] = useState<AiSignalResult | null>(null);

  const aiMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/marketing/churn-risk/ai-signal", {}),
    onSuccess: (data) => {
      setResult(data as AiSignalResult);
      toast({ title: "AI churn tahlili tayyor!" });
    },
    onError: () => toast({ title: "AI signal xatoligi", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" onClick={() => aiMutation.mutate()}
        disabled={aiMutation.isPending} className="w-full" data-testid="button-ai-churn-signal">
        <Zap className={`h-3 w-3 mr-1 ${aiMutation.isPending ? "animate-pulse" : ""}`} />
        {aiMutation.isPending ? "AI tahlil qilmoqda..." : "AI Churn Signal"}
      </Button>

      {result && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("xavfDarajasi1")}</span>
            <Badge className={`${RISK_COLORS[result.aiSignal.churnRiskLevel || "low"]} text-xs`}>
              {RISK_LABELS[result.aiSignal.churnRiskLevel || "low"]}
            </Badge>
            <span className="text-muted-foreground">Bashorat: {result.aiSignal.predictedChurnNextMonth} ta</span>
          </div>
          {result.aiSignal.keyInsight && (
            <div className="p-2 bg-muted rounded-md text-muted-foreground">{result.aiSignal.keyInsight}</div>
          )}
          {result.aiSignal.urgentActions && result.aiSignal.urgentActions.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium text-foreground">{t("tezkorHarakatlar1")}</div>
              {(Array.isArray(result.aiSignal.urgentActions) ? result.aiSignal.urgentActions : []).map((a, i) => (
                <div key={`k-${i}`} className="flex items-start gap-1">
                  <span className="text-[var(--ep-primary)] shrink-0">•</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
          {result.aiSignal.retentionCampaignIdea && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md text-[var(--ep-blue)] dark:text-blue-300">
              Kampaniya g'oyasi: {result.aiSignal.retentionCampaignIdea}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
