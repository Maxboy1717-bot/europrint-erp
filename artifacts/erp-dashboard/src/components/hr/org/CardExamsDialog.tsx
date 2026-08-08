/**
 * @module CardExamsDialog
 * @description "This card's AI exams" (ORG Phase 4C). Lists the card's ai_exam_attempts
 *   (GET /api/ai-exam/by-card/:id) and assigns a per-card AI exam to an employee
 *   (POST /api/ai-exam/assign-card). Reuses the canonical ai-exam infra — no new tables.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
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
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import type { EPStatusTone } from "@/components/ep";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { OrgCard } from "@/components/hr/org/CardFormDialog";

interface Attempt {
  id: number;
  user_id: number;
  status: string;
  score: number | null;
  question_count: number;
  assigned_at: string | null;
}

interface Employee {
  id: number | string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

const STATUS_TONE: Record<string, EPStatusTone> = {
  assigned: "info", submitted: "warning", analyzed: "success", completed: "success",
};

function empName(e: Employee): string {
  return e.full_name || [e.first_name, e.last_name].filter(Boolean).join(" ") || e.name || `#${e.id}`;
}

export function CardExamsDialog({
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
  const byCardKey = `/api/ai-exam/by-card/${cardId}`;

  const [employeeId, setEmployeeId] = useState<string>("");

  const { data: attemptsData, isLoading } = useQuery<Attempt[]>({
    queryKey: [byCardKey],
    enabled: open && cardId > 0,
  });
  const attempts = Array.isArray(attemptsData) ? attemptsData : [];

  const { data: employeesData } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
    enabled: open,
  });
  const employees = Array.isArray(employeesData) ? employeesData : [];

  const assignMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/ai-exam/assign-card", {
        userId: Number(employeeId),
        orgFunctionId: cardId,
        razryadLevelId: card?.razryad_level_id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [byCardKey] });
      toast({ title: t("imtihonTayinlandi") });
      setEmployeeId("");
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {t("kartaImtihonlari")}{card?.position_name ? ` — ${card.position_name}` : ""}
          </DialogTitle>
        </DialogHeader>

        {/* Assign a per-card AI exam to an employee */}
        <div className="flex items-end gap-2 py-2">
          <div className="flex-1">
            <Select value={employeeId || undefined} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder={t("xodimTanlang")} /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={String(e.id)} value={String(e.id)}>{empName(e)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => assignMutation.mutate()} disabled={!employeeId || assignMutation.isPending}>
            {assignMutation.isPending ? t("saqlanmoqda") : t("aiImtihonTayinlash")}
          </Button>
        </div>

        {isLoading ? (
          <EPLoader />
        ) : attempts.length === 0 ? (
          <EPEmptyState icon={GraduationCap} title={t("imtihonlarYoq")} description={t("imtihonlarYoqMatn")} />
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t("xodim")}</TableHead>
                  <TableHead>{t("holati")}</TableHead>
                  <TableHead>{t("savollarSoni")}</TableHead>
                  <TableHead>{t("ball")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a) => (
                  <TableRow key={a.id} data-testid={`row-attempt-${a.id}`}>
                    <TableCell className="font-medium">{a.id}</TableCell>
                    <TableCell className="text-muted-foreground">#{a.user_id}</TableCell>
                    <TableCell>
                      <EPStatusPill tone={STATUS_TONE[a.status] ?? "neutral"}>{a.status}</EPStatusPill>
                    </TableCell>
                    <TableCell>{a.question_count}</TableCell>
                    <TableCell className="text-muted-foreground">{a.score ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("yopish")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
