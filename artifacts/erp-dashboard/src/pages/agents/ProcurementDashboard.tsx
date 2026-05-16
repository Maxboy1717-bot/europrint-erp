/**
 * Procurement / Supplier AI Dashboard — /agents/procurement
 */
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ShoppingCart, AlertTriangle, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
interface SupplierScore { supplierId: number; score: number; tier: 'A' | 'B' | 'C' }
interface DeliveryRisk { orderId: string; risk: 'high' | 'medium' | 'low' }

export default function ProcurementDashboard() {
  const { t } = useTranslation('common');
  const scores = useQuery<SupplierScore[]>({
    queryKey: ['/api/agents/supplier/scores'],
    queryFn: () => apiRequest<SupplierScore[]>('GET', '/api/agents/supplier/scores'),
  });

  const risks = useQuery<DeliveryRisk[]>({
    queryKey: ['/api/agents/supplier/risks'],
    queryFn: () => apiRequest<DeliveryRisk[]>('GET', '/api/agents/supplier/risks'),
  });

  const tierColor = (t: string) =>
    t === 'A' ? 'bg-emerald-100 text-emerald-800' : t === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <header className="flex items-center gap-3">
        <ShoppingCart className="h-7 w-7 text-[var(--ep-cyan)]" />
        <div>
          <h1 className="text-2xl font-bold">{t("taminotAi")}</h1>
          <p className="text-sm text-muted-foreground">{t("yetkazibBeruvchilarReytingiYetkazibBerish")}</p>
        </div>
      </header>

      {/* Supplier scoring */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-[var(--ep-yellow)]" />
          <h3 className="font-bold text-sm">{t("yetkazibBeruvchilarReytingi180KunIchida")}</h3>
        </div>
        {scores.isLoading ? <EPLoader /> :
         (scores.data?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Hozircha yetkazib berish ma'lumotlari yo'q (purchase_orders jadval bo'sh)
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase border-b">
              <tr><th className="text-left py-2">{t('supplierId')}</th><th className="text-center py-2">{t("ball")}</th><th className="text-center py-2">{t("reyting")}</th></tr>
            </thead>
            <tbody>
              {scores.data?.map(s => (
                <tr key={s.supplierId} className="border-b last:border-0">
                  <td className="py-2.5 font-mono">#{s.supplierId}</td>
                  <td className="text-center py-2.5 font-bold tabular-nums">{s.score}</td>
                  <td className="text-center py-2.5">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tierColor(s.tier)}`}>
                      {s.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Delivery risks */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
          <h3 className="font-bold text-sm">{t("yetkazibBerishXavfi5KunIchida")}</h3>
        </div>
        {risks.isLoading ? <EPLoader /> :
         (risks.data?.length ?? 0) === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">{t("xavfOstidagiYetkazibBerishYoq")}</div>
        ) : (
          <div className="space-y-2">
            {risks.data?.map(r => (
              <div key={r.orderId} className={`p-3 rounded-lg border flex items-center justify-between ${
                r.risk === 'high' ? 'bg-red-50 border-red-200' : r.risk === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div>
                  <div className="font-mono text-sm">PO #{r.orderId.slice(-12)}</div>
                </div>
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${
                  r.risk === 'high' ? 'bg-red-200 text-red-800' :
                  r.risk === 'medium' ? 'bg-amber-200 text-amber-800' :
                  'bg-blue-200 text-blue-800'
                }`}>{r.risk}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
