/**
 * @module HRSuccessionPlanningSections
 * @description Section tab components for HRSuccessionPlanning page.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen } from "lucide-react";
import { NINE_BOX } from "./HRSuccessionPlanningTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Key Positions Tab ────────────────────────────────────────────────────────

interface KeyPositionsTabProps {
  positions: Record<string, unknown>[];
  isLoading: boolean;
}

export function KeyPositionsTab({ positions, isLoading }: KeyPositionsTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("strategikLavozimlarRoyxati")}</CardTitle>
        <CardDescription>{t("vorissizYokiYuqoriXavfliAsosiy")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("lavozim1")}</TableHead>
                <TableHead>{t("bolim1")}</TableHead>
                <TableHead>{t("rejalari")}</TableHead>
                <TableHead>{t("k1Yilda")}</TableHead>
                <TableHead>{t("k2Yilda")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(positions) && positions.length > 0) ? positions.map((pos, idx) => (
                <TableRow key={String(pos.id ?? idx)} data-testid={`row-position-${String(pos.id ?? idx)}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium">{String(pos.title ?? "")}</p>
                      {!!pos.title_ru && <p className="text-xs text-muted-foreground">{String(pos.title_ru)}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{String(pos.department ?? pos.name ?? "—")}</TableCell>
                  <TableCell>
                    <Badge variant={Number(pos.succession_plans ?? 0) > 0 ? "secondary" : "outline"}>
                      {Number(pos.succession_plans ?? 0)} reja
                    </Badge>
                  </TableCell>
                  <TableCell>{Number(pos.ready_1_year ?? pos.ready1Year ?? 0)}</TableCell>
                  <TableCell>{Number(pos.ready_2_years ?? pos.ready2Year ?? 0)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                    {t("asosiyLavozimlarTopilmadi")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Career Plans Tab ─────────────────────────────────────────────────────────

interface CareerPlansTabProps {
  plans: Record<string, unknown>[];
  isLoading: boolean;
}

export function CareerPlansTab({ plans, isLoading }: CareerPlansTabProps) {
  const { t } = useTranslation("common");
  return (
    <CardContent className="p-0">
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{t("haliVorislikRejalariYoqYangi")}</p>
        </div>
      ) : (
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("xodim1")}</TableHead>
              <TableHead>{t("joriyLavozim")}</TableHead>
              <TableHead>{t("maqsadLavozim1")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("status28")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(plans) ? plans : []).map((plan, idx) => (
              <TableRow key={String(plan.id ?? idx)} data-testid={`row-plan-${String(plan.id ?? idx)}`} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{String(plan.employee_name ?? "—")}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {String(plan.current_position_title ?? plan.employee_position ?? "—")}
                </TableCell>
                <TableCell>{String(plan.target_position_title ?? "—")}</TableCell>
                <TableCell className="text-sm">{plan.target_date ? String(plan.target_date) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={plan.status === "active" ? "secondary" : "outline"}>
                    {plan.status === "active" ? "Faol" : plan.status === "completed" ? "Yakunlangan" : String(plan.status ?? "—")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      )}
    </CardContent>
  );
}

// ─── Candidates Tab ───────────────────────────────────────────────────────────

interface CandidatesTabProps {
  candidates: Record<string, unknown>[];
  isLoading: boolean;
}

export function CandidatesTab({ candidates, isLoading }: CandidatesTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("potentsialNomzodlar1")}</CardTitle>
        <CardDescription>{t("koproqKonikmagaEgaXodimlar")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>{t("xodimlarMalumotlariYoq")}</p>
          </div>
        ) : (
          <div className="divide-y">
            {(Array.isArray(candidates) ? candidates : []).map((c, idx) => (
              <div key={String(c.id ?? idx)} className="p-4" data-testid={`row-candidate-${String(c.id ?? idx)}`}>
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <p className="font-medium">{String(c.full_name ?? "—")}</p>
                    <p className="text-sm text-muted-foreground">
                      {String(c.position ?? "—")} — {String(c.department ?? "—")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <EPStatusPill tone="neutral">{Number(c.skills_count ?? 0)} ko'nikma</EPStatusPill>
                    <Badge variant={Number(c.career_plans_count ?? 0) > 0 ? "default" : "outline"}>
                      {Number(c.career_plans_count ?? 0)} reja
                    </Badge>
                  </div>
                </div>
                {Number(c.skills_count ?? 0) > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t("konikmaDarajasi")}</span>
                      <span>{Math.min(100, Number(c.skills_count ?? 0) * 10)}%</span>
                    </div>
                    <Progress value={Math.min(100, Number(c.skills_count ?? 0) * 10)} className="h-1.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Nine-Box Matrix Tab ──────────────────────────────────────────────────────

interface NineBoxMatrixTabProps {
  candidates: Record<string, unknown>[];
}

export function NineBoxMatrixTab({ candidates }: NineBoxMatrixTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("k9BlokSamaradorlikPotentsialMatritsa")}</CardTitle>
        <CardDescription>{t("xodimlarniPotentsialVaSamaradorlikBoyicha")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(Array.isArray(NINE_BOX) ? NINE_BOX : []).map((block, i) => (
            <div key={`k-${i}`} className={`rounded-md border p-3 ${block.color}`} data-testid={`block-matrix-${i}`}>
              <p className="font-semibold text-sm mb-1">{block.label}</p>
              <p className="text-xs text-muted-foreground">{block.desc}</p>
              {candidates.slice(i * 2, i * 2 + 2).map((c, ci) => (
                <Badge key={ci} variant="outline" className="text-xs mr-1 mt-1">
                  {String(c.full_name ?? "")}
                </Badge>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>{t("pastSamaradorlikYuqoriSamaradorlik")}</span>
          <span>{t("yuqoriPotentsialPastPotentsial")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
