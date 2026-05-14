/**
 * @module ProductionCompletePanel
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory } from "lucide-react";

import { EPLoader } from "@/components/ep";
interface ProductionCompleteProps {
  form: {
    consumptionId: string;
    usedQty: string;
    wasteQty: string;
    returnQty: string;
  };
  onChange: (updates: Partial<ProductionCompleteProps['form']>) => void;
  onComplete: () => void;
  isPending: boolean;
}

export function ProductionCompletePanel({ form, onChange, onComplete, isPending }: ProductionCompleteProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Factory className="h-4 w-4" />
          Ishlab chiqarish yakunlash
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Sarflash ID</Label>
            <Input
              type="number"
              placeholder="ID"
              value={form.consumptionId}
              onChange={(e) => onChange({ consumptionId: e.target.value })}
              data-testid="input-consumption-id"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ishlatildi (kg)</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.usedQty}
              onChange={(e) => onChange({ usedQty: e.target.value })}
              data-testid="input-used-qty"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Chiqindi (kg)</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.wasteQty}
              onChange={(e) => onChange({ wasteQty: e.target.value })}
              data-testid="input-waste-qty"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Qaytarish (kg)</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.returnQty}
              onChange={(e) => onChange({ returnQty: e.target.value })}
              data-testid="input-return-qty"
            />
          </div>
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={onComplete}
          disabled={isPending}
          data-testid="button-complete"
        >
          {isPending ? (
            <EPLoader className="mr-1" />
          ) : (
            <Factory className="h-4 w-4 mr-1" />
          )}
          Yakunlash (0.5 kg tolerans)
        </Button>
        <p className="text-xs text-muted-foreground">
          Farq 0.5 kg dan oshsa avtomatik qarz yoziladi
        </p>
      </CardContent>
    </Card>
  );
}
