/**
 * @module CardDetailDialog
 * @description Card 8-tab detail as a DIALOG (Q-42: 8 flat tabs inside a modal). Opened from the
 *   "Kartalar" tab inside Org Tuzilma — the card detail lives INSIDE the Org Tuzilma flow, not a
 *   standalone /org-structure/cards/:id route (owner 2026-06-17). Folded from pages/CardDetail.tsx.
 *   Tabs: Asosiy/Xodimlar/Farzandlar/Vakant/Papka/Statistika/Portret/Tarix — all REAL data.
 *   Portret: Bo'lim 1 = Lavozim ta'rifi (card fields); Bo'lim 2 = Ishlar papkasi (folder 6 sections).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FolderOpen, UserPlus, Trash2, CheckCircle2, Pencil, Inbox, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EPLoader, EPErrorState, EPEmptyState, EPStatusPill } from "@/components/ep";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { CardFormDialog, type OrgCard } from "@/components/hr/org/CardFormDialog";
import { CardFolderDialog } from "@/components/hr/org/CardFolderDialog";
import { CardAssignDialog } from "@/components/hr/org/CardAssignDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

const RAZRYAD_KEY = "/api/org-structure/razryad-levels";

const fmtSom = (v: unknown): string => {
  const n = Number(v ?? 0);
  return (Number.isFinite(n) ? n.toLocaleString("ru-RU") : "0") + " so'm";
};

type Row = Record<string, unknown>;
const listOf = (d: { items?: Row[] } | undefined): Row[] => (Array.isArray(d?.items) ? d!.items : []);

export function CardDetailDialog({
  cardId,
  open,
  onClose,
}: {
  cardId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = Number(cardId ?? 0);
  const base = `/api/org-structure/cards/${id}`;
  const enabled = open && id > 0;

  const [editOpen, setEditOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: razryadData } = useQuery<{ items: { id: number; level: number; name: string }[] }>({
    queryKey: [RAZRYAD_KEY],
    enabled,
  });
  const razryadById = new Map(
    (Array.isArray(razryadData?.items) ? razryadData!.items : []).map((r) => [r.id, r])
  );
  const razryadLabel = (rid: number | null | undefined): string => {
    if (rid == null) return "—";
    const r = razryadById.get(rid);
    return r ? r.name : `#${rid}`;
  };

  const { data: card, isLoading, isError, refetch } = useQuery<OrgCard & {
    department_name?: string;
    tskp?: string | null;
    tskp_target?: number | null;
    tskp_measurement_unit?: string | null;
    function_description?: string | null;
    function_description_ru?: string | null;
    is_stale?: boolean;
    last_reviewed_at?: string | null;
  }>({
    queryKey: [base], enabled,
  });
  const employees = useQuery<{ items: Row[] }>({ queryKey: [`${base}/employees`], enabled });
  const children  = useQuery<{ items: Row[] }>({ queryKey: [`${base}/children`], enabled });
  const vacancies = useQuery<{ items: Row[] }>({ queryKey: [`${base}/vacancies`], enabled });
  const history   = useQuery<{ items: Row[] }>({ queryKey: [`${base}/history`], enabled });
  const folder    = useQuery<{
    completeness?: number;
    filledSections?: number;
    totalSections?: number;
    vazifa?: string | null;
    javobgarlik?: string | null;
    gsd?: string | null;
    reglament?: string | null;
    jarayon?: string | null;
    talim?: string | null;
  }>({ queryKey: [`${base}/folder`], enabled });
  const exams     = useQuery<Row[]>({ queryKey: [`/api/ai-exam/by-card/${id}`], enabled });
  const certs     = useQuery<{ items: Row[] }>({ queryKey: [`${base}/certificates`], enabled });
  // Karta↔xodim moslik (fit) — deterministik skorer (vizyon: "karta baholaydi")
  const fit       = useQuery<{ items: Row[] }>({ queryKey: [`${base}/fit`], enabled });
  const fitByEmployee = new Map(
    listOf(fit.data).map((f) => [Number(f.employee_id), f])
  );
  const fitTone = (s: number): "success" | "brand" | "warning" | "neutral" =>
    s >= 80 ? "success" : s >= 60 ? "brand" : s >= 40 ? "warning" : "neutral";

  // Card-level Portret (org_node_portret, card_id-keyed): editable ЦКП/talablar/razryad/kutilmalar
  const portret = useQuery<{ portret: { portret_data?: Record<string, unknown> } | null }>({
    queryKey: [`${base}/portret`], enabled,
  });
  const [portretForm, setPortretForm] = useState<{
    ckp: string; requirements: string; razryad: string; expectations: string; kpis: string;
  }>({ ckp: "", requirements: "", razryad: "", expectations: "", kpis: "" });

  useEffect(() => {
    const pd = (portret.data?.portret?.portret_data ?? {}) as Record<string, unknown>;
    setPortretForm({
      ckp:          String(pd.ckp ?? ""),
      requirements: String(pd.requirements ?? ""),
      razryad:      String(pd.razryad ?? ""),
      expectations: String(pd.expectations ?? ""),
      kpis:         String(pd.kpis ?? ""),
    });
  }, [portret.data]);

  const portretMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("PUT", `${base}/portret`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${base}/portret`] });
      toast({ title: t("portretSaqlandi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const unassignMutation = useMutation({
    mutationFn: (employeeId: number) => apiRequest("DELETE", `${base}/assign/${employeeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${base}/employees`] });
      toast({ title: t("xodimAjratildi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `${base}/review`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [base] });
      toast({ title: t("kartaKoribChiqildi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const examCount = Array.isArray(exams.data) ? exams.data.length : 0;
  const completeness = folder.data?.completeness ?? 0;

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-md border border-border p-3">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="text-[14px] mt-0.5">{value ?? "—"}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <EPLoader />
        ) : isError ? (
          <EPErrorState onRetry={() => refetch()} />
        ) : !card ? (
          <EPEmptyState icon={Inbox} title={t("kartaTopilmadi")} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold flex items-center gap-2 flex-wrap">
                {card.position_name}
                {card.is_stale ? <EPStatusPill tone="warning">{t("eskirgan")}</EPStatusPill> : null}
              </DialogTitle>
              <p className="text-[13px] text-muted-foreground">
                {`${card.code ?? ""}${card.department_name ? " · " + card.department_name : ""}`}
              </p>
            </DialogHeader>

            <div className="flex items-center justify-end gap-2 -mt-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-2" />{t("koribChiqildi")}
              </Button>
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />{t("tahrirlash")}
              </Button>
            </div>

            <Tabs defaultValue="asosiy">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="asosiy">{t("asosiy")}</TabsTrigger>
                <TabsTrigger value="xodimlar">{t("xodimlar")}</TabsTrigger>
                <TabsTrigger value="farzandlar">{t("farzandlar")}</TabsTrigger>
                <TabsTrigger value="vakant">{t("vakant")}</TabsTrigger>
                <TabsTrigger value="papka">{t("papka")}</TabsTrigger>
                <TabsTrigger value="statistika">{t("statistika")}</TabsTrigger>
                <TabsTrigger value="portret">{t("portret")}</TabsTrigger>
                <TabsTrigger value="tarix">{t("tarixJurnali")}</TabsTrigger>
              </TabsList>

              {/* 1. Asosiy */}
              <TabsContent value="asosiy" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label={t("lavozimNomi")} value={card.position_name} />
                  <Field label={t("kartaKodi")} value={card.code} />
                  <Field label={t("daraja")} value={card.level} />
                  <Field label={t("razryad")} value={razryadLabel(card.razryad_level_id)} />
                  <Field label={t("holati")} value={<EPStatusPill tone="info">{card.status ?? "active"}</EPStatusPill>} />
                  <Field label={t("oylikTuri")} value={card.salary_type} />
                  <Field label={t("rbacDaraja")} value={card.rbac_tier} />
                  <Field label={t("minOylik")} value={card.min_salary} />
                  <Field label={t("maxOylik")} value={card.max_salary} />
                  <Field label={t("tskpMaqsad")} value={card.tskp} />
                </div>
              </TabsContent>

              {/* 2. Xodimlar — M:N occupants + assign/unassign + certificates */}
              <TabsContent value="xodimlar" className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setAssignOpen(true)} data-testid="button-card-assign">
                    <UserPlus className="h-4 w-4 mr-2" />{t("xodimBiriktirish")}
                  </Button>
                </div>
                {employees.isLoading ? <EPLoader /> : listOf(employees.data).length === 0 ? (
                  <EPEmptyState icon={UserPlus} title={t("xodimlarYoq")} />
                ) : (
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("ism")}</TableHead>
                          <TableHead>{t("tur")}</TableHead>
                          <TableHead>{t("moslik", "Moslik")}</TableHead>
                          <TableHead>{t("umumiyOylik")}</TableHead>
                          <TableHead>{t("holati")}</TableHead>
                          <TableHead className="text-right">{t("amallar")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listOf(employees.data).map((e) => (
                          <TableRow key={String(e.id)} data-testid={`row-occupant-${e.id}`}>
                            <TableCell className="font-medium">{String(e.full_name ?? "")}</TableCell>
                            <TableCell>
                              {e.is_acting
                                ? <EPStatusPill tone="warning">{t("io")}</EPStatusPill>
                                : e.is_primary
                                  ? <EPStatusPill tone="brand">{t("asosiy")}</EPStatusPill>
                                  : <EPStatusPill tone="neutral">{t("qoshimcha")}</EPStatusPill>}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const f = fitByEmployee.get(Number(e.id));
                                if (!f) return <span className="text-muted-foreground">—</span>;
                                const s = Number(f.fit_score ?? 0);
                                return (
                                  <EPStatusPill tone={fitTone(s)} title={`biriktirish ${f.assignment_score} · ta'rif ${f.definition_score}`}>
                                    {s}% · {String(f.fit_label ?? "")}
                                  </EPStatusPill>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{fmtSom(e.total_salary)}</TableCell>
                            <TableCell className="text-muted-foreground">{String(e.status ?? "")}</TableCell>
                            <TableCell className="text-right">
                              <DeleteConfirmDialog
                                title={t("xodimAjratish")}
                                description={t("xodimAjratishMatn")}
                                trigger={<Button size="icon" variant="ghost" data-testid={`button-unassign-${e.id}`}><Trash2 className="h-4 w-4" /></Button>}
                                isPending={unassignMutation.isPending}
                                onConfirm={() => unassignMutation.mutate(Number(e.id))}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div>
                  <h3 className="text-[14px] font-semibold mb-2">{t("sertifikatlar")}</h3>
                  {certs.isLoading ? <EPLoader /> : listOf(certs.data).length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">{t("sertifikatYoq")}</p>
                  ) : (
                    <SimpleTable
                      cols={[t("nomi"), t("xodim"), t("amalQilishMuddati"), t("holati")]}
                      rows={listOf(certs.data).map((c) => [
                        String(c.name ?? c.certificate_number ?? ""),
                        String(c.employee_name ?? ""),
                        String(c.expiry_date ?? "—"),
                        c.expiring_soon ? "⚠ " + t("muddatiTugayapti") : t("amalda"),
                      ])}
                    />
                  )}
                </div>
              </TabsContent>

              {/* 3. Farzandlar */}
              <TabsContent value="farzandlar" className="mt-4">
                {children.isLoading ? <EPLoader /> : listOf(children.data).length === 0 ? (
                  <EPEmptyState icon={Inbox} title={t("farzandlarYoq")} description={t("farzandlarYoqMatn")} />
                ) : (
                  <SimpleTable cols={[t("lavozimNomi"), t("kartaKodi"), t("daraja")]} rows={listOf(children.data).map((c) => [String(c.position_name ?? ""), String(c.code ?? "—"), String(c.level ?? "—")])} />
                )}
              </TabsContent>

              {/* 4. Vakant — priority + aging bucket */}
              <TabsContent value="vakant" className="mt-4">
                {vacancies.isLoading ? <EPLoader /> : listOf(vacancies.data).length === 0 ? (
                  <EPEmptyState icon={Inbox} title={t("vakansiyaYoq")} description={t("vakansiyaYoqMatn")} />
                ) : (
                  <SimpleTable
                    cols={[t("nomi"), t("muhimligi"), t("yoshi"), t("holati")]}
                    rows={listOf(vacancies.data).map((v) => [
                      String(v.title ?? ""),
                      String(v.priority ?? "—"),
                      `${String(v.aging_bucket ?? "—")} (${String(v.aging_days ?? 0)} ${t("kun")})`,
                      String(v.status ?? ""),
                    ])}
                  />
                )}
              </TabsContent>

              {/* 5. Papka */}
              <TabsContent value="papka" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px]">{t("toliqlik")}: <b>{completeness}%</b></p>
                  <Button variant="outline" onClick={() => setFolderOpen(true)}>
                    <FolderOpen className="h-4 w-4 mr-2" />{t("tahrirlash")}
                  </Button>
                </div>
                <p className="text-[13px] text-muted-foreground">{t("kartalarPageSubtitle")}</p>
              </TabsContent>

              {/* 6. Statistika */}
              <TabsContent value="statistika" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label={t("toliqlik")} value={`${completeness}%`} />
                  <Field label={t("kartaImtihonlari")} value={examCount} />
                  <Field label={t("xodimlar")} value={listOf(employees.data).length} />
                  <Field label={t("razryad")} value={razryadLabel(card.razryad_level_id)} />
                  <Field label={t("farzandlar")} value={listOf(children.data).length} />
                  <Field label={t("vakant")} value={listOf(vacancies.data).length} />
                  <Field
                    label={t("oxirgiKorik")}
                    value={card.last_reviewed_at
                      ? <span className={card.is_stale ? "text-amber-600" : ""}>{String(card.last_reviewed_at).slice(0, 10)}{card.is_stale ? ` · ${t("eskirgan")}` : ""}</span>
                      : <span className="text-amber-600">{t("hechQachon")} · {t("eskirgan")}</span>}
                  />
                </div>
              </TabsContent>

              {/* 7. Portret — tahrirlanadigan portret + karta tavsifi + ishlar papkasi */}
              <TabsContent value="portret" className="mt-4 space-y-6">
                {/* Bo'lim 0: Tahrirlanadigan Portret (org_node_portret.portret_data) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("portret")}
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => portretMutation.mutate({ ...portretForm })}
                      disabled={portretMutation.isPending || portret.isLoading}
                      data-testid="button-save-portret"
                    >
                      <Save className="h-4 w-4 mr-2" />{t("saqlash")}
                    </Button>
                  </div>
                  {portret.isLoading ? (
                    <EPLoader />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground">{t("tskpMaqsad")}</Label>
                        <Textarea
                          rows={2}
                          value={portretForm.ckp}
                          onChange={(e) => setPortretForm((f) => ({ ...f, ckp: e.target.value }))}
                          data-testid="input-portret-ckp"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground">{t("talablar")}</Label>
                        <Textarea
                          rows={3}
                          value={portretForm.requirements}
                          onChange={(e) => setPortretForm((f) => ({ ...f, requirements: e.target.value }))}
                          data-testid="input-portret-requirements"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground">{t("razryad")}</Label>
                        <Textarea
                          rows={2}
                          value={portretForm.razryad}
                          onChange={(e) => setPortretForm((f) => ({ ...f, razryad: e.target.value }))}
                          data-testid="input-portret-razryad"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground">{t("kpi")}</Label>
                        <Textarea
                          rows={2}
                          value={portretForm.kpis}
                          onChange={(e) => setPortretForm((f) => ({ ...f, kpis: e.target.value }))}
                          data-testid="input-portret-kpis"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground">{t("kutilmalar")}</Label>
                        <Textarea
                          rows={3}
                          value={portretForm.expectations}
                          onChange={(e) => setPortretForm((f) => ({ ...f, expectations: e.target.value }))}
                          data-testid="input-portret-expectations"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bo'lim 1: Lavozim ta'rifi (org_functions ustunlari) */}
                <div>
                  <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t("lavozimTavsifi")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Field
                        label={t("lavozimTavsifiUz")}
                        value={card.function_description
                          ? <span className="whitespace-pre-wrap">{card.function_description}</span>
                          : <span className="text-muted-foreground italic">{t("toldirilmagan")}</span>}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Field
                        label={t("lavozimTavsifiRu")}
                        value={card.function_description_ru
                          ? <span className="whitespace-pre-wrap">{card.function_description_ru}</span>
                          : <span className="text-muted-foreground italic">{t("toldirilmagan")}</span>}
                      />
                    </div>
                    <Field
                      label={t("tskpMaqsad")}
                      value={card.tskp
                        ? <span className="whitespace-pre-wrap">{card.tskp}</span>
                        : <span className="text-muted-foreground italic">{t("toldirilmagan")}</span>}
                    />
                    <Field
                      label={t("tskpMaqsadSon")}
                      value={card.tskp_target != null
                        ? `${card.tskp_target}${card.tskp_measurement_unit ? " " + card.tskp_measurement_unit : ""}`
                        : <span className="text-muted-foreground italic">{t("toldirilmagan")}</span>}
                    />
                    <Field label={t("razryad")} value={card.razryad_level_id != null ? razryadLabel(card.razryad_level_id) : <span className="text-muted-foreground italic">{t("toldirilmagan")}</span>} />
                    <Field label={t("rbacDaraja")} value={card.rbac_tier ?? <span className="text-muted-foreground italic">{t("toldirilmagan")}</span>} />
                  </div>
                </div>

                {/* Bo'lim 2: Ishlar papkasi (card_folders ustunlari) */}
                <div>
                  <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t("ishlarPapkasi")}
                  </h3>
                  {folder.isLoading ? (
                    <EPLoader />
                  ) : (
                    <div className="space-y-3">
                      {(
                        [
                          { key: "vazifa",       label: t("vazifa") },
                          { key: "javobgarlik",  label: t("javobgarlik") },
                          { key: "gsd",          label: t("gsd") },
                          { key: "reglament",    label: t("reglament") },
                          { key: "jarayon",      label: t("jarayon") },
                          { key: "talim",        label: t("talim") },
                        ] as const
                      ).map(({ key, label }) => {
                        const val = folder.data?.[key];
                        return (
                          <div key={key} className="rounded-md border border-border p-3">
                            <p className="text-[12px] text-muted-foreground">{label}</p>
                            {val
                              ? <p className="text-[14px] mt-0.5 whitespace-pre-wrap">{val}</p>
                              : <p className="text-[13px] mt-0.5 text-muted-foreground italic">{t("toldirilmagan")}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 8. Tarix-jurnali */}
              <TabsContent value="tarix" className="mt-4">
                {history.isLoading ? <EPLoader /> : listOf(history.data).length === 0 ? (
                  <EPEmptyState icon={Inbox} title={t("tarixYoq")} description={t("tarixYoqMatn")} />
                ) : (
                  <SimpleTable cols={[t("amal"), t("kim"), t("sana")]} rows={listOf(history.data).map((h) => [String(h.action ?? ""), String(h.user_full_name ?? "—"), String(h.created_at ?? "")])} />
                )}
              </TabsContent>
            </Tabs>

            <CardFormDialog open={editOpen} onClose={() => setEditOpen(false)} card={card} />
            <CardFolderDialog open={folderOpen} onClose={() => setFolderOpen(false)} card={card} />
            <CardAssignDialog open={assignOpen} onClose={() => setAssignOpen(false)} card={card} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SimpleTable({ cols, rows }: { cols: string[]; rows: string[][] }) {
  const safeCols = Array.isArray(cols) ? cols : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>{safeCols.map((c, i) => <TableHead key={i}>{c}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {safeRows.map((r, ri) => (
            <TableRow key={ri}>{(Array.isArray(r) ? r : []).map((cell, ci) => <TableCell key={ci} className={ci === 0 ? "font-medium" : "text-muted-foreground"}>{cell}</TableCell>)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
