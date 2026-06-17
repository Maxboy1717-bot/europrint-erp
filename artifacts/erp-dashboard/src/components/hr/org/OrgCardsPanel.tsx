/**
 * @module OrgCardsPanel
 * @description Canonical ORG CARD (org_functions) list — rendered as the "Kartalar" TAB inside Org
 *   Tuzilma (org-structure/hierarchy), NOT a standalone sidebar page (owner 2026-06-17). Each card shows
 *   its RAZRYAD as a badge (sourced from razryad_level_id → razryad_levels). Card detail + razryad
 *   assignment open as dialogs INSIDE this flow. Folded from the former pages/OrgCards.tsx.
 *   Consumes /api/org-structure/cards + /api/org-structure/razryad-levels.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, LayoutGrid, FolderOpen, GraduationCap, Eye } from "lucide-react";
import type { EPStatusTone } from "@/components/ep";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EPLoader, EPErrorState, EPEmptyState, EPStatusPill } from "@/components/ep";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { CardFormDialog, type OrgCard } from "@/components/hr/org/CardFormDialog";
import { CardFolderDialog } from "@/components/hr/org/CardFolderDialog";
import { CardExamsDialog } from "@/components/hr/org/CardExamsDialog";
import { CardDetailDialog } from "@/components/hr/org/CardDetailDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

const CARDS_KEY = "/api/org-structure/cards";
const RAZRYAD_KEY = "/api/org-structure/razryad-levels";

const STATUS_LABEL: Record<string, string> = {
  active: "faol", vacant: "vakansiya", io: "ijrochi", frozen: "muzlatilgan", archived: "arxiv",
};

const STATUS_TONE: Record<string, EPStatusTone> = {
  active: "success", vacant: "warning", io: "info", frozen: "neutral", archived: "danger",
};

export function OrgCardsPanel() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrgCard | null>(null);
  const [folderCard, setFolderCard] = useState<OrgCard | null>(null);
  const [examsCard, setExamsCard] = useState<OrgCard | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ items: OrgCard[]; total: number }>({
    queryKey: [CARDS_KEY],
  });
  const cards = Array.isArray(data?.items) ? data!.items : [];

  // Razryad catalog → label lookup so each card shows "N-razryad" instead of the raw FK id.
  const { data: razryadData } = useQuery<{ items: { id: number; level: number; name: string }[] }>({
    queryKey: [RAZRYAD_KEY],
  });
  const razryadById = new Map((Array.isArray(razryadData?.items) ? razryadData!.items : []).map((r) => [r.id, r]));
  const razryadLabel = (rid: number | null | undefined): string => {
    if (rid == null) return "—";
    const r = razryadById.get(rid);
    return r ? `${r.level}-${t("razryad")}` : `#${rid}`;
  };

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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold">{t("kartalar")}</h2>
          <p className="text-[13px] text-muted-foreground">{t("kartalarPageSubtitle")}</p>
        </div>
        <Button onClick={openCreate} data-testid="button-card-create">
          <Plus className="h-4 w-4 mr-2" />{t("yangiKarta")}
        </Button>
      </div>

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
                <TableHead>{t("razryad")}</TableHead>
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
                  <TableCell data-testid={`razryad-badge-${c.id}`}>
                    {c.razryad_level_id != null
                      ? <EPStatusPill tone="info">{razryadLabel(c.razryad_level_id)}</EPStatusPill>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.salary_type ?? "—"}</TableCell>
                  <TableCell>
                    <EPStatusPill tone={STATUS_TONE[c.status ?? "active"] ?? "neutral"}>
                      {t(STATUS_LABEL[c.status ?? "active"] ?? "faol")}
                    </EPStatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setDetailId(c.id)} title={t("korish")} data-testid={`button-card-view-${c.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setFolderCard(c)} title={t("kartaPapkasi")} data-testid={`button-card-folder-${c.id}`}>
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setExamsCard(c)} title={t("kartaImtihonlari")} data-testid={`button-card-exams-${c.id}`}>
                        <GraduationCap className="h-4 w-4" />
                      </Button>
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
      <CardFolderDialog open={!!folderCard} onClose={() => setFolderCard(null)} card={folderCard} />
      <CardExamsDialog open={!!examsCard} onClose={() => setExamsCard(null)} card={examsCard} />
      <CardDetailDialog open={detailId != null} cardId={detailId ?? 0} onClose={() => setDetailId(null)} />
    </div>
  );
}
