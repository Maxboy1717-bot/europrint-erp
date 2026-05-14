/**
 * @module StorageTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { fmtQty, fmtDate, type StorageInfo, type BasicInfo } from "./types";
import { useTranslation } from '@/lib/i18n';

export function StorageTab({ storage, basic }: { storage: StorageInfo; basic: BasicInfo }) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={AlertTriangle} label="30 kun ichida tugaydi" value={String(storage.count30Days || 0)} color={storage.count30Days && storage.count30Days > 0 ? "text-destructive" : "text-[var(--ep-green)]"} />
        <KpiCard icon={Clock} label="60 kun ichida tugaydi" value={String(storage.count60Days || 0)} color={storage.count60Days && storage.count60Days > 0 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-green)]"} />
        <KpiCard icon={CheckCircle} label="FIFO muvofiqlik" value={storage.fifoCompliance ? "Ha" : "Yo'q"} color={storage.fifoCompliance ? "text-[var(--ep-green)]" : "text-destructive"} />
      </div>
      {(storage.expiringBatches || []).length > 0 ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t("muddatiYaqinPartiyalar")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>{(["Partiya №", "Miqdor", "Tugash sanasi", "Qolgan kun", "Urgentlik"]).map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody>
                {storage.expiringBatches?.map(b => (
                  <tr key={b.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs">{b.batchNumber}</td>
                    <td className="px-4 py-2">{fmtQty(b.quantity, basic.unitOfMeasure)}</td>
                    <td className="px-4 py-2">{fmtDate(b.expiryDate)}</td>
                    <td className="px-4 py-2 font-bold">{b.daysLeft ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge className={b.urgency === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"}>
                        {b.urgency === "critical" ? "Kritik" : "Ogohlantirish"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-8 text-center">
          <CheckCircle className="h-8 w-8 text-[var(--ep-green)] mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("muddatiYaqinPartiyalarYoq")}</p>
        </CardContent></Card>
      )}
    </div>
  );
}
