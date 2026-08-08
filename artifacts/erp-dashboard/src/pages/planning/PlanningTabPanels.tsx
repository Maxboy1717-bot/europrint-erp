/**
 * @module PlanningTabPanels
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TabsContent } from "@/components/ui/tabs";
import {
  Plus, Edit, BarChart3, Play, Package, ShoppingCart, TrendingUp,
} from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import type {
  Equipment, ProductionPlanRow, ProductionFactRow, ScheduleEntry,
  MRPRun, MRPResult, PurchaseRequisition, Product,
} from "./planning-types";

type TFunc = (key: string, params?: Record<string, string | number>) => string;

interface PlanningTabPanelsProps {
  t: TFunc;
  filters: { startDate: string; endDate: string };
  isLoadingSchedule: boolean;
  scheduleData: ScheduleEntry[] | undefined;
  equipmentList: Equipment[];
  productionPlans: ProductionPlanRow[];
  loadingPlans: boolean;
  productionFacts: ProductionFactRow[];
  loadingFacts: boolean;
  mrpRuns: MRPRun[];
  runsLoading: boolean;
  mrpResults: Array<{ result: MRPResult; material: Product }>;
  purchaseRequisitions: PurchaseRequisition[];
  products: Product[];
  onAddPlan: () => void;
  onEditPlan: (plan: ProductionPlanRow) => void;
  onAddFact: () => void;
  onShowRunDialog: () => void;
  onCalculate: (runId: string) => void;
  isCalculating: boolean;
  onViewResults: (run: MRPRun) => void;
}

export function PlanningTabPanels({
  t, filters, isLoadingSchedule, scheduleData, equipmentList,
  productionPlans, loadingPlans, productionFacts, loadingFacts,
  mrpRuns, runsLoading, mrpResults, purchaseRequisitions, products,
  onAddPlan, onEditPlan, onAddFact, onShowRunDialog,
  onCalculate, isCalculating, onViewResults,
}: PlanningTabPanelsProps) {
  const getProductName = (productId: string) => {
    const product = (Array.isArray(products) ? products : []).find((p) => p.id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };
  const pendingRequisitions = (Array.isArray(purchaseRequisitions) ? purchaseRequisitions : []).filter((req) => req.status === 'pending');

  return (
    <>
      <TabsContent value="schedule" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("PlanningBoard.scheduleTab")}</CardTitle>
            <CardDescription>{filters.startDate} - {filters.endDate}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSchedule ? (
              <div className="text-center py-8 text-[13px] text-muted-foreground">{t("PlanningBoard.loading")}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="border rounded-md">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-full sm:w-[200px] sticky left-0 bg-background z-10">{t("workCenter")}</TableHead>
                      {eachDayOfInterval({ start: new Date(filters.startDate), end: new Date(filters.endDate) }).map(date => (
                        <TableHead key={date.toISOString()} className="min-w-[120px] text-center">{format(date, "dd.MM")}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(equipmentList) ? equipmentList : []).filter((e: Equipment) => e.category === "machine").map((machine: Equipment) => (
                      <TableRow key={machine.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">{machine.name}</TableCell>
                        {eachDayOfInterval({ start: new Date(filters.startDate), end: new Date(filters.endDate) }).map(date => {
                          const dateStr = format(date, "yyyy-MM-dd");
                          const daySchedules = scheduleData?.filter((s: ScheduleEntry) => s.equipmentId === machine.id && s.scheduleDate === dateStr) || [];
                          return (
                            <TableCell key={dateStr} className="p-1 border-r h-24">
                              <div className="flex flex-col gap-1">
                                {(Array.isArray(daySchedules) ? daySchedules : []).map((s: ScheduleEntry) => (
                                  <div key={s.id} className={`text-[10px] p-1 rounded border shadow-sm ${s.status === 'fully_booked' ? 'bg-red-100 border-red-200' : s.status === 'partially_booked' ? 'bg-yellow-100 border-yellow-200' : 'bg-green-100 border-green-200'}`}>
                                    <div className="font-bold">{t("PlanningBoard.scheduleShift", { shift: s.shift })}</div>
                                    <div>{t("PlanningBoard.scheduleMinutes", { planned: s.plannedMinutes, total: s.totalCapacityMinutes })}</div>
                                  </div>
                                ))}
                                {daySchedules.length === 0 && (<div className="text-[10px] text-muted-foreground text-center pt-8">-</div>)}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="plans" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>{t("productionPlan")}</CardTitle>
                <CardDescription>{t("PlanningBoard.productionPlanDesc")}</CardDescription>
              </div>
              <Button onClick={onAddPlan} data-testid="button-add-production-plan"><Plus className="h-4 w-4 mr-2" />{t("PlanningBoard.createPlan")}</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (<div className="text-center py-8 text-[13px] text-muted-foreground">{t("PlanningBoard.loading")}</div>
            ) : !productionPlans.length ? (<div className="text-center py-8 text-[13px] text-muted-foreground">{t("noDataFound")}</div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("PlanningBoard.planNumber")}</TableHead>
                    <TableHead>{t("PlanningBoard.date")}</TableHead>
                    <TableHead>{t("workCenter")}</TableHead>
                    <TableHead>{t("shift")}</TableHead>
                    <TableHead>{t("PlanningBoard.typeCol")}</TableHead>
                    <TableHead>{t("PlanningBoard.status")}</TableHead>
                    <TableHead className="text-right">{t("PlanningBoard.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(productionPlans) ? productionPlans : []).map((plan: ProductionPlanRow) => (
                    <TableRow key={plan.id} data-testid={`row-plan-${plan.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{plan.planNumber}</TableCell>
                      <TableCell>{plan.planDate}</TableCell>
                      <TableCell>{plan.workCenterName || "—"}</TableCell>
                      <TableCell>{plan.shift || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan.planType === "daily" ? t("PlanningBoard.planTypeDaily") :
                           plan.planType === "weekly" ? t("PlanningBoard.planTypeWeekly") :
                           t("PlanningBoard.planTypeMonthly")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.status === "completed" ? "default" : plan.status === "in_progress" ? "secondary" : "outline"}>
                          {plan.status === "draft" ? t("PlanningBoard.planStatusDraft") :
                           plan.status === "approved" ? t("PlanningBoard.planStatusApproved") :
                           plan.status === "in_progress" ? t("PlanningBoard.planStatusInProgress") :
                           t("PlanningBoard.planStatusCompleted")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEditPlan(plan)} data-testid={`button-edit-plan-${plan.id}`}><Edit className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="facts" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>{t("PlanningBoard.productionFactTitle")}</CardTitle>
                <CardDescription>{t("PlanningBoard.productionFactDesc")}</CardDescription>
              </div>
              <Button onClick={onAddFact} data-testid="button-add-production-fact"><Plus className="h-4 w-4 mr-2" />{t("PlanningBoard.addFact")}</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingFacts ? (<div className="text-center py-8 text-[13px] text-muted-foreground">{t("PlanningBoard.loading")}</div>
            ) : !productionFacts.length ? (<div className="text-center py-8 text-[13px] text-muted-foreground">{t("noDataFound")}</div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("PlanningBoard.dateCol")}</TableHead>
                    <TableHead>{t("PlanningBoard.shiftCol")}</TableHead>
                    <TableHead>{t("PlanningBoard.workCenterCol")}</TableHead>
                    <TableHead>{t("PlanningBoard.productCol")}</TableHead>
                    <TableHead>{t("PlanningBoard.totalCol")}</TableHead>
                    <TableHead>{t("PlanningBoard.goodCol")}</TableHead>
                    <TableHead>{t("PlanningBoard.scrapCol")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(productionFacts) ? productionFacts : []).map((fact: ProductionFactRow) => (
                    <TableRow key={fact.id} data-testid={`row-fact-${fact.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell>{fact.factDate}</TableCell>
                      <TableCell>{fact.shift || "—"}</TableCell>
                      <TableCell>{fact.workCenterName || "—"}</TableCell>
                      <TableCell>{fact.productName || "—"}</TableCell>
                      <TableCell className="font-medium">{fact.factQuantity}</TableCell>
                      <TableCell className="text-[var(--ep-green)]">{fact.goodQuantity}</TableCell>
                      <TableCell className="text-[var(--ep-red)]">{fact.scrapQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="plan-vs-fact" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("PlanningBoard.planVsFactTab")}</CardTitle>
            <CardDescription>{t("PlanningBoard.planVsFactDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              {t("PlanningBoard.planVsFactChart")}
              <div className="mt-4"><BarChart3 className="h-16 w-16 mx-auto opacity-30" /></div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="mrp" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("PlanningBoard.totalRuns")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold" data-testid="text-total-runs">{mrpRuns.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("PlanningBoard.purchaseReqs")}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-requisitions">{purchaseRequisitions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{pendingRequisitions.length} {t("PlanningBoard.pending")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("PlanningBoard.materialReqs")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold" data-testid="text-total-requirements">{mrpResults.length}</div></CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onShowRunDialog} data-testid="button-create-run"><Plus className="h-4 w-4 mr-2" />{t("PlanningBoard.newMRPRun")}</Button>
        </div>

        {runsLoading ? (
          <Card><CardContent className="p-8"><p className="text-center text-muted-foreground">{t("PlanningBoard.loading")}</p></CardContent></Card>
        ) : mrpRuns.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t("noDataFound")}</p></CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {(Array.isArray(mrpRuns) ? mrpRuns : []).map((run) => (
              <Card key={run.id} className="hover-elevate" data-testid={`card-run-${run.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {run.runName}
                        <Badge variant={run.status === "completed" ? "default" : run.status === "running" ? "secondary" : "outline"} data-testid={`badge-status-${run.id}`}>{run.status}</Badge>
                      </CardTitle>
                      <CardDescription>Planning Horizon: {run.planningHorizon} days</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {run.status === "pending" && (
                        <Button size="sm" onClick={() => onCalculate(run.id)} disabled={isCalculating} data-testid={`button-calculate-${run.id}`}>
                          <Play className="h-4 w-4 mr-2" />{t("PlanningBoard.calculate")}
                        </Button>
                      )}
                      {run.status === "completed" && (
                        <Button size="sm" variant="outline" onClick={() => onViewResults(run)} data-testid={`button-view-${run.id}`}>
                          <Package className="h-4 w-4 mr-2" />{t("PlanningBoard.results")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-muted-foreground">{t("PlanningBoard.products")}</p><p className="font-medium">{run.totalProducts || 0}</p></div>
                    <div><p className="text-muted-foreground">{t("PlanningBoard.requirements")}</p><p className="font-medium">{run.totalRequirements || 0}</p></div>
                    <div><p className="text-muted-foreground">{t("PlanningBoard.shortages")}</p><p className="font-medium text-destructive">{run.totalShortages || 0}</p></div>
                  </div>
                  {run.status === "running" && (
                    <div className="mt-4">
                      <Progress value={50} />
                      <p className="text-sm text-muted-foreground mt-2">{t("PlanningBoard.calculating")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {purchaseRequisitions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t("PlanningBoard.purchaseReqs")}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {purchaseRequisitions.slice(0, 5).map((req) => (
                  <div key={req.id} className="p-3 border rounded-md flex items-center justify-between" data-testid={`card-requisition-${req.id}`}>
                    <div>
                      <p className="font-medium">{req.requisitionNumber}</p>
                      <p className="text-sm text-muted-foreground">{getProductName(req.materialId)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{req.requiredQuantity} units</Badge>
                      <Badge variant={req.status === "approved" ? "default" : "secondary"}>{req.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </>
  );
}