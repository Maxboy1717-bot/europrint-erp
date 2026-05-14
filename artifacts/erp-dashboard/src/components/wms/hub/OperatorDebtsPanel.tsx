/**
 * @module OperatorDebtsPanel
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { OperatorDebt } from "./types";
import { useTranslation } from '@/lib/i18n';

interface OperatorDebtsProps {
  count: number;
  debts: OperatorDebt[];
}

export function OperatorDebtsPanel({ count, debts }: OperatorDebtsProps) {
  const { t } = useTranslation("common");
  const openDebts = (Array.isArray(debts) ? debts : []).filter(d => d.status === "open");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Operator qarzlari (0.5 kg tolerans)
          {count > 0 && <Badge variant="destructive">{count}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {openDebts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("ochiqQarzYoq")}
          </p>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(openDebts) ? openDebts : []).map((debt) => (
              <div key={debt.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50" data-testid={`debt-${debt.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{debt.operatorName}</div>
                  <div className="text-xs text-muted-foreground">
                    {debt.materialName} | Farq: {debt.variance} kg
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {debt.variance > 0 ? "+" : ""}{debt.variance} kg
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
