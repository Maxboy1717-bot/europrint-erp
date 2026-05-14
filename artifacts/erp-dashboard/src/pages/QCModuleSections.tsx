/** @module QCModuleSections @description Section/panel components for the QC Module page: parameter table, recent tests list, and AI analysis card. */

import { Brain, BarChart3, Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n";
import { useStatusBadge, useRiskBadge } from "./QCModuleHelpers";
import type { QcParameter, QcMaterialTest } from "./QCModuleTypes";

import { EPLoader } from "@/components/ep";
// ─── Types ────────────────────────────────────────────────────────────────────

interface TabMeta {
  value: string;
  label: string;
  labelRu: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ─── ParameterTableSection ────────────────────────────────────────────────────

interface ParameterTableSectionProps {
  tab: TabMeta;
  parameters: QcParameter[];
  isLoading: boolean;
  selectedParameterId: string | null;
  onAddParameter: () => void;
  onEditParameter: (param: QcParameter) => void;
  onDeleteParameter: (id: string) => void;
  onToggleControlChart: (id: string) => void;
}

export function ParameterTableSection({
  tab,
  parameters,
  isLoading,
  selectedParameterId,
  onAddParameter,
  onEditParameter,
  onDeleteParameter,
  onToggleControlChart,
}: ParameterTableSectionProps) {
  const { t } = useTranslation("common");
  const { t: tCommon } = useTranslation("common");

  return (
    <Card className="bg-card rounded-lg border-none shadow-none">
      <div className="p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
            <tab.icon className="w-5 h-5 text-primary" />
            {tab.label}
          </div>
          <p className="text-sm text-muted-foreground">{tab.labelRu}</p>
        </div>
        <Button
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2"
          onClick={onAddParameter}
          data-testid={`button-add-parameter-${tab.value}`}
        >
          <Plus className="w-4 h-4" />
          {tCommon("add")}
        </Button>
      </div>

      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <EPLoader className="w-6 h-6" />
          </div>
        ) : parameters.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon("noData")}</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon("code")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon("name")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon("unit")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon("minimum")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon("maximum")}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon("required")}</TableHead>
                <TableHead className="w-24 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map(param => (
                <TableRow
                  key={param.id}
                  className="hover:bg-muted/40 transition-colors border-none"
                  data-testid={`row-param-${param.id}`}
                >
                  <TableCell className="py-3 px-6 font-mono text-xs">{param.code}</TableCell>
                  <TableCell className="py-3 px-6">
                    <div className="font-medium text-foreground">{param.name}</div>
                    {param.nameRu && <div className="text-xs text-muted-foreground">{param.nameRu}</div>}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-muted-foreground">{param.unit || "-"}</TableCell>
                  <TableCell className="py-3 px-6 text-foreground">{param.minValue ?? "-"}</TableCell>
                  <TableCell className="py-3 px-6 text-foreground">{param.maxValue ?? "-"}</TableCell>
                  <TableCell className="py-3 px-6">
                    {param.isRequired ? (
                      <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon("yes")}</Badge>
                    ) : (
                      <Badge className="bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon("no")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-6">
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon" variant="ghost" aria-label={tCommon("edit")}
                            onClick={() => onEditParameter(param)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted"
                            data-testid={`button-edit-param-${param.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tCommon("edit")}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon" variant="ghost" aria-label={t("nazoratGrafigi")}
                            onClick={() => onToggleControlChart(param.id)}
                            className={`h-8 w-8 hover:bg-muted ${selectedParameterId === param.id ? "text-primary" : "text-muted-foreground"}`}
                            data-testid={`button-control-chart-${param.id}`}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("nazoratGrafigi")}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon" variant="ghost" aria-label={tCommon("delete")}
                            onClick={() => onDeleteParameter(param.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            data-testid={`button-delete-param-${param.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tCommon("delete")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>
    </Card>
  );
}

// ─── ControlChartCard ─────────────────────────────────────────────────────────

interface ControlChartCardProps { dataPoints: unknown[] | undefined; }

export function ControlChartCard({ dataPoints }: ControlChartCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="bg-card rounded-lg border-none shadow-none">
      <div className="p-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{t("nazoratGrafigi")}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {Array.isArray(dataPoints) ? `${dataPoints.length} nuqta` : "Yuklanmoqda..."}
        </span>
      </div>
    </Card>
  );
}

// ─── RecentTestsSection ───────────────────────────────────────────────────────

interface RecentTestsSectionProps {
  tests: QcMaterialTest[];
  isLoading: boolean;
  tabValue: string;
  selectedTestId: string | null;
  isAiAnalyzing: boolean;
  onSelectTest: (id: string) => void;
  onAiAnalyze: (id: string) => void;
  titleLabel: string;
}

export function RecentTestsSection({
  tests,
  isLoading,
  tabValue,
  selectedTestId,
  isAiAnalyzing,
  onSelectTest,
  onAiAnalyze,
  titleLabel,
}: RecentTestsSectionProps) {
  const { t: tCommon } = useTranslation("common");
  const { getStatusBadge } = useStatusBadge();
  const { getRiskBadge } = useRiskBadge();

  const filtered = (Array.isArray(tests) ? tests : [])
    .filter(t => t.testCategory === tabValue)
    .slice(0, 5);

  const selectedTest = (Array.isArray(tests) ? tests : []).find(t => t.id === selectedTestId);

  return (
    <div className="space-y-4">
      {/* Recent tests card */}
      <Card className="bg-card rounded-lg border-none shadow-none">
        <div className="p-6 pb-2">
          <div className="font-semibold text-lg text-foreground">{titleLabel}</div>
        </div>
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <EPLoader className="w-5 h-5" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">{tCommon("noData")}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(test => (
                <div
                  key={test.id}
                  className="p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => onSelectTest(test.id)}
                  data-testid={`test-card-${test.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-foreground">{test.batchNumber || "N/A"}</span>
                    {getStatusBadge(test.overallStatus)}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-[var(--ep-green)] font-semibold">✓ {test.passedCount}</span>
                    <span className="text-[var(--ep-yellow)] font-semibold">⚠ {test.warningCount}</span>
                    <span className="text-[var(--ep-red)] font-semibold">✗ {test.failedCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* AI analysis card — shown only when a test is selected */}
      {selectedTestId && (
        <Card className="bg-card rounded-lg border-none shadow-none">
          <div className="p-6 pb-2 flex items-center justify-between">
            <span className="font-semibold text-lg text-foreground">{titleLabel}</span>
            <Button
              size="sm"
              variant="outline"
              className="bg-muted/60 text-foreground hover:bg-muted"
              onClick={() => onAiAnalyze(selectedTestId)}
              disabled={isAiAnalyzing}
              data-testid="button-ai-analyze"
            >
              {isAiAnalyzing ? (
                <EPLoader className="w-4 h-4" />
              ) : (
                <Brain className="w-4 h-4 text-primary" />
              )}
            </Button>
          </div>
          <div className="px-6 pb-6">
            {selectedTest?.aiAnalysis ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="text-sm">{tCommon("priority")}:</span>
                  {getRiskBadge(String((selectedTest.aiAnalysis as Record<string, unknown>)?.riskLevel ?? ""))}
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">{tCommon("notes")}:</span>
                  <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                    {((selectedTest.aiAnalysis as Record<string, string[]> | null)?.recommendations ?? []).map(
                      (rec: string, i: number) => (
                        <li key={`k-${i}`}>{rec}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">{tCommon("noData")}</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
