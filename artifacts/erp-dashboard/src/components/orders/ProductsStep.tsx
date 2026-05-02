import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormData, Translation, BomHeader, Product } from "./types";

interface ProductsStepProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  t: Translation;
  filteredBoms: Array<{ bom: BomHeader; product: Product }>;
}

export function ProductsStep({
  formData,
  setFormData,
  t,
  filteredBoms,
}: ProductsStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {!formData.productId ? (
        <div className="text-center py-12 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <p className="text-on-surface text-lg font-medium">{t.selectProductFirst}</p>
        </div>
      ) : filteredBoms.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
          <Package className="h-12 w-12 text-on-surface-variant mx-auto mb-4" />
          <p className="text-on-surface text-lg font-medium">{t.noBoms}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Array.isArray(filteredBoms) ? filteredBoms : []).map((item) => (
            <Card
              key={item.bom.id}
              className={cn(
                "cursor-pointer transition-all duration-300 border-2 hover:shadow-md",
                formData.selectedBomId === item.bom.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-outline-variant bg-surface hover:border-primary/50"
              )}
              onClick={() => setFormData({ ...formData, selectedBomId: item.bom.id })}
              data-testid={`card-bom-${item.bom.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-primary">{item.bom.bomNumber}</CardTitle>
                  <Badge className={item.bom.status === "active" ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}>
                    {t[item.bom.status as keyof typeof t] || item.bom.status}
                  </Badge>
                </div>
                <CardDescription className="font-mono text-xs font-bold text-on-surface-variant">
                  {t.bomVersion}: {item.bom.version}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2 text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Bazaviy:</span>
                    <span className="font-bold text-on-surface">{item.bom.baseQuantity} {item.bom.baseUnit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
