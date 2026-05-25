/**
 * @module LeadDetailSheet
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, Zap, User } from "lucide-react";
import { Lead, LeadFormValues, STAGE_CONFIG, Stage, Activity, HistoryItem } from "./types";
import { LeadHeader } from "./LeadHeader";
import { LeadInfo } from "./LeadInfo";
import { LeadActions } from "./LeadActions";
import { LeadActivities } from "./LeadActivities";
import { useTranslation } from '@/lib/i18n';

interface LeadDetailSheetProps {
  leadId: number | null;
  open: boolean;
  onClose: () => void;
}

export function LeadDetailSheet({ leadId, open, onClose }: LeadDetailSheetProps) {
  const { t } = useTranslation("common");
  const [isEditing, setIsEditing] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertOptions, setConvertOptions] = useState({
    createDeal: true,
    createContact: true,
    createCompany: true,
  });
  const { toast } = useToast();

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["/api/crm/leads", leadId],
    enabled: !!leadId && open,
  });

  const { data: stages = [] } = useQuery<Stage[]>({
    queryKey: ["/api/crm/lead-stages"],
    enabled: open,
  });

  const { data: history = [] } = useQuery<HistoryItem[]>({
    queryKey: ["/api/crm/history", leadId, "lead"],
    queryFn: () => apiRequest('GET', `/api/crm/history?entityType=lead&entityId=${leadId}`),
    enabled: !!leadId && open,
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/crm/followup-activities", leadId, "lead"],
    queryFn: () => apiRequest('GET', `/api/crm/followup-activities?entityType=lead&entityId=${leadId}`),
    enabled: !!leadId && open,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      return apiRequest("PATCH", `/api/crm/leads/${leadId}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId] });
      toast({ title: "Saqlandi", description: "Lead yangilandi" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Saqlashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<Record<string, unknown>>("POST", `/api/crm/leads/${leadId}/convert`, convertOptions);
    },
    onSuccess: (data: Record<string, unknown>) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] });
      setShowConvertDialog(false);
      toast({
        title: "Lid konvertatsiya qilindi!",
        description: ([
          data?.deal ? `Deal yaratildi` : "",
          data?.contact ? `Kontakt yaratildi` : "",
          data?.company ? `Kompaniya yaratildi` : "",
        ]).filter(Boolean).join(" • "),
      });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Konvertatsiyada xatolik", variant: "destructive" });
    },
  });

  const stageChangeMutation = useMutation({
    mutationFn: async (statusId: string) => {
      return apiRequest<Record<string, unknown>>("PATCH", `/api/crm/leads/${leadId}/stage`, { statusId });
    },
    onSuccess: (data: Record<string, unknown>) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId] });
      if (data?.autoOrder) {
        toast({
          title: "Lid yutildi — SD buyurtma yaratildi!",
          description: `Buyurtma: ${(data.autoOrder as Record<string, unknown>).documentNumber}`,
        });
      } else {
        toast({ title: "Bosqich yangilandi" });
      }
    },
  });

  const getLeadScore = () => {
    if (!lead) return 0;
    let score = 30;
    if (lead.phones?.length > 0) score += 20;
    if (lead.emails?.length > 0) score += 15;
    if (lead.companyTitle) score += 15;
    if (lead.opportunity && lead.opportunity > 0) score += 20;
    return Math.min(score, 100);
  };

  const currentStage = (Array.isArray(stages) ? stages : []).find((s) => s.stageId === lead?.statusId) ||
    (lead?.statusId ? { stageId: lead.statusId, name: STAGE_CONFIG[lead.statusId]?.label || lead.statusId, color: STAGE_CONFIG[lead.statusId]?.color || "#888" } : null);

  const isConverted = lead?.statusId === "CONVERTED" || lead?.statusId === "WON";
  const isLost = lead?.statusId === "LOST";

  if (!lead && !isLoading) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-0">
          <LeadHeader
            lead={lead || null}
            leadId={leadId}
            leadScore={getLeadScore()}
            currentStage={currentStage}
            onStageChange={(s) => stageChangeMutation.mutate(s)}
          />

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 pt-4">
              <div className="space-y-6">
                <LeadActions
                  lead={lead || null}
                  isConverted={isConverted}
                  isLost={isLost}
                  onConvert={() => setShowConvertDialog(true)}
                  onStageChange={(s) => stageChangeMutation.mutate(s)}
                  isStagePending={stageChangeMutation.isPending}
                />

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t("leadMalumotlari")}
                      </div>
                      {!isEditing && (
                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} data-testid="button-edit-lead">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LeadInfo
                      lead={lead || null}
                      isEditing={isEditing}
                      isPending={updateLeadMutation.isPending}
                      onSubmit={(v) => updateLeadMutation.mutate(v)}
                      onCancel={() => setIsEditing(false)}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <LeadActivities activities={activities} history={history} lead={lead || null} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent data-testid="dialog-convert-lead" className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--ep-green)]" />
              {t("lidniKonvertatsiyaQilish")}
            </DialogTitle>
            <DialogDescription>
              "{lead?.title}" lidini Deal, Kontakt va/yoki Kompaniyaga o'tkazing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{t("nimaYaratilsin")}</Label>

              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setConvertOptions(o => ({ ...o, createDeal: !o.createDeal }))}>
                <Checkbox checked={convertOptions.createDeal} data-testid="checkbox-create-deal" />
                <div>
                  <p className="font-medium text-sm">Deal (Kelishuv)</p>
                  <p className="text-xs text-muted-foreground">{t("crmPipelineGaYangiDeal")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setConvertOptions(o => ({ ...o, createContact: !o.createContact }))}>
                <Checkbox checked={convertOptions.createContact} data-testid="checkbox-create-contact" />
                <div>
                  <p className="font-medium text-sm">{t("kontakt")}</p>
                  <p className="text-xs text-muted-foreground">
                    {([lead?.name, lead?.lastName]).filter(Boolean).join(" ") || "Ismli kontakt"} yaratish
                  </p>
                </div>
              </div>

              {lead?.companyTitle && (
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setConvertOptions(o => ({ ...o, createCompany: !o.createCompany }))}>
                  <Checkbox checked={convertOptions.createCompany} data-testid="checkbox-create-company" />
                  <div>
                    <p className="font-medium text-sm">{t("company")}</p>
                    <p className="text-xs text-muted-foreground">"{lead.companyTitle}" kompaniyasi yaratish</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-[var(--ep-green)]/90"
                onClick={() => convertLeadMutation.mutate()}
                disabled={convertLeadMutation.isPending || (!convertOptions.createDeal && !convertOptions.createContact && !convertOptions.createCompany)}
                data-testid="button-confirm-convert"
              >
                {convertLeadMutation.isPending ? "Bajarilmoqda..." : "Konvertatsiya qilish"}
              </Button>
              <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
