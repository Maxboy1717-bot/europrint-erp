/**
 * @module AIReservationTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sparkles, Zap, ShieldCheck, TrendingUp, Send, CheckCircle, AlertTriangle, Clock,
} from "lucide-react";
import { OptimizationResult, TFunc } from "./types";
interface AIReservationTabProps {
  t: TFunc;
  aiForm: {
    materialType: string;
    requiredQuantity: string;
    unit: string;
    requiredByDate: string;
    priority: string;
    notes: string;
  };
  setAiForm: (form: { materialType: string; requiredQuantity: string; unit: string; requiredByDate: string; priority: string; notes: string }) => void;
  materialTypes: string[];
  handleOptimize: () => void;
  optimizePending: boolean;
  optimizationResult: OptimizationResult | null;
  handleCreateRequest: () => void;
  createRequestPending: boolean;
  GRADE_COLORS: Record<string, string>;
  onClearRecommendation?: () => void;
}

export function AIReservationTab({t,
  aiForm,
  setAiForm,
  materialTypes,
  handleOptimize,
  optimizePending,
  optimizationResult,
  handleCreateRequest,
  createRequestPending,
  GRADE_COLORS,
  onClearRecommendation,
}: AIReservationTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t("Reservation.aiPanelTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
          <Label>{t("materialType")} *</Label>
            {materialTypes.length > 0 ? (
              <Select
                value={aiForm.materialType}
                onValueChange={(v) => setAiForm({ ...aiForm, materialType: v })}
              >
                <SelectTrigger data-testid="select-ai-material-type" className="h-9">
                  <SelectValue placeholder={t("Reservation.aiPanelSelectType")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(materialTypes) ? materialTypes : []).map((mt) => (
                    <SelectItem key={mt} value={mt}>
                      {mt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={aiForm.materialType}
                onChange={(e) => setAiForm({ ...aiForm, materialType: e.target.value })}
                placeholder={t("materialType")}
                data-testid="input-ai-material-type"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("quantity")} *</Label>
              <Input
                type="number"
                value={aiForm.requiredQuantity}
                onChange={(e) => setAiForm({ ...aiForm, requiredQuantity: e.target.value })}
                placeholder="0.00"
                data-testid="input-ai-quantity"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("Reservation.aiPanelUnit")}</Label>
              <Select value={aiForm.unit} onValueChange={(v) => setAiForm({ ...aiForm, unit: v })}>
                <SelectTrigger data-testid="select-ai-unit" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="m2">m2</SelectItem>
                  <SelectItem value="dona">dona</SelectItem>
                  <SelectItem value="rulon">rulon</SelectItem>
                  <SelectItem value="list">{"list"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("Reservation.aiPanelRequiredBy")}</Label>
              <Input
                type="date"
                value={aiForm.requiredByDate}
                onChange={(e) => setAiForm({ ...aiForm, requiredByDate: e.target.value })}
                data-testid="input-ai-required-date"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("Reservation.aiPanelPriority")}</Label>
              <Select value={aiForm.priority} onValueChange={(v) => setAiForm({ ...aiForm, priority: v })}>
                <SelectTrigger data-testid="select-ai-priority" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("Reservation.priorityLow")}</SelectItem>
                  <SelectItem value="normal">{t("Reservation.priorityNormal")}</SelectItem>
                  <SelectItem value="high">{t("Reservation.priorityHigh")}</SelectItem>
                  <SelectItem value="urgent">{t("Reservation.priorityUrgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
          <Label>{t("Reservation.aiPanelNotes")}</Label>
            <Textarea
              value={aiForm.notes}
              onChange={(e) => setAiForm({ ...aiForm, notes: e.target.value })}
              placeholder={t("Reservation.aiPanelNotes")}
              data-testid="textarea-ai-notes"
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleOptimize}
            disabled={optimizePending || !aiForm.materialType || !aiForm.requiredQuantity}
            data-testid="button-ai-optimize"
          >
            <Zap className="w-4 h-4" />
            {t("Reservation.aiPanelOptimize")}
          </Button>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--ep-green)]" />
              {t("Reservation.recommendationTitle")}
            </div>
            {optimizationResult && (
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="w-3 h-3" />
                {optimizationResult.confidence}% {t("Reservation.recommendationConfidence")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-[300px]">
          {optimizationResult ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-muted-foreground">{t("Reservation.recommendationCoverage")}</p>
                  <p className="text-lg font-bold text-[var(--ep-blue)] dark:text-blue-400">
                    {optimizationResult.coverage}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-muted-foreground">{t("Reservation.recommendationShortage")}</p>
                  <p className="text-lg font-bold text-[var(--ep-primary)] dark:text-orange-400">
                    {optimizationResult.shortage} {aiForm.unit}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-muted-foreground">FEFO</p>
                  <p className="text-lg font-bold text-[var(--ep-green)] dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {optimizationResult.confidence}%
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 h-[200px] border rounded-md">
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Reservation.recommendationBatch")}</TableHead>
                      <TableHead className="text-right">{t("Reservation.recommendationTakeQty")}</TableHead>
                      <TableHead>{t("Reservation.recommendationExpiry")}</TableHead>
                      <TableHead>{t("Reservation.recommendationScore")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(optimizationResult.allocation) ? optimizationResult.allocation : []).map((item) => (
                      <TableRow key={item.batchId} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{item.batchNumber}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {aiForm.unit}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={GRADE_COLORS[item.qualityGrade || "A"]}>
                            {item.score}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </ScrollArea>

              <div className="pt-4 border-t mt-auto flex gap-3">
                <Button
                  className="flex-1 gap-2"
                  onClick={handleCreateRequest}
                  disabled={createRequestPending}
                  data-testid="button-confirm-ai-request"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t("Reservation.recommendationConfirm")}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => onClearRecommendation?.()} data-testid="button-cancel-ai-recommendation">
                  {t("Reservation.recommendationCancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("Reservation.recommendationNoData")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
