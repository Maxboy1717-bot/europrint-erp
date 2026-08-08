/**
 * @module RazryadLevelsPanel
 * @description Razryad (grade) catalog — list + create/edit/archive. Rendered as the "Razryadlar" TAB
 *   inside Org Tuzilma (org-structure/hierarchy), NOT a standalone sidebar page (owner 2026-06-17).
 *   Consumes /api/org-structure/razryad-levels. Folded from the former pages/RazryadLevels.tsx.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EPLoader, EPErrorState, EPEmptyState } from "@/components/ep";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { RazryadFormDialog, type RazryadLevel } from "@/components/hr/org/RazryadFormDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

const RAZRYAD_KEY = "/api/org-structure/razryad-levels";

const fmtSalary = (v: unknown): string => {
  const n = Number(v);
  return v != null && Number.isFinite(n) ? n.toLocaleString("ru-RU") : "—";
};

export function RazryadLevelsPanel() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RazryadLevel | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ items: RazryadLevel[]; total: number }>({
    queryKey: [RAZRYAD_KEY],
  });
  const levels = Array.isArray(data?.items) ? data!.items : [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `${RAZRYAD_KEY}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RAZRYAD_KEY] });
      toast({ title: t("razryadArxivlandi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (r: RazryadLevel) => { setEditing(r); setFormOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold">{t("razryadlar")}</h2>
          <p className="text-[13px] text-muted-foreground">{t("razryadlarPageSubtitle")}</p>
        </div>
        <Button onClick={openCreate} data-testid="button-razryad-create">
          <Plus className="h-4 w-4 mr-2" />{t("yangiRazryad")}
        </Button>
      </div>

      {isLoading ? (
        <EPLoader />
      ) : isError ? (
        <EPErrorState onRetry={() => refetch()} />
      ) : levels.length === 0 ? (
        <EPEmptyState icon={Layers} title={t("razryadlarYoq")} description={t("razryadlarYoqMatn")} />
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("razryadDarajasiRaqam")}</TableHead>
                <TableHead>{t("nomi")}</TableHead>
                <TableHead className="text-center">{t("koeffitsiyent", "Koeff.")}</TableHead>
                <TableHead>{t("minOylik")}</TableHead>
                <TableHead>{t("maxOylik")}</TableHead>
                <TableHead>{t("imtihonTuri")}</TableHead>
                <TableHead className="text-right">{t("amallar")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((r) => (
                <TableRow key={r.id} data-testid={`row-razryad-${r.id}`}>
                  <TableCell className="font-medium">{r.level}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-center font-mono tabular-nums">{r.coefficient != null ? `×${Number(r.coefficient)}` : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtSalary(r.salary_min)}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtSalary(r.salary_max)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.exam_type ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)} data-testid={`button-razryad-edit-${r.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteConfirmDialog
                        title={t("razryadniArxivlash")}
                        description={t("razryadniArxivlashMatn")}
                        isPending={deleteMutation.isPending}
                        onConfirm={() => deleteMutation.mutate(r.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RazryadFormDialog open={formOpen} onClose={() => setFormOpen(false)} razryad={editing} />
    </div>
  );
}
