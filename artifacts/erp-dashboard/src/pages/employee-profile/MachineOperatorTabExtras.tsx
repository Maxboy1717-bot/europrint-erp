/**
 * @module MachineOperatorTabExtras
 * @description Recent stoppages table and OEE rating badge for MachineOperatorTab.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Gauge } from "lucide-react";
import type { MesSummary } from "./profile-types";
import { useTranslation } from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/* Recent Stoppages                                                     */
/* ------------------------------------------------------------------ */

interface RecentStoppagesProps {
  mes: MesSummary | null | undefined;
}

export function RecentStoppages({ mes }: RecentStoppagesProps) {
  const { t } = useTranslation("common");
  const recent = mes?.recentStoppages ?? [];
  if (recent.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-[var(--ep-red)]" />
          {t("oxirgiToxtashlar")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">{t("date")}</TableHead>
              <TableHead className="text-xs">{t("sabab")}</TableHead>
              <TableHead className="text-xs text-right">{t("davomiyligi")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.slice(0, 10).map((st, i) => (
              <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                <TableCell className="text-xs py-1.5 text-muted-foreground whitespace-nowrap">
                  {st.startedAt ? new Date(st.startedAt).toLocaleDateString("uz-UZ") : "—"}
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  {st.reasonDescription || st.reasonCode || "—"}
                </TableCell>
                <TableCell className="text-xs text-right py-1.5 font-medium">
                  {st.durationSeconds
                    ? `${Math.round(st.durationSeconds / 60)} daq`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* OEE Rating Badge                                                     */
/* ------------------------------------------------------------------ */

interface OeeRatingProps {
  oee: number;
}

export function OeeRatingCard({ oee }: OeeRatingProps) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gauge className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm font-semibold">{t("umumiyOeeBahosi")}</p>
            <p className="text-xs text-muted-foreground">
              {t("jahonStandartiAlo85Yaxshi")}
            </p>
          </div>
        </div>
        <Badge
          className={`text-sm px-4 py-1.5 ${
            oee >= 85
              ? "bg-green-500/20 text-[var(--ep-green)] border-green-500/30"
              : oee >= 65
                ? "bg-amber-500/20 text-[var(--ep-yellow)] border-amber-500/30"
                : oee >= 50
                  ? "bg-orange-500/20 text-[var(--ep-primary)] border-orange-500/30"
                  : "bg-red-500/20 text-[var(--ep-red)] border-red-500/30"
          }`}
          variant="outline"
        >
          {oee >= 85 ? "A'lo" : oee >= 65 ? "Yaxshi" : oee >= 50 ? "Qoniqarli" : "Yaxshilash kerak"}
          {" — "}{oee.toFixed(1)}%
        </Badge>
      </CardContent>
    </Card>
  );
}
