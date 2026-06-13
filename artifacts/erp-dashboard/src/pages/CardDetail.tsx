/**
 * @module CardDetail
 * @description Card 8-tab detail page (/org-structure/cards/:id). DetailPage pattern + EP tokens.
 *   8 flat tabs (Q-42): Asosiy/Xodimlar/Farzandlar/Vakant/Papka/Statistika/Portret/Tarix.
 *   Each tab = REAL data (its endpoint) or honest EPComingSoon (Portret — node-keyed, no per-card source).
 *   Reuses Phase 1-4 dialogs (CardFormDialog/CardFolderDialog) + queries — no duplication.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Pencil, FolderOpen, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EPPageHeader, EPLoader, EPErrorState, EPEmptyState, EPStatusPill, EPComingSoon } from "@/components/ep";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { CardFormDialog, type OrgCard } from "@/components/hr/org/CardFormDialog";
import { CardFolderDialog } from "@/components/hr/org/CardFolderDialog";
import { CardAssignDialog } from "@/components/hr/org/CardAssignDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

const fmtSom = (v: unknown): string => {
  const n = Number(v ?? 0);
  return (Number.isFinite(n) ? n.toLocaleString("ru-RU") : "0") + " so'm";
};

type Row = Record<string, unknown>;
const listOf = (d: { items?: Row[] } | undefined): Row[] => (Array.isArray(d?.items) ? d!.items : []);

export default function CardDetail() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/org-structure/cards/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id ?? 0);
  const base = `/api/org-structure/cards/${id}`;

  const [editOpen, setEditOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: card, isLoading, isError, refetch } = useQuery<OrgCard & { department_name?: string; tskp?: string | null }>({
    queryKey: [base], enabled: id > 0,
  });
  const employees = useQuery<{ items: Row[] }>({ queryKey: [`${base}/employees`], enabled: id > 0 });
  const children  = useQuery<{ items: Row[] }>({ queryKey: [`${base}/children`], enabled: id > 0 });
  const vacancies = useQuery<{ items: Row[] }>({ queryKey: [`${base}/vacancies`], enabled: id > 0 });
  const history   = useQuery<{ items: Row[] }>({ queryKey: [`${base}/history`], enabled: id > 0 });
  const folder    = useQuery<{ completeness?: number; filledSections?: number }>({ queryKey: [`${base}/folder`], enabled: id > 0 });
  const exams     = useQuery<Row[]>({ queryKey: [`/api/ai-exam/by-card/${id}`], enabled: id > 0 });
  const certs     = useQuery<{ items: Row[] }>({ queryKey: [`${base}/certificates`], enabled: id > 0 });

  const unassignMutation = useMutation({
    mutationFn: (employeeId: number) => apiRequest("DELETE", `${base}/assign/${employeeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${base}/employees`] });
      toast({ title: t("xodimAjratildi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  if (isLoading) return <div className="p-6"><EPLoader /></div>;
  if (isError)  return <div className="p-6"><EPErrorState onRetry={() => refetch()} /></div>;
  if (!card)    return <div className="p-6"><EPEmptyState icon={ArrowLeft} title={t("kartaTopilmadi")} /></div>;

  const examCount = Array.isArray(exams.data) ? exams.data.length : 0;
  const completeness = folder.data?.completeness ?? 0;

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-md border border-border p-3">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="text-[14px] mt-0.5">{value ?? "—"}</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <EPPageHeader
        breadcrumb={<>{t("orgStructure")} · <a className="hover:underline cursor-pointer" onClick={() => navigate("/org-structure/cards")}>{t("kartalar")}</a> · <b>{card.position_name}</b></>}
        title={card.position_name}
        subtitle={`${card.code ?? ""}${card.department_name ? " · " + card.department_name : ""}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/org-structure/cards")}>
              <ArrowLeft className="h-4 w-4 mr-2" />{t("orqaga")}
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />{t("tahrirlash")}
            </Button>
          </>
        }
      />

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
            <Field label={t("holati")} value={<EPStatusPill tone="info">{card.status ?? "active"}</EPStatusPill>} />
            <Field label={t("oylikTuri")} value={card.salary_type} />
            <Field label={t("rbacDaraja")} value={card.rbac_tier} />
            <Field label={t("minOylik")} value={card.min_salary} />
            <Field label={t("maxOylik")} value={card.max_salary} />
            <Field label={t("tskpMaqsad")} value={card.tskp} />
          </div>
        </TabsContent>

        {/* 2. Xodimlar — M:N occupants + FORMULA-A salary + assign/unassign + certificates */}
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
                        {e.is_primary
                          ? <EPStatusPill tone="brand">{t("asosiy")}</EPStatusPill>
                          : <EPStatusPill tone="neutral">{t("qoshimcha")}</EPStatusPill>}
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

          {/* EP-ORG-047 cert-in-card: occupants' certificates + 30-day expiry */}
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
            <EPEmptyState icon={ArrowLeft} title={t("farzandlarYoq")} description={t("farzandlarYoqMatn")} />
          ) : (
            <SimpleTable cols={[t("lavozimNomi"), t("kartaKodi"), t("daraja")]} rows={listOf(children.data).map((c) => [String(c.position_name ?? ""), String(c.code ?? "—"), String(c.level ?? "—")])} />
          )}
        </TabsContent>

        {/* 4. Vakant */}
        <TabsContent value="vakant" className="mt-4">
          {vacancies.isLoading ? <EPLoader /> : listOf(vacancies.data).length === 0 ? (
            <EPEmptyState icon={ArrowLeft} title={t("vakansiyaYoq")} description={t("vakansiyaYoqMatn")} />
          ) : (
            <SimpleTable cols={[t("nomi"), t("holati")]} rows={listOf(vacancies.data).map((v) => [String(v.title ?? ""), String(v.status ?? "")])} />
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
            <Field label={t("razryad")} value={card.razryad_level_id ?? "—"} />
            <Field label={t("farzandlar")} value={listOf(children.data).length} />
            <Field label={t("vakant")} value={listOf(vacancies.data).length} />
          </div>
        </TabsContent>

        {/* 7. Portret — node-keyed (org_departments), no per-card source yet */}
        <TabsContent value="portret" className="mt-4">
          <EPComingSoon title={t("portret")} description={t("portretComingSoon")} />
        </TabsContent>

        {/* 8. Tarix-jurnali */}
        <TabsContent value="tarix" className="mt-4">
          {history.isLoading ? <EPLoader /> : listOf(history.data).length === 0 ? (
            <EPEmptyState icon={ArrowLeft} title={t("tarixYoq")} description={t("tarixYoqMatn")} />
          ) : (
            <SimpleTable cols={[t("amal"), t("kim"), t("sana")]} rows={listOf(history.data).map((h) => [String(h.action ?? ""), String(h.user_full_name ?? "—"), String(h.created_at ?? "")])} />
          )}
        </TabsContent>
      </Tabs>

      <CardFormDialog open={editOpen} onClose={() => setEditOpen(false)} card={card} />
      <CardFolderDialog open={folderOpen} onClose={() => setFolderOpen(false)} card={card} />
      <CardAssignDialog open={assignOpen} onClose={() => setAssignOpen(false)} card={card} />
    </div>
  );
}

function SimpleTable({ cols, rows }: { cols: string[]; rows: string[][] }) {
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>{cols.map((c, i) => <TableHead key={i}>{c}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, ri) => (
            <TableRow key={ri}>{r.map((cell, ci) => <TableCell key={ci} className={ci === 0 ? "font-medium" : "text-muted-foreground"}>{cell}</TableCell>)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
