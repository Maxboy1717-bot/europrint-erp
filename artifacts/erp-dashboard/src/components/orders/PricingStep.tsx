import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormData, Translation, MaterialCalculation } from "./types";

interface PricingStepProps {
  formData: FormData;
  t: Translation;
  materialCalculations: MaterialCalculation[];
}

export function PricingStep({
  formData,
  t,
  materialCalculations,
}: PricingStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {!formData.selectedBomId ? (
         <div className="text-center py-12 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
           <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
           <p className="text-on-surface text-lg font-medium">{t.noBomSelected}</p>
         </div>
      ) : (
        <div className="rounded-xl border border-outline-variant overflow-hidden">
          <Table>
            <TableHeader className="bg-surface-container-low">
              <TableRow className="border-outline-variant hover:bg-transparent">
                <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t.material}</TableHead>
                <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">{t.baseQty}</TableHead>
                <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">{t.scrap}</TableHead>
                <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">{t.required}</TableHead>
                <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(materialCalculations) ? materialCalculations : []).map((calc) => (
                <TableRow key={calc.componentId} className="border-outline-variant hover:bg-surface-container-low/50">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">{calc.componentName}</span>
                      <span className="text-xs text-on-surface-variant font-mono">{calc.componentCode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4 font-medium">{calc.baseQuantity} {calc.unit}</TableCell>
                  <TableCell className="text-right py-4 text-on-surface-variant">{calc.scrapPercentage}%</TableCell>
                  <TableCell className="text-right py-4 font-bold text-primary">{calc.requiredQuantity.toLocaleString()} {calc.unit}</TableCell>
                  <TableCell className="py-4">
                    <Badge className={cn(
                      "rounded-full border-none px-3",
                      calc.status === "sufficient" ? "bg-primary text-white" : "bg-red-500 text-white"
                    )}>
                      {t[calc.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
