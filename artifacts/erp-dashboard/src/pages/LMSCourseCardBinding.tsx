/**
 * @module LMSCourseCardBinding
 * @description Kurs–Karta biriktiruvi (Batch 5 Item 7). Har darslikni org-KARTAga (lavozim,
 *   org_departments) biriktiradi — courses.card_id ni to'ldiradi. Biriktirilgach, ro'yxatga
 *   yozilganda enrollments.card_id kurs kartasidan avtomatik to'ldiriladi (backfill). BE mavjud:
 *   GET /api/lms/courses, PATCH /api/lms/courses/:id/card (cardId=null → uzish), GET /api/org-departments.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { GraduationCap, Link2 } from "lucide-react";

interface Course { id: number; title?: string; title_uz?: string; course_type?: string | null; card_id?: number | null; }
interface OrgCard { id: number; name?: string; title?: string; }

const COURSES_API = "/api/lms/courses";
const CARDS_API = "/api/org-departments";
const UNBOUND = "__none__";

function asArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const o = raw as { data?: unknown; items?: unknown } | undefined;
  if (Array.isArray(o?.data)) return o!.data as T[];
  if (Array.isArray(o?.items)) return o!.items as T[];
  return [];
}

export default function LMSCourseCardBinding() {
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<number | null>(null);

  const coursesQ = useQuery({
    queryKey: [COURSES_API, "binding"],
    queryFn: async () => apiRequest("GET", `${COURSES_API}?limit=100`),
  });
  const cardsQ = useQuery({
    queryKey: [CARDS_API, "binding"],
    queryFn: async () => apiRequest("GET", CARDS_API),
  });

  const courses = asArray<Course>(coursesQ.data);
  const cards = asArray<OrgCard>(cardsQ.data);
  const cardName = useMemo(() => {
    const m = new Map<number, string>();
    cards.forEach(c => m.set(Number(c.id), c.name ?? c.title ?? `#${c.id}`));
    return m;
  }, [cards]);

  const bindMutation = useMutation({
    mutationFn: async (v: { id: number; cardId: number | null }) =>
      apiRequest("PATCH", `${COURSES_API}/${v.id}/card`, { cardId: v.cardId }),
    onMutate: (v) => setSavingId(v.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COURSES_API] });
      toast({ title: tLabel("common.biriktirildi", "Biriktirildi") });
    },
    onError: () => toast({ title: "Xatolik", description: tLabel("common.biriktirilmadi", "Biriktirilmadi"), variant: "destructive" }),
    onSettled: () => setSavingId(null),
  });

  if (coursesQ.isError) return <EPErrorState onRetry={coursesQ.refetch} error={coursesQ.error} />;

  const boundCount = courses.filter(c => c.card_id != null).length;

  return (
    <ModulePage
      module="hr"
      title="Kurs–Karta Biriktiruvi"
      subtitle="Darslikni lavozim-KARTAsiga biriktirish"
      icon={<Link2 className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {!coursesQ.isLoading && (
          <div className="text-sm text-muted-foreground">
            {tLabel("common.biriktirilgan", "Biriktirilgan")}: <strong className="text-foreground">{boundCount}</strong> / {courses.length}
          </div>
        )}

        {coursesQ.isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : courses.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{tLabel("common.darslikYoq", "Darslik topilmadi.")}</p>
          </CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tLabel("common.darslik", "Darslik")}</TableHead>
                    <TableHead>{tLabel("common.turi", "Turi")}</TableHead>
                    <TableHead>{tLabel("common.biriktirilganKarta", "Biriktirilgan karta")}</TableHead>
                    <TableHead className="w-[280px]">{tLabel("common.kartaTanlash", "Karta tanlash")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map(c => {
                    const cid = c.card_id != null ? Number(c.card_id) : null;
                    return (
                      <TableRow key={c.id} data-testid={`course-row-${c.id}`}>
                        <TableCell className="font-medium">{c.title_uz ?? c.title ?? `#${c.id}`}</TableCell>
                        <TableCell className="text-muted-foreground">{c.course_type ?? "—"}</TableCell>
                        <TableCell>
                          {cid != null
                            ? <Badge variant="default">{cardName.get(cid) ?? `#${cid}`}</Badge>
                            : <Badge variant="secondary">{tLabel("common.biriktirilmagan", "Biriktirilmagan")}</Badge>}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={cid != null ? String(cid) : UNBOUND}
                            disabled={savingId === c.id}
                            onValueChange={(v) => bindMutation.mutate({ id: c.id, cardId: v === UNBOUND ? null : Number(v) })}
                          >
                            <SelectTrigger data-testid={`select-card-${c.id}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UNBOUND}>{tLabel("common.biriktirilmagan", "Biriktirilmagan")}</SelectItem>
                              {cards.map(card => (
                                <SelectItem key={card.id} value={String(card.id)}>{card.name ?? card.title ?? `#${card.id}`}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ModulePage>
  );
}
