/**
 * @module OrgCards
 * @description Canonical ORG CARD (org_functions) management page — list + create/edit/soft-delete.
 *   Consumes /api/org-structure/cards. Extends the OrgStructure area (card-centric, EP-ORG-001/004/005).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, LayoutGrid } from "lucide-react";
import type { EPStatusTone } from "@/components/ep";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EPPageHeader, EPLoader, EPErrorState, EPEmptyState, EPStatusPill } from "@/components/ep";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { CardFormDialog, type OrgCard } from "@/components/hr/org/CardFormDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

const CARDS_KEY = "/api/org-structure/cards";

const STATUS_LABEL: Record<string, string> = {
  active: "faol", vacant: "vakansiya", io: "ijrochi", frozen: "muzlatilgan", archived: "arxiv",
};

const STATUS_TONE: Record<string, EPStatusTone> = {
  active: "success", vacant: "warning", io: "info", frozen: "neutral", archived: "danger",
};

export default function OrgCards() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrgCard | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ items: OrgCard[]; total: number }>({
    queryKey: [CARDS_KEY],
  });
  const cards = Array.isArray(data?.items) ? data!.items : [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `${CARDS_KEY}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARDS_KEY] });
      toast({ title: t("kartaArxivlandi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (card: OrgCard) => { setEditing(card); setFormOpen(true); };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <EPPageHeader
        breadcrumb={<>{t("orgStructure")}<b> · {t("kartalar")}</b></>}
        title={t("kartalar")}
        subtitle={t("kartalarPageSubtitle")}
        actions={
          <Button onClick={openCreate} data-testid="button-card-create">
            <Plus className="h-4 w-4 mr-2" />{t("yangiKarta")}
          </Button>
        }
      />

      {isLoading ? (
        <EPLoader />
      ) : isError ? (
        <EPErrorState onRetry={() => refetch()} />
      ) : cards.length === 0 ? (
        <EPEmptyState icon={LayoutGrid} title={t("kartalarYoq")} description={t("kartalarYoqMatn")} />
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("lavozimNomi")}</TableHead>
                <TableHead>{t("kartaKodi")}</TableHead>
                <TableHead>{t("bolim")}</TableHead>
                <TableHead>{t("daraja")}</TableHead>
                <TableHead>{t("oylikTuri")}</TableHead>
                <TableHead>{t("holati")}</TableHead>
                <TableHead className="text-right">{t("amallar")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((c) => (
                <TableRow key={c.id} data-testid={`row-card-${c.id}`}>
                  <TableCell className="font-medium">{c.position_name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.code ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {(c as OrgCard & { department_name?: string }).department_name ?? "—"}
                  </TableCell>
                  <TableCell>{c.level ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.salary_type ?? "—"}</TableCell>
                  <TableCell>
                    <EPStatusPill tone={STATUS_TONE[c.status ?? "active"] ?? "neutral"}>
                      {t(STATUS_LABEL[c.status ?? "active"] ?? "faol")}
                    </EPStatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)} data-testid={`button-card-edit-${c.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteConfirmDialog
                        title={t("kartaniArxivlash")}
                        description={t("kartaniArxivlashMatn")}
                        isPending={deleteMutation.isPending}
                        onConfirm={() => deleteMutation.mutate(c.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CardFormDialog open={formOpen} onClose={() => setFormOpen(false)} card={editing} />
    </div>
  );
}
