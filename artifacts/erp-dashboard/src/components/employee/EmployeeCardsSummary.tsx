/**
 * @module EmployeeCardsSummary
 * @description Employee's ORG cards + FORMULA-A total salary (EP-ORG-142). Read-only surface on the
 *   profile "work" tab. GET /api/org-structure/cards/by-employee/:id → { cards, totalSalary }.
 *   FORMULA A = SUM of active cards' max_salary (full, no cap). Salaries are NULL until cards are
 *   populated (build phase) → shows 0, honestly.
 */

import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

interface EmpCard {
  card_id: number;
  is_primary: boolean;
  position_name: string;
  code: string | null;
  card_salary: string | number | null;
}

const fmtSom = (v: string | number | null | undefined): string => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toLocaleString("ru-RU") + " so'm" : "0 so'm";
};

export function EmployeeCardsSummary({ employeeId }: { employeeId: string | number }) {
  const { t } = useTranslation("common");
  const { data, isLoading } = useQuery<{ cards: EmpCard[]; totalSalary: number }>({
    queryKey: [`/api/org-structure/cards/by-employee/${employeeId}`],
    enabled: !!employeeId,
  });
  const cards = Array.isArray(data?.cards) ? data!.cards : [];
  const total = data?.totalSalary ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4" />
          {t("kartalarVaUmumiyOylik")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <EPLoader />
        ) : cards.length === 0 ? (
          <EPEmptyState icon={Layers} title={t("kartaBiriktirilmagan")} />
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-x-auto mb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("lavozimNomi")}</TableHead>
                    <TableHead>{t("kartaKodi")}</TableHead>
                    <TableHead>{t("oylik")}</TableHead>
                    <TableHead>{t("tur")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((c) => (
                    <TableRow key={c.card_id} data-testid={`row-empcard-${c.card_id}`}>
                      <TableCell className="font-medium">{c.position_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.code ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtSom(c.card_salary)}</TableCell>
                      <TableCell>
                        {c.is_primary
                          ? <EPStatusPill tone="brand">{t("asosiy")}</EPStatusPill>
                          : <EPStatusPill tone="neutral">{t("qoshimcha")}</EPStatusPill>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
              <span className="text-[13px] text-muted-foreground">{t("umumiyOylikFormulaA")}</span>
              <span className="text-[16px] font-semibold">{fmtSom(total)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
