import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { fmtQty, fmtDate } from "@/components/wms/helpers";
import { KpiCard } from "@/components/wms/tabs/KpiCard";
import type { StorageData, MaterialBasic } from "@/components/wms/wms-types";

interface StorageTabProps {
  storage: StorageData | null | undefined;
  basic: MaterialBasic;
}

export function StorageTab({ storage, basic }: StorageTabProps) {
  if (!storage) return <div className="text-muted-foreground text-sm py-8 text-center">Saqlash ma'lumotlari yo'q</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={AlertTriangle} label="30 kun ichida tugaydi" value={String(storage.count30Days || 0)} color={(storage.count30Days || 0) > 0 ? "text-destructive" : "text-green-600"} />
        <KpiCard icon={Clock} label="60 kun ichida tugaydi" value={String(storage.count60Days || 0)} color={(storage.count60Days || 0) > 0 ? "text-yellow-600" : "text-green-600"} />
        <KpiCard icon={CheckCircle} label="FIFO muvofiqlik" value={storage.fifoCompliance ? "Ha" : "Yo'q"} color={storage.fifoCompliance ? "text-green-600" : "text-destructive"} />
      </div>
      {(storage.expiringBatches?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Muddati yaqin partiyalar</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>{(["Partiya №", "Miqdor", "Tugash sanasi", "Qolgan kun", "Urgentlik"]).map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(storage.expiringBatches || []).map((b) => (
                    <tr key={b.id} className="border-b hover-elevate">
                      <td className="px-4 py-2 font-mono text-xs">{b.batchNumber}</td>
                      <td className="px-4 py-2">{fmtQty(b.quantity, basic.unitOfMeasure)}</td>
                      <td className="px-4 py-2">{fmtDate(b.expiryDate)}</td>
                      <td className="px-4 py-2 font-bold">{b.daysLeft !== null ? b.daysLeft : "—"}</td>
                      <td className="px-4 py-2">
                        <Badge className={b.urgency === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}>
                          {b.urgency === "critical" ? "Kritik" : "Ogohlantirish"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-8 text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Muddati yaqin partiyalar yo'q</p>
        </CardContent></Card>
      )}
    </div>
  );
}
