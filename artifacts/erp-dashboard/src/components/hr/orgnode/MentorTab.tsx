/**
 * @module MentorTab
 * @description Karta-detal "Mentor" tab (T11-10 — karta-markazli mentor ko'rinishi).
 *   Kartaga biriktirilgan MENTOR(lar) ko'rsatish + kartaning odamlarini (rahbar/xodim)
 *   mentor sifatida biriktirish. Manba kanonik mentor-CRUD API (T10-09):
 *     GET    /api/mentorships          — global mentor reestri (mentors jadval)
 *     POST   /api/mentorships          — yangi mentor yozuvi (real INSERT)
 *     DELETE /api/mentorships/:id       — mentorni olib tashlash (soft-delete)
 *
 *   ⭐ KARTA-MENTOR bog'lanishi (fabrikatsiya YO'Q — Q-40):
 *     mentors jadvalida card_id YO'Q. Karta-mentor REAL ma'lumotdan hisoblanadi —
 *     mentor.user_id = kartaning rahbari (headUserId) yoki kartadagi xodim (employees[].id).
 *     "Bu kartaning mentorlari" = shu user_id'lar bilan mos kelgan REAL mentor yozuvlari.
 *     Biriktirish = kartaning REAL odamini (rahbar/xodim) mentor reestriga qo'shish
 *     (name = REAL ism, user_id = REAL id, source='internal'). Soxta mentor YOZILMAYDI.
 *
 *   ⭐ ADDITIV (Q-46): mavjud OrgNodeDetail tab tizimiga qo'shimcha; hech narsa buzilmaydi/o'chmaydi.
 *     EP token/shablon (EPLoader/EPEmptyState/EPStatusPill). O'chirish ConfirmDialog bilan (Qoida 14).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, UserPlus, UserX, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NodeDetail } from "./types";
import { useTranslation } from "@/lib/i18n";

/** /api/mentorships qaytaradigan mentor qatori (mentors jadval shakli). */
interface MentorRow {
  id: string | number;
  name: string;
  user_id?: number | string | null;
  bio?: string | null;
  expertise?: string | null;
  source?: string | null;
  experience?: string | null;
}

/** Kartaning mentor sifatida biriktirilishi mumkin bo'lgan odami (rahbar yoki xodim). */
interface CardPerson {
  userId: number;
  fullName: string;
  role: string;
}

