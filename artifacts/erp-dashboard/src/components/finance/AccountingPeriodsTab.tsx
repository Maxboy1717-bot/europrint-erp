/**
 * @module AccountingPeriodsTab
 * @description React UI component.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Lock, Check } from "lucide-react";
import type { AccountingPeriod } from "@shared/schema";
import { useTranslation } from '@/lib/i18n';

function getMonthName(month: number): string {
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ];
  return months[month - 1] || String(month);
}

export function AccountingPeriodsTab() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const { data: periods = [], isLoading } = useQuery<AccountingPeriod[]>({
    queryKey: ["/api/fi/accounting-periods"],
  });

  const closePeriodMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/fi/accounting-periods/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/accounting-periods"] });
      toast({ title: "Muvaffaqiyatli", description: "Hisob davri yopildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Yopishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="text-accounting-periods-title">
          {t("hisobDavrlari")}
        </h3>
      </div>

      <Card className="bg-card border-none rounded-xl">
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("code")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("moliyaYili")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Oy</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("boshlanish")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("tugash")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("holati")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("Amallar")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell>
                </TableRow>
              ) : periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[13px] text-muted-foreground">{t("hisobDavrlariTopilmadi")}</TableCell>
                </TableRow>
              ) : (
                (Array.isArray(periods) ? periods : []).map((period) => (
                  <TableRow key={period.id} data-testid={`row-accounting-period-${period.id}`} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 font-mono text-foreground">{period.periodCode}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{period.fiscalYear}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{getMonthName(period.month)}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{period.startDate}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{period.endDate}</TableCell>
                    <TableCell className="py-3 px-6">
                      {period.status === "closed" ? (
                        <Badge variant="secondary">
                          <Lock className="mr-1 h-3 w-3" />
                          {t("yopilgan")}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Check className="mr-1 h-3 w-3" />
                          {t("ochiq")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      {period.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => closePeriodMutation.mutate(period.id)}
                          data-testid={`button-close-period-${period.id}`}
                        >
                          <Lock className="mr-1 h-3 w-3" />
                          {t("close2")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
