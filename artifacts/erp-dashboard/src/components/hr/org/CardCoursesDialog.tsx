/**
 * @module CardCoursesDialog
 * @description A74 (card<->course view): "This card's darsliklar (courses) + progress". Lists the
 *   courses bound to an org-CARD via GET /api/lms/courses/by-card/:cardId and shows each course's
 *   REAL enrollment progress aggregate (enrolled / completed counts + avg progress_percent, computed
 *   by the by-card endpoint's LEFT JOIN enrollments). Opened from the "Kartalar" tab inside Org
 *   Tuzilma, mirroring CardExamsDialog. Additive — reuses the canonical LMS infra, no new tables.
 */

import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";
import type { OrgCard } from "@/components/hr/org/CardFormDialog";

interface CardCourse {
  id: string;
  title: string;
  category?: string | null;
  is_mandatory?: boolean;
  passing_score?: number;
  enrolled_count?: number;
  completed_count?: number;
  avg_progress?: number;
}

export function CardCoursesDialog({
  open,
  onClose,
  card,
}: {
  open: boolean;
  onClose: () => void;
  card: OrgCard | null;
}) {
  const { t } = useTranslation("common");
  const cardId = card?.id ?? 0;
  const byCardKey = `/api/lms/courses/by-card/${cardId}`;

  const { data, isLoading } = useQuery<{ data: CardCourse[]; pagination: { total: number } }>({
    queryKey: [byCardKey],
    enabled: open && cardId > 0,
  });
  const courses = Array.isArray(data?.data) ? data!.data : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("kartaKurslari", "Karta kurslari")}{card?.position_name ? ` — ${card.position_name}` : ""}
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground">
            {t("kartaKurslariMatn", "Ushbu kartaga biriktirilgan darsliklar va xodimlar progressi.")}
          </p>
        </DialogHeader>

        {isLoading ? (
          <EPLoader />
        ) : courses.length === 0 ? (
          <EPEmptyState
            icon={BookOpen}
            title={t("kurslarYoq", "Kurslar yo'q")}
            description={t("kartaKurslariYoqMatn", "Bu kartaga hali darslik biriktirilmagan. Darslikni LMS modulida kartaga biriktiring.")}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("kurs", "Kurs")}</TableHead>
                  <TableHead>{t("kategoriya", "Kategoriya")}</TableHead>
                  <TableHead>{t("turi", "Turi")}</TableHead>
                  <TableHead>{t("yozilganlar", "Yozilganlar")}</TableHead>
                  <TableHead className="min-w-[160px]">{t("ortachaProgress", "O'rtacha progress")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => {
                  const enrolled = Number(c.enrolled_count ?? 0);
                  const completed = Number(c.completed_count ?? 0);
                  const avg = Number(c.avg_progress ?? 0);
                  return (
                    <TableRow key={String(c.id)} data-testid={`row-card-course-${c.id}`}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="text-muted-foreground">{c.category || "—"}</TableCell>
                      <TableCell>
                        {c.is_mandatory
                          ? <EPStatusPill tone="brand">{t("majburiy", "Majburiy")}</EPStatusPill>
                          : <EPStatusPill tone="neutral">{t("ixtiyoriy", "Ixtiyoriy")}</EPStatusPill>}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`enrolled-${c.id}`}>
                        {enrolled > 0 ? `${completed}/${enrolled}` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={avg} className="h-2 flex-1" />
                          <span className="text-[12px] text-muted-foreground tabular-nums w-9 text-right">{avg}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
