/**
 * @module HRSafety
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert, Plus, FileText } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  IncidentSchema, PpeSchema, TrainingSchema, ZoneSchema,
  type IncidentData, type PpeData, type TrainingData, type ZoneData,
  type SafetyIncident, type SafetySummary, type PpeRecord,
  type SafetyTraining, type HazardZone, type SubTab,
} from "./HRSafetyTypes";
import { IncidentDialog, PpeDialog, TrainingDialog, ZoneDialog } from "./HRSafetyDialogs";
import { SafetySummaryCards, IncidentsSection, PpeSection, TrainingsSection, ZonesSection } from "./HRSafetySections";
import { useTranslation } from '@/lib/i18n';

export default function HRSafety() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<SubTab>("incidents");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showIncident, setShowIncident] = useState(false);
  const [showPpe, setShowPpe] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showZone, setShowZone] = useState(false);

  const incidentForm = useForm<IncidentData>({
    resolver: zodResolver(IncidentSchema),
    defaultValues: { userId: "", incidentType: "injury", severity: "minor", description: "", incidentDate: "", location: "" },
  });
  const ppeForm = useForm<PpeData>({
    resolver: zodResolver(PpeSchema),
    defaultValues: { userId: "", ppeType: "helmet", status: "compliant", issuedDate: "", expiryDate: "" },
  });
  const trainingForm = useForm<TrainingData>({
    resolver: zodResolver(TrainingSchema),
    defaultValues: { userId: "", trainingName: "", trainingType: "safety", scheduledDate: "", expiryDate: "", status: "pending" },
  });
  const zoneForm = useForm<ZoneData>({
    resolver: zodResolver(ZoneSchema),
    defaultValues: { zoneName: "", location: "", hazardType: "", description: "", riskLevel: "medium" },
  });

  const { data: rawIncidents, isLoading: loadingIncidents } = useQuery<SafetyIncident[]>({ queryKey: ["/api/hr/safety/incidents"] });
  const incidents: SafetyIncident[] = Array.isArray(rawIncidents) ? rawIncidents
    : Array.isArray((rawIncidents as { data?: SafetyIncident[] } | undefined)?.data)
      ? (rawIncidents as { data: SafetyIncident[] }).data : [];

  const { data: rawPpe, isLoading: loadingPpe } = useQuery<PpeRecord[]>({ queryKey: ["/api/hr/safety/ppe-compliance"] });
  const ppeRecords: PpeRecord[] = Array.isArray(rawPpe) ? rawPpe
    : Array.isArray((rawPpe as { data?: PpeRecord[] } | undefined)?.data)
      ? (rawPpe as { data: PpeRecord[] }).data : [];

  const { data: rawTrainings, isLoading: loadingTrainings } = useQuery<SafetyTraining[]>({ queryKey: ["/api/hr/safety/trainings"] });
  const trainings: SafetyTraining[] = Array.isArray(rawTrainings) ? rawTrainings
    : Array.isArray((rawTrainings as { data?: SafetyTraining[] } | undefined)?.data)
      ? (rawTrainings as { data: SafetyTraining[] }).data : [];

  const { data: rawZones, isLoading: loadingZones } = useQuery<HazardZone[]>({ queryKey: ["/api/hr/safety/hazard-zones"] });
  const zones: HazardZone[] = Array.isArray(rawZones) ? rawZones
    : Array.isArray((rawZones as { data?: HazardZone[] } | undefined)?.data)
      ? (rawZones as { data: HazardZone[] }).data : [];

  const { data: rawSummary } = useQuery<SafetySummary>({ queryKey: ["/api/hr/safety/summary"] });
  const summary: SafetySummary | undefined = rawSummary && typeof rawSummary === "object" && !Array.isArray(rawSummary)
    ? ((rawSummary as { data?: SafetySummary }).data ?? rawSummary as SafetySummary) : undefined;

  const createIncident = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/incidents", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/summary"] });
      setShowIncident(false); incidentForm.reset();
      toast({ title: "Xavfsizlik hodisasi qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createPpe = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/ppe-compliance", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/ppe-compliance"] });
      setShowPpe(false); ppeForm.reset();
      toast({ title: "PPE yozuvi qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createTraining = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/trainings", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/trainings"] });
      setShowTraining(false); trainingForm.reset();
      toast({ title: "Trening qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createZone = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/hazard-zones", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/hazard-zones"] });
      setShowZone(false); zoneForm.reset();
      toast({ title: "Xavfli zona qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteIncident = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr/safety/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/incidents"] });
      toast({ title: "Hodisa o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">{t("hrXavfsizlikVaSogliqniSaqlash")}</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" data-testid="button-export-safety-pdf"
            onClick={() => apiRequest("GET", "/api/hr/safety/export/pdf")
              .then(r => (r as unknown as Response).blob()).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "safety-report.pdf"; a.click();
                URL.revokeObjectURL(url);
              }).catch(() => toast({ title: "PDF yaratishda xatolik", variant: "destructive" }))}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />{t("pdfHisobot")}
          </Button>
          {subTab === "incidents" && <Button size="sm" onClick={() => setShowIncident(true)} data-testid="button-add-incident"><Plus className="h-3.5 w-3.5 mr-1.5" />{t("hodisaQoshish")}</Button>}
          {subTab === "ppe"       && <Button size="sm" onClick={() => setShowPpe(true)} data-testid="button-add-ppe"><Plus className="h-3.5 w-3.5 mr-1.5" />{t("ppeQoshish")}</Button>}
          {subTab === "trainings" && <Button size="sm" onClick={() => setShowTraining(true)} data-testid="button-add-training"><Plus className="h-3.5 w-3.5 mr-1.5" />{t("treningQoshish")}</Button>}
          {subTab === "zones"     && <Button size="sm" onClick={() => setShowZone(true)} data-testid="button-add-zone"><Plus className="h-3.5 w-3.5 mr-1.5" />{t("zonaQoshish")}</Button>}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <SafetySummaryCards summary={summary} />

        <Tabs value={subTab} onValueChange={(v) => setSubTab(v as SubTab)}>
          <TabsList>
            <TabsTrigger value="incidents">{t("hodisalar")}</TabsTrigger>
            <TabsTrigger value="ppe">PPE</TabsTrigger>
            <TabsTrigger value="trainings">{t("treninglar")}</TabsTrigger>
            <TabsTrigger value="zones">{t("xavfliZonalar")}</TabsTrigger>
          </TabsList>
          <TabsContent value="incidents" className="mt-4">
            <IncidentsSection incidents={incidents} loading={loadingIncidents} onDeleteRequest={setConfirmDeleteId} />
          </TabsContent>
          <TabsContent value="ppe" className="mt-4">
            <PpeSection ppeRecords={ppeRecords} loading={loadingPpe} />
          </TabsContent>
          <TabsContent value="trainings" className="mt-4">
            <TrainingsSection trainings={trainings} loading={loadingTrainings} />
          </TabsContent>
          <TabsContent value="zones" className="mt-4">
            <ZonesSection zones={zones} loading={loadingZones} />
          </TabsContent>
        </Tabs>
      </div>

      <IncidentDialog open={showIncident} onOpenChange={setShowIncident} form={incidentForm} mutation={createIncident} />
      <PpeDialog open={showPpe} onOpenChange={setShowPpe} form={ppeForm} mutation={createPpe} />
      <TrainingDialog open={showTraining} onOpenChange={setShowTraining} form={trainingForm} mutation={createTraining} />
      <ZoneDialog open={showZone} onOpenChange={setShowZone} form={zoneForm} mutation={createZone} />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title={t("hodisaniOchirish")}
        description={t("ushbuXavfsizlikHodisasiniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId !== null) deleteIncident.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
