/**
 * @module DarslikTab
 * @description Karta-detal "Darslik" tab (T10-11 — karta-markazli LMS ko'rinishi). Kartaga
 *   biriktirilgan darsliklar (kurslar) ro'yxati + har kursning REAL enrollment progressi
 *   (yozilgan / tugatgan soni + o'rtacha progress_percent). Manba kanonik LMS-endpoint:
 *   GET /api/lms/courses/by-card/:cardId — bu yerda cardId = node.id (org-karta kanonik id,
 *   org_departments/org_functions). Progress backend LEFT JOIN enrollments orqali hisoblanadi.
 *
 *   ⭐ FABRIKATSIYA YO'Q (Q-40): faqat REAL bog'langan kurslar va REAL enrollment agregati
 *     ko'rsatiladi. Kartaga darslik biriktirilmagan bo'lsa → bo'sh-holat + izoh (soxta kurs
 *     YOZILMAYDI). Darslikni kartaga biriktirish LMS modulida (kurs.card_id) qilinadi.
 *
 *   ⭐ ADDITIV (Q-46): mavjud OrgNodeDetail tab tizimiga qo'shimcha; hech narsa buzilmaydi/o'chmaydi.
 *     CardCoursesDialog (Kartalar tab dialogi) bilan bir xil endpoint + jadval — endi karta-detal
 *     ichida tab sifatida ham. EP token/shablon (EPLoader/EPEmptyState/EPStatusPill).
 */

import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import { NodeDetail } from "./types";
import { useTranslation } from "@/lib/i18n";

/** by-card endpoint qaytaradigan kurs qatori (CardCoursesDialog bilan bir xil shakl). */
interface CardCourse {
  id: string | number;
  title: string;
  category?: string | null;
  is_mandatory?: boolean;
  passing_score?: number;
  enrolled_count?: number;
  completed_count?: number;
  avg_progress?: number;
}

export function DarslikTab({ node }: { node: NodeDetail }) {
  const { t } = useTranslation("common");
  const cardId = node.id;
  const byCardKey = `/api/lms/courses/by-card/${cardId}`;

  const { data, isLoading } = useQuery<{ data: CardCourse[]; pagination: { total: number } }>({
    queryKey: [byCardKey],
    enabled: cardId > 0,
    staleTime: 30_000,
  });
  const courses = Array.isArray(data?.data) ? data!.data : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {t("kartaKurslari", "Karta kurslari (darsliklar)")}
        </CardTitle>
        <p className="text-[13px] text-muted-foreground">
          {t("kartaKurslariMatn", "Ushbu kartaga biriktirilgan darsliklar va xodimlar progressi.")}
        </p>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
