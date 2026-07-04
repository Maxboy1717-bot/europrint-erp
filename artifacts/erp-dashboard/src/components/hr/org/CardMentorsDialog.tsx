/**
 * @module CardMentorsDialog
 * @description SB0122/SB0139 (03-lms-darslik, EP-ORG-116/T10-09): "This card's mentors" — lists +
 *   assigns + revokes lms_card_mentors rows via the canonical backend (already built:
 *   LmsMentorsController `mentors/cards/*`, no new tables). Opened from the "Kartalar" tab inside
 *   Org Tuzilma, mirroring CardExamsDialog/CardCoursesDialog/CardKnowledgeDialog.
 *
 *   ⭐ Mentor reyting/malaka-tekshiruv (rating/qualification-check) is a SEPARATE, still-open
 *   vision gap (no rating column on `mentors`, no design spec for pass/fail criteria) — NOT
 *   fabricated here (Q-40). This dialog covers the assign/revoke CRUD only.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { OrgCard } from "@/components/hr/org/CardFormDialog";

interface CardMentorAssignment {
  id: number;
  card_id: number;
  mentor_user_id: number;
  mentor_name?: string | null;
  course_id?: number | null;
  course_title?: string | null;
  notes?: string | null;
  is_active: boolean;
  assigned_at: string | null;
}

interface UserOption {
  id: number | string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

function userName(u: UserOption): string {
  return u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.name || `#${u.id}`;
}

export function CardMentorsDialog({
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
  const listKey = `/api/mentors/cards?cardId=${cardId}`;

  const [mentorUserId, setMentorUserId] = useState<string>("");

  const { data, isLoading } = useQuery<CardMentorAssignment[]>({
    queryKey: [listKey],
    enabled: open && cardId > 0,
  });
  const assignments = Array.isArray(data) ? data : [];

  const { data: employeesResponse } = useQuery<{ data: UserOption[] } | UserOption[]>({
    queryKey: ["/api/hr/employees"],
    enabled: open,
  });
  const employees = Array.isArray(employeesResponse) ? employeesResponse : (employeesResponse?.data ?? []);

  const assignMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/mentors/cards", {
        cardId,
        mentorUserId: Number(mentorUserId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listKey] });
      globalQueryClient.invalidateQueries({ queryKey: [listKey] });
      toast({ title: t("mentorBiriktirildi", "Mentor biriktirildi") });
      setMentorUserId("");
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/mentors/cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listKey] });
      globalQueryClient.invalidateQueries({ queryKey: [listKey] });
      toast({ title: t("bekorQilindi", "Bekor qilindi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            {t("kartaMentorlari", "Karta mentorlari")}{card?.position_name ? ` — ${card.position_name}` : ""}
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground">
            {t("kartaMentorlariMatn", "Onboarding davrida ushbu kartaga biriktirilgan mentorlar.")}
          </p>
        </DialogHeader>

        <div className="flex items-end gap-2 py-2">
          <div className="flex-1">
            <Select value={mentorUserId || undefined} onValueChange={setMentorUserId}>
              <SelectTrigger data-testid="select-mentor-user"><SelectValue placeholder={t("xodimTanlang", "Xodim tanlang")} /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={String(e.id)} value={String(e.id)}>{userName(e)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!mentorUserId || assignMutation.isPending}
            data-testid="button-mentor-assign"
          >
            {assignMutation.isPending ? t("saqlanmoqda", "Saqlanmoqda...") : t("biriktirish", "Biriktirish")}
          </Button>
        </div>

        {isLoading ? (
          <EPLoader />
        ) : assignments.length === 0 ? (
          <EPEmptyState
            icon={UserCog}
            title={t("mentorYoq", "Mentor yo'q")}
            description={t("kartaMentorlariYoqMatn", "Bu kartaga hali mentor biriktirilmagan.")}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("mentor", "Mentor")}</TableHead>
                  <TableHead>{t("kurs", "Kurs")}</TableHead>
                  <TableHead>{t("holati", "Holati")}</TableHead>
                  <TableHead className="text-right">{t("amallar", "Amallar")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id} data-testid={`row-mentor-${a.id}`}>
                    <TableCell className="font-medium">{a.mentor_name || `#${a.mentor_user_id}`}</TableCell>
                    <TableCell className="text-muted-foreground">{a.course_title || "—"}</TableCell>
                    <TableCell>
                      <EPStatusPill tone={a.is_active ? "success" : "neutral"}>
                        {a.is_active ? t("faol", "Faol") : t("bekorQilingan", "Bekor qilingan")}
                      </EPStatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      {a.is_active && (
                        <DeleteConfirmDialog
                          title={t("mentorniBekorQilish", "Mentorni bekor qilish")}
                          description={t("mentorniBekorQilishMatn", "Bu amalni qaytarib bo'lmaydi.")}
                          isPending={revokeMutation.isPending}
                          onConfirm={() => revokeMutation.mutate(a.id)}
                        />
                      )}
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
