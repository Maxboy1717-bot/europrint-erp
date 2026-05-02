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
import { OptimizationResult, Translations } from "./types";

interface AIReservationTabProps {
  t: Translations;
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

export function AIReservationTab({
  t,
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
            {t.aiPanel.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.aiPanel.materialType} *</Label>
            {materialTypes.length > 0 ? (
              <Select
                value={aiForm.materialType}
                onValueChange={(v) => setAiForm({ ...aiForm, materialType: v })}
              >
                <SelectTrigger data-testid="select-ai-material-type">
                  <SelectValue placeholder={t.aiPanel.selectType} />
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
                placeholder={t.aiPanel.materialType}
                data-testid="input-ai-material-type"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.aiPanel.quantity} *</Label>
              <Input
                type="number"
                value={aiForm.requiredQuantity}
                onChange={(e) => setAiForm({ ...aiForm, requiredQuantity: e.target.value })}
                placeholder="0.00"
                data-testid="input-ai-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.aiPanel.unit}</Label>
              <Select value={aiForm.unit} onValueChange={(v) => setAiForm({ ...aiForm, unit: v })}>
                <SelectTrigger data-testid="select-ai-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="m2">m2</SelectItem>
                  <SelectItem value="dona">dona</SelectItem>
                  <SelectItem value="rulon">rulon</SelectItem>
                  <SelectItem value="list">list</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.aiPanel.requiredBy}</Label>
              <Input
                type="date"
                value={aiForm.requiredByDate}
                onChange={(e) => setAiForm({ ...aiForm, requiredByDate: e.target.value })}
                data-testid="input-ai-required-date"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.aiPanel.priority}</Label>
              <Select value={aiForm.priority} onValueChange={(v) => setAiForm({ ...aiForm, priority: v })}>
                <SelectTrigger data-testid="select-ai-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t.priorities.low}</SelectItem>
                  <SelectItem value="normal">{t.priorities.normal}</SelectItem>
                  <SelectItem value="high">{t.priorities.high}</SelectItem>
                  <SelectItem value="urgent">{t.priorities.urgent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.aiPanel.notes}</Label>
            <Textarea
              value={aiForm.notes}
              onChange={(e) => setAiForm({ ...aiForm, notes: e.target.value })}
              placeholder={t.aiPanel.notes}
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
            {t.aiPanel.optimize}
          </Button>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              {t.recommendation.title}
            </div>
            {optimizationResult && (
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="w-3 h-3" />
                {optimizationResult.confidence}% {t.recommendation.confidence}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-[300px]">
          {optimizationResult ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-muted-foreground">{t.recommendation.coverage}</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {optimizationResult.coverage}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-muted-foreground">{t.recommendation.shortage}</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {optimizationResult.shortage} {aiForm.unit}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-muted-foreground">FEFO</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {optimizationResult.confidence}%
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 h-[200px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.recommendation.batch}</TableHead>
                      <TableHead className="text-right">{t.recommendation.takeQty}</TableHead>
                      <TableHead>{t.recommendation.expiry}</TableHead>
                      <TableHead>{t.recommendation.score}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(optimizationResult.allocation) ? optimizationResult.allocation : []).map((item) => (
                      <TableRow key={item.batchId}>
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
                </Table>
              </ScrollArea>

              <div className="pt-4 border-t mt-auto flex gap-3">
                <Button
                  className="flex-1 gap-2"
                  onClick={handleCreateRequest}
                  disabled={createRequestPending}
                  data-testid="button-confirm-ai-request"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t.recommendation.confirm}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => onClearRecommendation?.()} data-testid="button-cancel-ai-recommendation">
                  {t.recommendation.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t.recommendation.noData}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
