/**
 * @module CountDetailHeader
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Sparkles, Save, Check, CheckCircle, Download } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { InventoryCountData, STATUS_COLORS } from "./types";
import { useInventoryCountTranslations } from "./useInventoryCountTranslations";

interface CountDetailHeaderProps {
  countDetail: InventoryCountData | undefined;
  onBack: () => void;
  onStatusChange: (status: string) => void;
  onGenerateLines: () => void;
  onSaveAllLines: () => void;
  onExport: () => void;
  isGeneratingLines: boolean;
  hasLineUpdates: boolean;
}

export function CountDetailHeader({
  countDetail,
  onBack,
  onStatusChange,
  onGenerateLines,
  onSaveAllLines,
  onExport,
  isGeneratingLines,
  hasLineUpdates,
}: CountDetailHeaderProps) {
  const { language, setLanguage } = useLanguage();
  const t = useInventoryCountTranslations();

  if (!countDetail) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.actions.back}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.detail.title}</h1>
            <p className="text-muted-foreground">
              {countDetail.countNumber} - {countDetail.countDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLanguage(language === "uz" ? "ru" : "uz")} data-testid="button-lang-toggle">
            {language === "uz" ? "RU" : "UZ"}
          </Button>
          {countDetail.status === "planned" && (
            <Button onClick={() => onStatusChange("in_progress")} data-testid="button-start-count">
              <Play className="w-4 h-4 mr-2" />
              {t.actions.start}
            </Button>
          )}
          {countDetail.status === "in_progress" && (
            <>
              <Button
                variant="outline"
                onClick={onGenerateLines}
                disabled={isGeneratingLines}
                data-testid="button-generate-lines"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t.actions.generateLines}
              </Button>
              <Button
                variant="outline"
                onClick={onSaveAllLines}
                disabled={!hasLineUpdates}
                data-testid="button-save-all"
              >
                <Save className="w-4 h-4 mr-2" />
                {t.actions.saveAll}
              </Button>
              <Button onClick={() => onStatusChange("completed")} data-testid="button-complete-count">
                <Check className="w-4 h-4 mr-2" />
                {t.actions.complete}
              </Button>
            </>
          )}
          {countDetail.status === "completed" && (
            <Button onClick={() => onStatusChange("approved")} data-testid="button-approve-count">
              <CheckCircle className="w-4 h-4 mr-2" />
              {t.actions.approve}
            </Button>
          )}
          <Button variant="outline" onClick={onExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            {t.actions.export}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.table.warehouse}</p>
              <p className="font-medium">{countDetail.warehouseName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.table.type}</p>
              <p className="font-medium">{t.countTypes[countDetail.countType as keyof typeof t.countTypes] || countDetail.countType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.table.status}</p>
              <Badge className={STATUS_COLORS[countDetail.status || "planned"]}>
                {t.statuses[countDetail.status as keyof typeof t.statuses] || countDetail.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.form.assignedTo}</p>
              <p className="font-medium">{countDetail.assignedToName || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