export function MentorTab({ node }: { node: NodeDetail }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [pickUserId, setPickUserId] = useState<string>("");

  const mentorsKey = "/api/mentorships";

  const { data, isLoading, isError } = useQuery<MentorRow[]>({
    queryKey: [mentorsKey],
    staleTime: 30_000,
  });
  const allMentors = Array.isArray(data) ? data : [];

  // Kartaning odamlari (rahbar + xodimlar) — REAL ma'lumot, user_id bilan.
  const cardPeople: CardPerson[] = [];
  if (node.headUserId != null && node.headUserName) {
    cardPeople.push({ userId: Number(node.headUserId), fullName: node.headUserName, role: t("rahbar", "Rahbar") });
  }
  for (const e of Array.isArray(node.employees) ? node.employees : []) {
    if (e?.id != null && e.fullName && !cardPeople.some((p) => p.userId === e.id)) {
      cardPeople.push({ userId: e.id, fullName: e.fullName, role: e.role || t("xodim", "Xodim") });
    }
  }
  const cardUserIds = new Set(cardPeople.map((p) => p.userId));

  // "Bu kartaning mentorlari" = user_id kartadagi odamga mos kelgan REAL mentor yozuvlari.
  const cardMentorUserIds = new Set<number>();
  const cardMentors = allMentors.filter((m) => {
    const uid = m.user_id == null ? null : Number(m.user_id);
    if (uid != null && cardUserIds.has(uid)) {
      cardMentorUserIds.add(uid);
      return true;
    }
    return false;
  });

  // Hali mentor bo'lmagan kartaning odamlari → biriktirish nomzodlari.
  const candidates = cardPeople.filter((p) => !cardMentorUserIds.has(p.userId));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [mentorsKey] });
  };

  const assignMutation = useMutation({
    mutationFn: (person: CardPerson) =>
      apiRequest<{ id?: number }>("POST", mentorsKey, {
        name: person.fullName,
        user_id: person.userId,
        source: "internal",
        bio: `${person.role} — ${node.name}`,
      }),
    onSuccess: () => {
      invalidate();
      setAssignOpen(false);
      setPickUserId("");
      toast({ title: t("mentorBiriktirildi", "Mentor kartaga biriktirildi") });
    },
    onError: () => toast({ title: t("Xatolik", "Xatolik"), variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string | number) => apiRequest("DELETE", `${mentorsKey}/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: t("mentorOlibTashlandi", "Mentor olib tashlandi") });
    },
    onError: () => toast({ title: t("Xatolik", "Xatolik"), variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              {t("kartaMentorlari", "Karta mentorlari")}
            </CardTitle>
            <p className="text-[13px] text-muted-foreground mt-1">
              {t("kartaMentorlariMatn", "Ushbu kartaga biriktirilgan mentorlar. Mentor = kartaning rahbari yoki xodimi (mentor reestriga qo'shilgan).")}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setAssignOpen(true)}
            disabled={candidates.length === 0}
            data-testid="button-assign-mentor"
          >
            <UserPlus className="h-4 w-4 mr-2" />{t("mentorBiriktirish", "Mentor biriktirish")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <EPLoader />
        ) : isError ? (
          <EPEmptyState
            icon={GraduationCap}
            title={t("mentorlarYuklanmadi", "Mentorlar yuklanmadi")}
            description={t("mentorlarYuklanmadiMatn", "Mentor reestrini yuklab bo'lmadi. Keyinroq qayta urinib ko'ring.")}
          />
        ) : cardMentors.length === 0 ? (
          <EPEmptyState
            icon={GraduationCap}
            title={t("mentorlarYoq", "Mentorlar yo'q")}
            description={t("kartaMentorlariYoqMatn", "Bu kartaga hali mentor biriktirilmagan. Kartaning rahbari yoki xodimini mentor sifatida biriktiring.")}
          />
        ) : (
          <div className="space-y-2">
            {cardMentors.map((m) => {
              const uid = m.user_id == null ? null : Number(m.user_id);
              const person = uid != null ? cardPeople.find((p) => p.userId === uid) : undefined;
              return (
                <Card key={String(m.id)} className="hover:shadow transition-shadow">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {m.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate" data-testid={`mentor-name-${m.id}`}>{m.name}</p>
                        {person && (
                          <EPStatusPill tone="brand" className="text-[10px]">
                            <Award className="h-3 w-3 mr-1 inline" />{person.role}
                          </EPStatusPill>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
                        {m.expertise && <span className="truncate max-w-[220px]">{m.expertise}</span>}
                        {m.experience && <span className="truncate max-w-[160px]">{m.experience}</span>}
                        {!m.expertise && !m.experience && m.bio && <span className="truncate max-w-[280px]">{m.bio}</span>}
                      </div>
                    </div>
                    <DeleteConfirmDialog
                      title={t("mentorniOlibTashlash", "Mentorni kartadan olib tashlash")}
                      description={t("mentorniOlibTashlashMatn", "Bu mentor yozuvi olib tashlanadi (mentor reestridan).")}
                      buttonText={t("olibTashlash", "Olib tashlash")}
                      isPending={removeMutation.isPending}
                      onConfirm={() => removeMutation.mutate(m.id)}
                      trigger={
                        <Button size="icon" variant="ghost" title={t("olibTashlash", "Olib tashlash")} data-testid={`button-remove-mentor-${m.id}`}>
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("mentorBiriktirish", "Mentor biriktirish")}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>{t("kartaOdami", "Karta odami (rahbar / xodim)")}</Label>
            <Select value={pickUserId} onValueChange={setPickUserId}>
              <SelectTrigger data-testid="select-mentor-person">
                <SelectValue placeholder={t("odamniTanlang", "Odamni tanlang")} />
              </SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{t("mavjudOdamYoq", "Mavjud odam yo'q")}</div>
                ) : candidates.map((p) => (
                  <SelectItem key={p.userId} value={String(p.userId)}>
                    {p.fullName} — {p.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {t("mentorBiriktirishIzoh", "Tanlangan odam mentor reestriga qo'shiladi va shu kartaning mentori bo'ladi. Mentor ma'lumotini (tajriba, mutaxassislik) keyin LMS modulida to'ldirish mumkin.")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>{t("Bekor", "Bekor")}</Button>
            <Button
              onClick={() => {
                const person = candidates.find((p) => p.userId === Number(pickUserId));
                if (person) assignMutation.mutate(person);
              }}
              disabled={!pickUserId || assignMutation.isPending}
              data-testid="button-confirm-assign-mentor"
            >
              {assignMutation.isPending ? t("saqlanmoqda", "Saqlanmoqda...") : t("biriktirish", "Biriktirish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
