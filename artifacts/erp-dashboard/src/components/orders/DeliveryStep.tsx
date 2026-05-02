import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Warehouse, Factory } from "lucide-react";
import { Translation, MaterialCalculation } from "./types";

interface DeliveryStepProps {
  t: Translation;
  materialCalculations: MaterialCalculation[];
  sufficientCount: number;
  insufficientCount: number;
  estimatedProductionTime: number | null;
}

export function DeliveryStep({
  t,
  materialCalculations,
  sufficientCount,
  insufficientCount,
  estimatedProductionTime,
}: DeliveryStepProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-surface-container-low border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              {t.materialsSummary}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl">
              <span className="text-on-surface-variant">{t.totalMaterials}</span>
              <span className="text-2xl font-bold text-on-surface">{materialCalculations.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">{t.sufficientMaterials}</span>
                <div className="text-2xl font-bold text-primary mt-1">{sufficientCount}</div>
              </div>
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-500">{t.insufficientMaterials}</span>
                <div className="text-2xl font-bold text-red-500 mt-1">{insufficientCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              {t.estimatedTime}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            {estimatedProductionTime ? (
              <div className="text-center">
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {Math.ceil(estimatedProductionTime / 60)}
                </div>
                <div className="text-lg font-medium text-on-surface-variant mt-2 uppercase tracking-widest">{t.hours}</div>
              </div>
            ) : (
              <div className="text-on-surface-variant italic">{t.noRouting}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
