/** @module MESExtended @description Route-level page component for MES (Manufacturing Execution System). Owns state, queries, mutations, KPI bar, and tab routing. */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, Wrench, Trophy, Cpu, RefreshCw, Clock } from "lucide-react";
import { PillTabs } from "@/components/ui/pill-tabs";

import {
  URL_TAB_MAP,
  MES_PILLS,
  MaintSchema,
  type MaintFormValues,
  type MESMachine,
  type MESShift,
  type MESTask,
  type MaintenanceRequest,
  type DowntimeReason,
  type MESLeaderboard,
  type SosEvent,
  type SosFormValues,
} from "./MESExtendedTypes";
import { MaintenanceDialog } from "./MESExtendedDialogs";
import { OeeTab, ReasonsTab } from "./MESExtendedTabsA";
import { ZonesTab, MaintenanceTab } from "./MESExtendedTabsB";
import { GamificationTab } from "./MESExtendedTabsD";
import { NormsTab, SmenaTab } from "./MESExtendedTabsC";
import { SosTab } from "./MESExtendedTabsSos";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Page Component ───────────────────────────────────────────────────────────

export default function MESExtended() {
  const { t } = useTranslation("common");
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "oee");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const { toast } = useToast();
  const [showMaintDialog, setShowMaintDialog] = useState(false);

  const maintForm = useForm<MaintFormValues>({
    resolver: zodResolver(MaintSchema),
    defaultValues: { title: "", work_center_id: undefined, priority: "medium" },
  });

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: oeeData, isLoading: oeeLoading, refetch: refetchOee } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/mes/oee"],
  });

  const { data: maintenanceRequests = [], isLoading: maintLoading, refetch: refetchMaint } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/mes/maintenance-requests"],
    select: selectArray<MaintenanceRequest>,
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery<MESLeaderboard[]>({
    queryKey: ["/api/mes/gamification/leaderboard"],
    select: selectArray<MESLeaderboard>,
  });

  const { data: mesStats } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/mes/stats"],
  });

  const { data: downtimeReasons = [] } = useQuery<DowntimeReason[]>({
    queryKey: ["/api/mes/downtime-reasons"],
    select: selectArray,
  });

  const { data: currentShift } = useQuery<MESShift>({
    queryKey: ["/api/mes/shifts/current"],
  });

  const { data: mesTasks = [], isLoading: tasksLoading } = useQuery<MESTask[]>({
    queryKey: ["/api/mes/tasks"],
    select: selectArray<MESTask>,
  });

  const { data: sosHistory = [], isLoading: sosLoading } = useQuery<SosEvent[]>({
    queryKey: ["/api/mes/sos/history"],
    select: selectArray<SosEvent>,
  });

  const { data: sosWorkCenters = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/pp/work-centers"],
    select: (raw: unknown): Array<{ id: string; name: string }> => {
      const items = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
      return items.map(item => ({ id: String(item.id ?? ""), name: String(item.name ?? "") }));
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMaint = useMutation({
    mutationFn: (data: MaintFormValues) =>
      apiRequest("POST", "/api/mes/maintenance-requests", data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mes/maintenance-requests"] });
      setShowMaintDialog(false);
      maintForm.reset();
      toast({ title: "Texnik xizmat so'rovi yuborildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createShiftHandover = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/mes/shifts/handover", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mes/shifts/current"] });
      toast({ title: "Smena o'tkazildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createSos = useMutation({
    mutationFn: (data: SosFormValues) =>
      apiRequest("POST", "/api/mes/sos", data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mes/sos/history"] });
      toast({ title: "SOS signali yuborildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // ─── Derived stats ─────────────────────────────────────────────────────────

  const machines: MESMachine[] = Array.isArray(oeeData?.machines) ? (oeeData.machines as MESMachine[]) : [];
  const avgOee = machines.length > 0
    ? Math.round(machines.reduce((s, m) => s + Number(m.oee || 0), 0) / machines.length)
    : (oeeData?.averageOee || 0);
  const worldClass = machines.filter(m => Number(m.oee || 0) >= 85).length;

  const kpiItems = [
    { label: "O'rtacha OEE",      value: `${avgOee || (mesStats?.avgOee as number) || 0}%`,    desc: "Uskunalar samaradorligi", Icon: Activity, accent: "text-[var(--ep-blue)]"   },
    { label: "World Class (≥85%)", value: worldClass || (mesStats?.worldClassCount as number) || 0, desc: "Stanoq",               Icon: Trophy,   accent: "text-[var(--ep-green)]"  },
    { label: "Ta'mirlashda",       value: machines.filter(m => m.status?.includes("Ta'mir") || m.status === "maintenance").length, desc: "Hozir nosoz", Icon: Wrench, accent: "text-[var(--ep-red)]"    },
    { label: "Jami Stanoqlar",     value: machines.length,                                       desc: "Monitoring ostida",      Icon: Cpu,      accent: "text-[var(--ep-purple)]" },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("mesSexBoshqaruvi")}</b></>}
        title={t("mesSexBoshqaruvi")}
        subtitle="OEE monitoring, smena boshqaruvi, texnik xizmat"
      >
        {currentShift && (
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {currentShift.shiftName || "Aktiv smena"}
          </Badge>
        )}
        <Button variant="outline" size="sm" onClick={() => refetchOee()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </EPPageHeader>

      {/* KPI bar */}
      <div
        className="rounded-xl bg-card dark:bg-slate-900 overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 md:divide-y-0 divide-x-0 md:divide-x dark:divide-slate-800">
          {kpiItems.map((item, i) => (
            <div key={`kpi-${i}`} className="p-6" data-testid={`kpi-mes-${i}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground dark:text-muted-foreground leading-none mb-4">
                {item.label}
              </p>
              <p className="text-4xl font-extrabold text-foreground dark:text-slate-50 leading-none tracking-tight mb-2">
                {item.value}
              </p>
              <div className="flex items-center gap-2">
                <item.Icon className={`w-3.5 h-3.5 ${item.accent}`} />
                <span className="text-xs text-muted-foreground dark:text-muted-foreground">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PillTabs tabs={MES_PILLS} active={activeTab} onChange={setActiveTab} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div>
          <OeeTab          machines={machines}            isLoading={oeeLoading}   />
          <ReasonsTab      downtimeReasons={downtimeReasons as DowntimeReason[]}   />
          <ZonesTab        mesTasks={mesTasks}             isLoading={tasksLoading} />
          <MaintenanceTab
            maintenanceRequests={maintenanceRequests}
            isLoading={maintLoading}
            onRefetch={refetchMaint}
            onOpenDialog={() => setShowMaintDialog(true)}
          />
          <GamificationTab leaderboard={leaderboard}      isLoading={lbLoading}    />
          <NormsTab />
          <SmenaTab
            currentShift={currentShift}
            onHandoverToast={() =>
              toast({ title: "Smena o'tkazish boshlandi", description: "Yangi operator ma'lumotlarini kiriting" })
            }
            onConfirmHandover={(incomingId, notes, issues) =>
              createShiftHandover.mutate({
                outgoing_supervisor: currentShift?.operator_id ?? currentShift?.operatorId ?? 0,
                incoming_supervisor: incomingId,
                notes,
                issues,
              })
            }
          />
          <SosTab
            sosHistory={sosHistory}
            isLoading={sosLoading}
            workCenters={sosWorkCenters}
            onSubmit={data => createSos.mutate(data)}
            isPending={createSos.isPending}
          />
        </div>
      </Tabs>

      <MaintenanceDialog
        open={showMaintDialog}
        onOpenChange={setShowMaintDialog}
        form={maintForm}
        machines={machines}
        isPending={createMaint.isPending}
        onSubmit={data => createMaint.mutate(data)}
      />
    </div>
  );
}
