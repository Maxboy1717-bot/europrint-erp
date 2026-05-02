import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { statusLabel, statusBadgeClass } from "./helpers";
import { BarcodeItem } from "./types";

interface ScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BarcodeItem | null;
}

export function ScanResultDialog({ open, onOpenChange, result }: ScanDialogProps) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Barcode Ma'lumoti</DialogTitle>
          <DialogDescription className="text-primary font-mono font-bold">
            {result.barcodeId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant">
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-1">Material</p>
            <p className="text-xl font-bold text-on-surface leading-tight">{result.materialName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-1">Miqdor</p>
              <p className="text-2xl font-black text-primary">{result.quantity} <span className="text-sm font-medium text-on-surface-variant">{result.unit}</span></p>
            </div>
            <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-1">Holat</p>
              <Badge variant="outline" className={`mt-1 font-bold ${statusBadgeClass(result.status)}`}>
                {statusLabel(result.status)}
              </Badge>
            </div>
          </div>
          <div className="space-y-3 px-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Ombor:</span>
              <span className="font-bold">{result.warehouseName || "Noma'lum"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Lot:</span>
              <span className="font-bold">{result.lotNumber || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Qabul sanasi:</span>
              <span className="font-bold">{new Date(result.receivedDate).toLocaleDateString("uz-UZ")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
