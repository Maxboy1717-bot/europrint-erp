/**
 * @module HROnboarding
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, CheckCircle2, Plus, Users, Clock, TrendingUp, FolderOpen, FileText, Video, ClipboardList, Map, Eye } from "lucide-react";
import { OnboardingRoadmapDialog } from "@/components/hr/OnboardingRoadmapDialog";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
interface ChecklistItem {
  id: string;
  userId: number;
  fullName?: string;
  type: "onboarding" | "offboarding";
  completedItems?: number;
  totalItems?: number;
  status?: string;
}

interface Employee {
  id: number | string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  positionName?: string;
  position?: string;
  hireDate?: string;
  createdAt?: string;
  departmentName?: string;
  department?: string;
}

interface FolderItem {
  id: number;
  nodeId: number;
  nodeName?: string;
  itemType: "document" | "video" | "test";
  title: string;
  url?: string;
  createdAt: string;
}

function EmployeeFolderItems({ employee }: { employee: Employee }) {
  const { t } = useTranslation("common");
  const { data: folderItems = [], isLoading } = useQuery<FolderItem[]>({
    queryKey: [`/api/org-structure/employees/${employee.id}/folder`],
    enabled: !!employee.id,
  });

  const ITEM_CONFIG = {
    document: { icon: <FileText className="h-3.5 w-3.5" />, label: "Hujjat", color: "#1d4ed8" },
    video: { icon: <Video className="h-3.5 w-3.5" />, label: "Video", color: "#7c3aed" },
    test: { icon: <ClipboardList className="h-3.5 w-3.5" />, label: "Test", color: "#16a34a" },
  } as const;

  const empName = employee.fullName || `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.name || `#${employee.id}`;

  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center gap-2 mb-2">
        <FolderOpen className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{empName}</span>
        <span className="text-xs text-muted-foreground">— {employee.positionName || employee.position || "Lavozim ko'rsatilmagan"}</span>
        {isLoading && <span className="text-xs text-muted-foreground">{t("Yuklanmoqda...")}</span>}
      </div>
      {!isLoading && folderItems.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-6">{t("papkaBoshLavozimUchunMaterial")}</p>
      ) : (
        <div className="flex flex-wrap gap-2 pl-6">
          {(folderItems as FolderItem[]).map((item) => {
            const config = ITEM_CONFIG[item.itemType] || ITEM_CONFIG.document;
            return (
              <div
                key={item.id}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border"
                style={{ borderColor: `${config.color}40`, color: config.color, background: `${config.color}10` }}
                data-testid={`onboarding-folder-item-${item.id}`}
              >
                {config.icon}
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {item.title}
                  </a>
                ) : (
                  <span>{item.title}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface OnboardingRoadmap {
  id: number;
  pipeline_entry_id: number | null;
  employee_id: number | null;
  nastavnik_id: number | null;
  nastavnik_name?: string | null;
  kirish_sanasi: string | null;
  roadmap_data: {
    lavozim_nomi?: string;
    bolim?: string;
    sinov_muddat_oy?: number;
    nastavnik_name?: string;
  };
  candidate_name?: string | null;
  vacancy_title?: string | null;
  funnel_stage?: string | null;
  created_at: string;
}

export default function HROnboarding() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ userId: "", fullName: "", positionName: "", type: "" });
  const [viewRoadmapEntry, setViewRoadmapEntry] = useState<{ id: number; name: string; vacancyTitle?: string } | null>(null);

  const { data: checklists = [], isLoading: checkLoading } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/hr/onboarding-checklists"],
  });

  const { data: roadmapsRaw } = useQuery({
    queryKey: ["/api/hr/recruitment/roadmaps"],
  });
  const roadmaps: OnboardingRoadmap[] = Array.isArray((roadmapsRaw as { data?: OnboardingRoadmap[] })?.data)
    ? ((roadmapsRaw as { data: OnboardingRoadmap[] }).data)
    : [];

  const { data: employeesRaw } = useQuery({
    queryKey: ["/api/hr/employees"],
  });
  const employees: Employee[] = Array.isArray(employeesRaw)
    ? employeesRaw
    : ((employeesRaw as { data?: Employee[] })?.data || []);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const newEmployees = (Array.isArray(employees) ? employees : []).filter((e) => {
    const d = e.hireDate || e.createdAt;
    return d ? new Date(d) >= ninetyDaysAgo : false;
  });

  const onboardingChecklists = (Array.isArray(checklists) ? checklists : []).filter((c) => c.type === "onboarding");

  const updateChecklist = useMutation({
    mutationFn: ({ id, completedItems }: { id: string; completedItems: number }) =>
      apiRequest("PATCH", `/api/hr/onboarding-checklists/${id}`, { completedItems }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding-checklists"] });
      toast({ title: "Checklist yangilandi" });
    },
  });

  const createChecklist = useMutation({
    mutationFn: (data: { userId: string; fullName: string; positionName: string; type: string }) =>
      apiRequest("POST", "/api/hr/onboarding-checklists", { ...data, type: "onboarding" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding-checklists"] });
      toast({ title: "Onboarding boshlandi" });
      setShowDialog(false);
      setForm({ userId: "", fullName: "", positionName: "", type: "" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">{t("hrOnboarding")}</h1>
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)} data-testid="button-add-onboarding">
          <Plus className="h-3.5 w-3.5 mr-1.5" />{t("onboardingBoshlash")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { label: "Faol onboarding", value: newEmployees.length, color: "text-[var(--ep-blue)]", icon: UserPlus },
            { label: "Checklists", value: onboardingChecklists.length, color: "text-[var(--ep-green)]", icon: CheckCircle2 },
            { label: "O'rtacha muddat", value: "30 kun", color: "text-[var(--ep-primary)]", icon: Clock },
            { label: "Yangi xodimlar (90 kun)", value: newEmployees.length, color: "text-primary", icon: Users },
          ]).map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex items-start justify-between">
                <div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
                <s.icon className={`h-5 w-5 ${s.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New employees table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yangi Xodimlar (Onboarding Jarayonida)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>{t("xodim1")}</TableHead>
                  <TableHead>{t("lavozim1")}</TableHead>
                  <TableHead>{t("ishgaKirishSanasi")}</TableHead>
                  <TableHead>{t("bolim1")}</TableHead>
                  <TableHead>{t("holati")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                      {t("songgi90KundaYangiXodim")}
                    </TableCell>
                  </TableRow>
                ) : (Array.isArray(newEmployees) ? newEmployees : []).slice(0, 20).map((emp) => (
                  <TableRow key={emp.id} data-testid={`row-onboarding-${emp.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      {emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.name || `#${emp.id}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{emp.positionName || emp.position || "—"}</TableCell>
                    <TableCell>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell>{emp.departmentName || emp.department || "—"}</TableCell>
                    <TableCell><EPStatusPill tone="neutral">{t("onboarding")}</EPStatusPill></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>

        {/* Position folder onboarding section */}
        <Card data-testid="section-lavozim-papkasi">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              {t("lavozimPapkasiOnboardingMateriallari")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("yangiXodimlargaTayinlanganLavozimPapkasidagi")}
            </p>
            {newEmployees.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("songgi90KundaYangiXodim1")}
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(newEmployees) ? newEmployees : []).slice(0, 5).map((emp) => (
                  <EmployeeFolderItems key={emp.id} employee={emp} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Roadmaps List */}
        <Card data-testid="section-onboarding-roadmaps">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="h-4 w-4 text-[var(--ep-green)]" />
              Yo'l Xaritalari (Material №58)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {roadmaps.length === 0 ? (
              <div className="px-6 pb-6 pt-2 text-sm text-muted-foreground text-center py-8">
                {t("hozirchaYolXaritasiYaratilmaganRekrutment")}
              </div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>{t("nomzod")}</TableHead>
                    <TableHead>{t("lavozim1")}</TableHead>
                    <TableHead>{t("bolinma")}</TableHead>
                    <TableHead>{t("nastavnik")}</TableHead>
                    <TableHead>{t("kirishSanasi2")}</TableHead>
                    <TableHead>{t("sinovMuddati")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(roadmaps) ? roadmaps : []).map((rm) => (
                    <TableRow key={rm.id} data-testid={`row-roadmap-${rm.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{rm.candidate_name || `#${rm.employee_id || rm.id}`}</TableCell>
                      <TableCell className="text-muted-foreground">{rm.roadmap_data?.lavozim_nomi || rm.vacancy_title || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{rm.roadmap_data?.bolim || "—"}</TableCell>
                      <TableCell>{rm.roadmap_data?.nastavnik_name || rm.nastavnik_name || "—"}</TableCell>
                      <TableCell>
                        {rm.kirish_sanasi ? new Date(rm.kirish_sanasi).toLocaleDateString("uz-UZ") : "—"}
                      </TableCell>
                      <TableCell>
                        {rm.roadmap_data?.sinov_muddat_oy ? (
                          <EPStatusPill tone="neutral">{rm.roadmap_data.sinov_muddat_oy} oy</EPStatusPill>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-[var(--ep-green)]"
                          onClick={() => setViewRoadmapEntry({
                            id: rm.pipeline_entry_id ?? 0,
                            name: rm.candidate_name || `#${rm.id}`,
                            vacancyTitle: rm.vacancy_title ?? rm.roadmap_data?.lavozim_nomi,
                          })}
                          data-testid={`button-view-roadmap-${rm.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t("view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>

        {/* Checklist progress */}
        {onboardingChecklists.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t("onboardingChecklistHolati")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="ep-table-scroll"><Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>{t("xodim1")}</TableHead>
                    <TableHead>{t("progress5")}</TableHead>
                    <TableHead>{t('progress3')}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell>
                    </TableRow>
                  ) : (Array.isArray(onboardingChecklists) ? onboardingChecklists : []).map((item) => {
                    const completed = item.completedItems ?? 0;
                    const total = item.totalItems ?? 12;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <TableRow key={item.id} data-testid={`row-onboarding-checklist-${item.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{item.fullName || `Xodim #${item.userId}`}</TableCell>
                        <TableCell className="text-sm">{completed}/{total} modda</TableCell>
                        <TableCell className="w-48">
                          <div className="space-y-1">
                            <div className="h-2 bg-muted rounded">
                              <div className="h-2 rounded bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateChecklist.mutate({ id: item.id, completedItems: Math.min(total, completed + 1) })}
                            disabled={completed >= total || updateChecklist.isPending}
                            data-testid={`button-onboarding-inc-${item.id}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />+1
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiOnboardingBoshlash")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t("xodimId")}</Label>
              <Input
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                placeholder={t("xodimIdRaqami1")}
                type="number"
              />
            </div>
            <div>
              <Label>{t("xodimIsmi")}</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder={t("toliqIsmi")}
              />
            </div>
            <div>
              <Label>{t("lavozimi")}</Label>
              <Input
                value={form.positionName}
                onChange={(e) => setForm((f) => ({ ...f, positionName: e.target.value }))}
                placeholder={t("lavozimNomi1")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => createChecklist.mutate(form)}
              disabled={!form.userId || !form.fullName || createChecklist.isPending}
            >
              {createChecklist.isPending ? "Saqlanmoqda..." : "Boshlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yo'l xaritasini ko'rish dialogi */}
      {viewRoadmapEntry && (
        <OnboardingRoadmapDialog
          open={!!viewRoadmapEntry}
          onClose={() => setViewRoadmapEntry(null)}
          pipelineEntryId={viewRoadmapEntry.id}
          candidateName={viewRoadmapEntry.name}
          vacancyTitle={viewRoadmapEntry.vacancyTitle}
        />
      )}
    </div>
  );
}
