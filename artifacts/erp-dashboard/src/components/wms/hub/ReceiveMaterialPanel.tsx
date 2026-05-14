/**
 * @module ReceiveMaterialPanel
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PackagePlus } from "lucide-react";
import { MaterialCardItem } from "./types";

import { EPLoader } from "@/components/ep";
interface ReceiveFormProps {
  form: {
    materialCardId: string;
    quantity: string;
    actualWeight: string;
    unit: string;
    lotNumber: string;
    purchaseOrderNumber: string;
    pricePerUnit: string;
  };
  materials?: MaterialCardItem[];
  onChange: (updates: Partial<ReceiveFormProps['form']>) => void;
  onReceive: () => void;
  isPending: boolean;
}

export function ReceiveMaterialPanel({ form, materials, onChange, onReceive, isPending }: ReceiveFormProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PackagePlus className="h-4 w-4" />
          Material qabul qilish (Inbound)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Material tanlang</Label>
          <Select
            value={form.materialCardId}
            onValueChange={(val) => onChange({ materialCardId: val })}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Materialni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {materials?.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.name} ({m.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Miqdor</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => onChange({ quantity: e.target.value })}
              data-testid="input-quantity"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Birlik</Label>
            <Select
              value={form.unit}
              onValueChange={(val) => onChange({ unit: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="dona">dona</SelectItem>
                <SelectItem value="metr">metr</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Lot / Partiya</Label>
            <Input
              placeholder="LOT-123"
              value={form.lotNumber}
              onChange={(e) => onChange({ lotNumber: e.target.value })}
              data-testid="input-lot"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Narx (birlik)</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.pricePerUnit}
              onChange={(e) => onChange({ pricePerUnit: e.target.value })}
              data-testid="input-price"
            />
          </div>
        </div>
        <Button
          className="w-full"
          onClick={onReceive}
          disabled={isPending}
          data-testid="button-receive"
        >
          {isPending ? (
            <EPLoader className="mr-1" />
          ) : (
            <PackagePlus className="h-4 w-4 mr-1" />
          )}
          Qabul qilish (avto-barcode + QC_HOLD)
        </Button>
        <p className="text-xs text-muted-foreground">
          Qabul qilinganda GS1-128 barcode avtomatik yaratiladi va material QC_HOLD holatiga tushadi
        </p>
      </CardContent>
    </Card>
  );
}
