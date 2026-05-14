/**
 * @module ReviewStep
 * @description React UI component.
 */

import { AlertTriangle } from "lucide-react";
import { FormData, Translation, BomHeader, Product } from "./types";

interface ReviewStepProps {
  formData: FormData;
  t: Translation;
  selectedBom: { bom: BomHeader; product: Product } | null;
  insufficientCount: number;
}

export function ReviewStep({
  formData,
  t,
  selectedBom,
  insufficientCount,
}: ReviewStepProps) {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">{t.orderSummary}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 text-sm">
            <span className="text-muted-foreground">{t.papkaNo}:</span>
            <span className="font-bold text-foreground">{formData.papkaNo || t.autoGenerate}</span>
            
            <span className="text-muted-foreground">{t.customer}:</span>
            <span className="font-bold text-foreground">{formData.mijozNomi}</span>
            
            <span className="text-muted-foreground">{t.product}:</span>
            <span className="font-bold text-foreground">{formData.mahsulotNomi}</span>
            
            <span className="text-muted-foreground">{t.quantity}:</span>
            <span className="font-bold text-primary text-lg">{formData.tiraj.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">{t.bomSelected}</h3>
          {selectedBom ? (
            <div className="p-4 bg-muted/40 rounded-xl border border-border">
              <div className="text-primary font-bold text-lg">{selectedBom.bom.bomNumber}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.bomVersion}: {selectedBom.bom.version}</div>
            </div>
          ) : (
            <div className="text-muted-foreground italic">{t.noBomSelected}</div>
          )}
        </div>
      </div>

      {insufficientCount > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-[var(--ep-red)] shrink-0" />
          <div>
            <p className="text-[var(--ep-red)] font-bold">{t.insufficientMaterials}</p>
            <p className="text-[var(--ep-red)]/80 text-sm mt-1">Ba'zi materiallar yetarli emas. Shunga qaramasdan buyurtma yaratmoqchimisiz?</p>
          </div>
        </div>
      )}
    </div>
  );
}
