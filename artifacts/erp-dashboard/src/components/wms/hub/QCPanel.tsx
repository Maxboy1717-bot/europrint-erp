import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { BarcodeItem } from "./types";

interface QCProps {
  count: number;
  items: BarcodeItem[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isPending: boolean;
}

export function QCPanel({ count, items, onApprove, onReject, isPending }: QCProps) {
  const qcItems = (Array.isArray(items) ? items : []).filter(b => b.status === "QC_HOLD");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Sifat nazorati (QC)
          {count > 0 && <Badge variant="secondary">{count}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {qcItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            QC kutayotgan material yo'q
          </p>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(qcItems) ? qcItems : []).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50" data-testid={`qc-item-${b.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{b.materialName}</div>
                  <div className="text-xs text-muted-foreground">{b.quantity} {b.unit} | {b.barcodeId}</div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => onApprove(b.id)}
                    disabled={isPending}
                    data-testid={`button-qc-approve-${b.id}`}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Tasdiqlash
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(b.id)}
                    disabled={isPending}
                    data-testid={`button-qc-reject-${b.id}`}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
