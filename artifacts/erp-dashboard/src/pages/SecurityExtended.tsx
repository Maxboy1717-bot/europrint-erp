/**
 * @module SecurityExtended
 * @description React page component. Route-level UI — state management, hooks, and orchestration only.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray, selectArray } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Plus, RefreshCw } from "lucide-react";

import {
  URL_TAB_MAP,
  tabMeta,
  VisitorSchema,
  type VisitorFormValues,
  type SecurityVisitor,
  type AttendanceRecord,
  type DailySummary,
  type PPEViolationsResponse,
} from "./SecurityExtendedTypes";
import { VisitorDialog } from "./SecurityExtendedDialogs";
import {
  ZoneAccessSection,
  VisitorsSection,
  AttendanceSection,
  PPEMonitoring,
  HazmatSection,
  EvacuationSection,
  RatingSection,
} from "./SecurityExtendedSections";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function SecurityExtended() {
  const { t } = useTranslation("common");
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "zones");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const { toast } = useToast();
  const [showVisitorDialog, setShowVisitorDialog] = useState(false);

  const visitorForm = useForm<VisitorFormValues>({
    resolver: zodResolver(VisitorSchema),
    defaultValues: { name: "", company: "", host: "", purpose: "", phone: "" },
  });

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: visitors = [],
    isLoading: visitorsLoading,
    refetch: refetchVisitors,
  } = useQuery<SecurityVisitor[]>({
    queryKey: ["/api/security/visitors"],
    select: selectArray<SecurityVisitor>,
  });

  const { data: attendanceRecords = [], isLoading: attendanceLoading } =
    useQuery<AttendanceRecord[]>({
      queryKey: ["/api/security/attendance-records"],
      select: selectArray<AttendanceRecord>,
    });

  const { data: dailySummary } = useQuery<DailySummary>({
    queryKey: ["/api/security/daily-summary"],
  });

  const { data: violationsData } = useQuery<PPEViolationsResponse>({
    queryKey: ["/api/security/ppe-violations"],
  });
  const violations = safeArray<Record<string, unknown>>(violationsData?.violations);

  // ── Mutations ────────────────────────────────────────────────────────────

  const registerVisitor = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/security/visitors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/visitors"] });
      setShowVisitorDialog(false);
      visitorForm.reset();
      toast({ title: "Mehmon ro'yxatdan o'tkazildi" });
    },
  });

  // ── Derived state ─────────────────────────────────────────────────────────

  const activeVisitors = (Array.isArray(visitors) ? visitors : []).filter(
    (v: SecurityVisitor) => !v.exitTime,
  );

  const presentToday = Array.isArray(attendanceRecords)
    ? attendanceRecords.filter((r: AttendanceRecord) => r.status === "present").length
    : (dailySummary?.present ?? 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Page header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("securityKengaytirilgan")}</b></>}
        title={t("securityKengaytirilgan")}
      />
          {activeVisitors.length > 0 && (
            <Badge className="ml-2 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none">
              {activeVisitors.length} mehmon ichkarida
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="border-b border-border px-4 bg-muted/40">
          <TabsList className="bg-transparent h-12 gap-4 flex w-full overflow-x-auto">
            {Object.entries(tabMeta).map(([key, meta]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 shrink-0 whitespace-nowrap text-muted-foreground font-medium transition-all"
              >
                <meta.icon className="h-4 w-4 mr-2" />
                {meta.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-background">
          <TabsContent value="zones" className="mt-0 space-y-6 outline-none">
            <ZoneAccessSection
              dailySummary={dailySummary}
              attendanceRecords={attendanceRecords}
              presentToday={presentToday}
              activeVisitorsCount={activeVisitors.length}
            />
          </TabsContent>

          <TabsContent value="visitors" className="mt-0 space-y-6 outline-none">
            <VisitorsSection
              visitors={visitors}
              visitorsLoading={visitorsLoading}
              activeVisitors={activeVisitors}
              onRefetch={() => refetchVisitors()}
              onAddVisitor={() => setShowVisitorDialog(true)}
            />
            <VisitorDialog
              open={showVisitorDialog}
              onOpenChange={setShowVisitorDialog}
              form={visitorForm}
              onSubmit={d => registerVisitor.mutate(d)}
              isPending={registerVisitor.isPending}
            />
          </TabsContent>

          <TabsContent value="attendance" className="mt-0 space-y-6 outline-none">
            <AttendanceSection
              attendanceRecords={attendanceRecords}
              attendanceLoading={attendanceLoading}
              dailySummary={dailySummary}
            />
          </TabsContent>

          <TabsContent value="ppe" className="mt-0 outline-none">
            <PPEMonitoring />
          </TabsContent>

          <TabsContent value="hazmat" className="mt-0 space-y-4">
            <HazmatSection />
          </TabsContent>

          <TabsContent value="evacuation" className="mt-0 space-y-4">
            <EvacuationSection />
          </TabsContent>

          <TabsContent value="rating" className="mt-0 space-y-4">
            <RatingSection violationsCount={violations.length} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
