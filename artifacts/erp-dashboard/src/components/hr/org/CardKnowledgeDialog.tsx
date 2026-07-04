/**
 * @module CardKnowledgeDialog
 * @description SB0116/SB0146 (03-lms-darslik, EP-ORG-122/T11-03): "This card's domen-bilim
 *   (required domain knowledge)" — lists + creates + deletes card_required_knowledge rows via
 *   the canonical backend (already built: card-required-knowledge.controller.ts, no new tables).
 *   Opened from the "Kartalar" tab inside Org Tuzilma, mirroring CardExamsDialog/CardCoursesDialog.
 *   Real round-trip (Q-43): POST /api/lms/card-knowledge -> DB insert -> invalidate -> reload shows it.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import type { EPStatusTone } from "@/components/ep";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { OrgCard } from "@/components/hr/org/CardFormDialog";

interface KnowledgeItem {
  id: number;
  card_id: number;
  knowledge_name: string;
  knowledge_name_ru?: string | null;
  description?: string | null;
  category?: string | null;
  importance: "critical" | "required" | "recommended";
  course_id?: number | null;
  sort_order: number;
  is_active: boolean;
}

const IMPORTANCE_TONE: Record<string, EPStatusTone> = {
  critical: "danger", required: "warning", recommended: "neutral",
};

export function CardKnowledgeDialog({
  open,
  onClose,
  card,
}: {
  open: boolean;
  onClose: () => void;
  card: OrgCard | null;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardId = card?.id ?? 0;
  const byCardKey = `/api/lms/card-knowledge/by-card/${cardId}`;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [importance, setImportance] = useState<KnowledgeItem["importance"]>("required");

  const { data, isLoading } = useQuery<{ data: KnowledgeItem[]; pagination: { total: number } }>({
    queryKey: [byCardKey],
    enabled: open && cardId > 0,
  });
  const items = Array.isArray(data?.data) ? data!.data : [];

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/lms/card-knowledge", {
        cardId,
        knowledgeName: name.trim(),
        category: category.trim() || undefined,
        importance,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [byCardKey] });
      globalQueryClient.invalidateQueries({ queryKey: [byCardKey] });
      toast({ title: t("qoshildi", "Qo'shildi") });
      setName("");
      setCategory("");
      setImportance("required");
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/lms/card-knowledge/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [byCardKey] });
      globalQueryClient.invalidateQueries({ queryKey: [byCardKey] });
      toast({ title: t("ochirildi", "O'chirildi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            {t("kartaDomenBilim", "Karta domen-bilimi")}{card?.position_name ? ` — ${card.position_name}` : ""}
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground">
            {t("kartaDomenBilimMatn", "Ushbu kartaga kerakli domen-bilim talablari (kursga bog'liq bo'lmasligi ham mumkin).")}
          </p>
        </DialogHeader>

        <div className="flex items-end gap-2 py-2 flex-wrap">
          <div className="flex-1 min-w-[180px] space-y-1">
            <Input
              placeholder={t("bilimNomi", "Bilim nomi")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-knowledge-name"
            />
          </div>
          <div className="w-[160px] space-y-1">
            <Input
              placeholder={t("kategoriya", "Kategoriya")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="input-knowledge-category"
            />
          </div>
          <Select value={importance} onValueChange={(v: string) => setImportance(v as KnowledgeItem["importance"])}>
            <SelectTrigger className="w-[150px]" data-testid="select-knowledge-importance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">{t("kritik", "Kritik")}</SelectItem>
              <SelectItem value="required">{t("majburiy", "Majburiy")}</SelectItem>
              <SelectItem value="recommended">{t("tavsiya", "Tavsiya")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            data-testid="button-knowledge-add"
          >
            {createMutation.isPending ? t("saqlanmoqda", "Saqlanmoqda...") : t("qoshish", "Qo'shish")}
          </Button>
        </div>

        {isLoading ? (
          <EPLoader />
        ) : items.length === 0 ? (
          <EPEmptyState
            icon={BookMarked}
            title={t("bilimYoq", "Domen-bilim yo'q")}
            description={t("kartaDomenBilimYoqMatn", "Bu kartaga hali domen-bilim talabi qo'shilmagan.")}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("bilimNomi", "Bilim nomi")}</TableHead>
                  <TableHead>{t("kategoriya", "Kategoriya")}</TableHead>
                  <TableHead>{t("muhimlik", "Muhimlik")}</TableHead>
                  <TableHead className="text-right">{t("amallar", "Amallar")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id} data-testid={`row-knowledge-${it.id}`}>
                    <TableCell className="font-medium">{it.knowledge_name}</TableCell>
                    <TableCell className="text-muted-foreground">{it.category || "—"}</TableCell>
                    <TableCell>
                      <EPStatusPill tone={IMPORTANCE_TONE[it.importance] ?? "neutral"}>
                        {t(it.importance, it.importance)}
                      </EPStatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteConfirmDialog
                        title={t("bilimniOchirish", "Domen-bilimni o'chirish")}
                        description={t("bilimniOchirishMatn", "Bu amalni qaytarib bo'lmaydi.")}
                        isPending={deleteMutation.isPending}
                        onConfirm={() => deleteMutation.mutate(it.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("yopish", "Yopish")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
