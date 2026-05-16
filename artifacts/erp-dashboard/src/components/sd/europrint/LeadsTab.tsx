/**
 * @module LeadsTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Phone, ArrowRight } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import { 
  SdLead, 
  fmt, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, SOURCE_LABELS 
} from "./types";

import { tLabel } from '@/lib/i18n/tLabel';
const LEAD_STAGES = ["new", "working", "quoted", "negotiating", "won", "lost", "frozen"];

export function LeadsTab() {
  const { t } = useTranslation("common");
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    contactName: "", contactPhone: "", source: "phone",
    productInterest: "", estimatedValue: "", managerId: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery<SdLead[]>({
    queryKey: ["/api/sd/leads"],
  });

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/sd/leads", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/leads/stats"] });
      setIsNew(false);
      setForm({ contactName: "", contactPhone: "", source: "phone", productInterest: "", estimatedValue: "", managerId: "" });
      toast({ title: "Leed qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: string }) => apiRequest("PUT", `/api/sd/leads/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/leads/stats"] });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const leadsByStatus = LEAD_STAGES.reduce((acc, st) => {
    acc[st] = (Array.isArray(leads) ? leads : []).filter((l: SdLead) => l.status === st);
    return acc;
  }, {} as Record<string, SdLead[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-3 flex-wrap">
          {LEAD_STAGES.slice(0, 5).map(st => (
            <div key={st} className="text-sm">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${LEAD_STATUS_COLORS[st]}`}>
                {LEAD_STATUS_LABELS[st]}
              </span>
              <span className="ml-1 font-bold">{leadsByStatus[st]?.length || 0}</span>
            </div>
          ))}
        </div>
        <Dialog open={isNew} onOpenChange={setIsNew}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-lead"><Plus className="w-4 h-4 mr-1" />{t("yangiLeed")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiLeed")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("kontaktIsmi")}</Label>
                <Input data-testid="input-lead-name" value={form.contactName}
                  onChange={e => setForm({ ...form, contactName: e.target.value })} /></div>
              <div><Label>{t("phone")}</Label>
                <Input data-testid="input-lead-phone" value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })} /></div>
              <div><Label>{t("manba")}</Label>
                <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                  <SelectTrigger data-testid="select-lead-source" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("qiziqishMahsuloti")}</Label>
                <Input data-testid="input-lead-product" value={form.productInterest}
                  onChange={e => setForm({ ...form, productInterest: e.target.value })} /></div>
              <div><Label>{tLabel('common.LeadsTab.taxminiyQiymatSom', "Taxminiy qiymat (so'm)")}</Label>
                <Input data-testid="input-lead-value" type="number" value={form.estimatedValue}
                  onChange={e => setForm({ ...form, estimatedValue: e.target.value })} /></div>
              <Button data-testid="button-save-lead" className="w-full"
                onClick={() => createMut.mutate({ ...form, estimatedValue: parseFloat(form.estimatedValue) || 0 })}
                disabled={!form.contactName || createMut.isPending}>
                {createMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2" style={{ minWidth: "900px" }}>
          {(Array.isArray(LEAD_STAGES) ? LEAD_STAGES : []).map(stage => (
            <div key={stage} className="flex-1 min-w-40">
              <div className={`text-xs font-semibold mb-2 px-2 py-1 rounded-md ${LEAD_STATUS_COLORS[stage]}`}>
                {LEAD_STATUS_LABELS[stage]} ({leadsByStatus[stage]?.length || 0})
              </div>
              <div className="space-y-2">
                {leadsByStatus[stage]?.map((lead: SdLead) => (
                  <Card key={lead.id} data-testid={`card-lead-${lead.id}`} className="cursor-default">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="font-medium text-sm">{lead.contactName || "—"}</div>
                      {lead.contactPhone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />{lead.contactPhone}
                        </div>
                      )}
                      {lead.productInterest && (
                        <div className="text-xs text-muted-foreground truncate">{lead.productInterest}</div>
                      )}
                      {lead.estimatedValue && lead.estimatedValue > 0 && (
                        <div className="text-xs font-semibold text-primary">{fmt(lead.estimatedValue)} so'm</div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="bg-muted px-1.5 py-0.5 rounded text-xs">{SOURCE_LABELS[lead.source || ""] || lead.source}</span>
                      </div>
                      {/* Status buttons */}
                      <div className="flex gap-1 flex-wrap pt-1 border-t">
                        {stage === "new" && (
                          <Button size="sm" variant="outline" className="text-xs h-6 px-2"
                            data-testid={`button-lead-working-${lead.id}`}
                            onClick={() => statusMut.mutate({ id: lead.id, status: "working" })}>
                            {t("boshlash")}
                          </Button>
                        )}
                        {stage === "working" && (
                          <Button size="sm" variant="outline" className="text-xs h-6 px-2"
                            data-testid={`button-lead-quoted-${lead.id}`}
                            onClick={() => statusMut.mutate({ id: lead.id, status: "quoted" })}>
                            {t("taklifYuborish")}
                          </Button>
                        )}
                        {(stage === "quoted" || stage === "negotiating") && (
                          <>
                            <Button size="sm" className="text-xs h-6 px-2 bg-green-600 hover:bg-[var(--ep-green)]/90"
                              data-testid={`button-lead-won-${lead.id}`}
                              onClick={() => statusMut.mutate({ id: lead.id, status: "won" })}>
                              {t("yutdi")}
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-6 px-2"
                              data-testid={`button-lead-lost-${lead.id}`}
                              onClick={() => statusMut.mutate({ id: lead.id, status: "lost" })}>
                              {t("yutqizdi")}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {leadsByStatus[stage]?.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">{t("bosh")}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
