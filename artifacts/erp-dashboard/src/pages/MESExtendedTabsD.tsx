/** @module MESExtendedTabsD @description Gamification leaderboard tab for the MES Extended page. */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Trophy } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { type MESLeaderboard } from "./MESExtendedTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Props ───────────────────────────────────────────────────────────────────

interface GamificationTabProps {
  leaderboard: MESLeaderboard[];
  isLoading: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

/** Tab content: Operator Gamifikatsiya va Reyting */
export function GamificationTab({ leaderboard, isLoading }: GamificationTabProps) {
  const { t } = useTranslation("common");
  const board = Array.isArray(leaderboard) ? leaderboard : [];
  const avgQuality = board.length > 0
    ? (board.reduce((s: number, o: MESLeaderboard) => s + Number(o.quality || o.qualityRate || 0), 0) / board.length).toFixed(1)
    : 0;
  const totalTasks = board.reduce(
    (s: number, o: MESLeaderboard) => s + Number(o.tasks || o.completedTasks || 0),
    0,
  );

  return (
    <TabsContent value="gamification" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("operatorGamifikatsiyaVaReyting")}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["/api/mes/gamification/leaderboard"] })
          }
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </div>

      {board.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top performer card */}
          <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-4 pb-4 text-center">
              <Trophy className="h-8 w-8 text-[var(--ep-yellow)] mx-auto mb-2" />
              <div className="font-bold">
                {String(board[0]?.name || board[0]?.username || "—")}
              </div>
              <div className="text-2xl font-bold text-[var(--ep-yellow)] mt-1">
                {Number(board[0]?.score || board[0]?.points || 0)} ball
              </div>
              <Badge className="mt-2">{t("oyningEngYaxshiOperatori")}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-primary">{totalTasks}</div>
              <div className="text-sm text-muted-foreground">{t("jamiBajarilganVazifalar")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-[var(--ep-green)]">{avgQuality}%</div>
              <div className="text-sm text-muted-foreground">{t("ortachaSifatKorsatkichi")}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("operatorReytingi")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t("orin")}</TableHead>
                <TableHead>{t("Operator")}</TableHead>
                <TableHead>{t("ball")}</TableHead>
                <TableHead>{t("vazifalar")}</TableHead>
                <TableHead>{t("Sifat")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">
                    {t("Yuklanmoqda...")}
                  </TableCell>
                </TableRow>
              ) : board.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    {t("reytingMalumotiYoq")}
                  </TableCell>
                </TableRow>
              ) : (
                board.slice(0, 10).map((op: MESLeaderboard, i: number) => (
                  <TableRow key={op.id || i} data-testid={`row-operator-${i + 1}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-bold text-center">#{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      {op.name || op.username || op.fullName || "Operator"}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-primary">{op.score || op.points || 0}</span>
                    </TableCell>
                    <TableCell>{op.tasks || op.completedTasks || 0} ta</TableCell>
                    <TableCell className="text-[var(--ep-green)] font-medium">
                      {Number(op.quality || op.qualityRate || 0).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
