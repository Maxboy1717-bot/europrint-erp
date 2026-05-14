/**
 * Roll boshqaruv sahifasi — /warehouse/rolls
 * Skanerlash + FIFO navbat + kritik rolllar (50 kg dan kam)
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, QrCode, Plus, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface RollBalance { articleCode: string; count: number; totalKg: number }
interface FifoRoll { rollId: string; receivedDate: string; remainingWeightKg: number; supplierName: string | null }

export default function RollManagementPage() {
  const { t } = useTranslation("common");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filterArticle, setFilterArticle] = useState('');
  const [showScan, setShowScan] = useState(false);
  const [scanForm, setScanForm] = useState({
    rollId: '', articleCode: '', supplierName: '', initialWeightKg: '', warehouseId: '', binLocation: '',
  });

  const balance = useQuery<RollBalance[]>({
    queryKey: ['/api/agents/inventory/rolls'],
    queryFn: () => apiRequest<RollBalance[]>('GET', '/api/agents/inventory/rolls'),
    refetchInterval: 60_000,
  });

  const fifo = useQuery<FifoRoll[]>({
    queryKey: ['/api/agents/inventory/rolls/fifo', filterArticle],
    queryFn: () => apiRequest<FifoRoll[]>('GET', `/api/agents/inventory/rolls/fifo?articleCode=${encodeURIComponent(filterArticle)}`),
    enabled: !!filterArticle,
  });

  const scan = useMutation({
    mutationFn: (data: typeof scanForm) => apiRequest('POST', '/api/agents/inventory/rolls/scan', {
      ...data,
      initialWeightKg: parseFloat(data.initialWeightKg),
    }),
    onSuccess: () => {
      toast({ title: 'Roll qabul qilindi' });
      setShowScan(false);
      setScanForm({ rollId: '', articleCode: '', supplierName: '', initialWeightKg: '', warehouseId: '', binLocation: '' });
      qc.invalidateQueries({ queryKey: ['/api/agents/inventory/rolls'] });
    },
    onError: (e: Error) => toast({ title: 'Xatolik', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-[var(--ep-green)]" />
          <div>
            <h1 className="text-2xl font-bold">{t("rollBoshqaruv")}</h1>
            <p className="text-sm text-muted-foreground">{t("gofrokartonRulonlarFifoSkanerlashQr")}</p>
          </div>
        </div>
        <Button onClick={() => setShowScan(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> {t("yangiRollQabulQilish")}
        </Button>
      </header>

      {/* Roll balansi */}
      <Card className="p-5">
        <h3 className="font-bold text-sm mb-3">Roll qoldiqlari (artikel bo'yicha)</h3>
        {balance.isLoading ? <EPLoader /> :
         (balance.data?.length ?? 0) === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">
            {t("hozirchaRolllarYoqYangiRoll")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase border-b">
              <tr>
                <th className="text-left py-2">{t("artikel")}</th>
                <th className="text-center py-2">{t("dona1")}</th>
                <th className="text-right py-2">{t("jamiOgirlik")}</th>
                <th className="text-center py-2">FIFO</th>
              </tr>
            </thead>
            <tbody>
              {balance.data?.map(b => (
                <tr key={b.articleCode} className="border-b last:border-0">
                  <td className="py-2.5 font-mono">{b.articleCode}</td>
                  <td className="text-center py-2.5 font-bold">{b.count}</td>
                  <td className="text-right py-2.5 font-bold tabular-nums">{b.totalKg.toLocaleString()} kg</td>
                  <td className="text-center py-2.5">
                    <Button size="sm" variant="ghost" onClick={() => setFilterArticle(b.articleCode)}>
                      <Search className="h-3 w-3 mr-1" /> {t("view")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* FIFO navbat */}
      {filterArticle && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">FIFO navbat — {filterArticle}</h3>
            <Button size="sm" variant="ghost" onClick={() => setFilterArticle('')}>X</Button>
          </div>
          {fifo.isLoading ? <EPLoader /> : (
            <div className="space-y-2">
              {fifo.data?.map((r, i) => {
                const isCritical = r.remainingWeightKg < 50;
                const isLow = r.remainingWeightKg < 20;
                return (
                  <div key={r.rollId} className={`p-3 rounded-lg border flex items-center justify-between ${
                    isLow ? 'bg-red-50 border-red-200' : isCritical ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                      <div>
                        <div className="font-mono font-semibold text-sm">{r.rollId}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.supplierName ?? 'Noma\'lum'} · qabul {new Date(r.receivedDate).toLocaleDateString('uz-UZ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-lg font-bold tabular-nums ${isLow ? 'text-[var(--ep-red)]' : isCritical ? 'text-[var(--ep-yellow)]' : 'text-slate-900'}`}>
                        {r.remainingWeightKg} kg
                      </div>
                      {isCritical && <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />}
                      <Button size="sm" variant="ghost"><QrCode className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Skanerlash modal */}
      {showScan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowScan(false)}>
          <Card className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-3">{t("yangiRollQabulQilish")}</h3>
            <div className="space-y-3">
              <Input2 label={t("rollId")} value={scanForm.rollId} onChange={(v) => setScanForm({...scanForm, rollId: v})} placeholder="masalan RL-2026-0042" />
              <Input2 label={t("artikelKodi")} value={scanForm.articleCode} onChange={(v) => setScanForm({...scanForm, articleCode: v})} placeholder="masalan GOFRO-180-B" />
              <Input2 label={t("taminotchiNomi")} value={scanForm.supplierName} onChange={(v) => setScanForm({...scanForm, supplierName: v})} />
              <Input2 label="Boshlang'ich og'irlik (kg) *" value={scanForm.initialWeightKg} onChange={(v) => setScanForm({...scanForm, initialWeightKg: v})} type="number" placeholder="masalan 250" />
              <Input2 label={t("omborId")} value={scanForm.warehouseId} onChange={(v) => setScanForm({...scanForm, warehouseId: v})} />
              <Input2 label="Bin (joy)" value={scanForm.binLocation} onChange={(v) => setScanForm({...scanForm, binLocation: v})} placeholder="masalan A-3-12" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowScan(false)}>{t("cancel")}</Button>
              <Button onClick={() => scan.mutate(scanForm)} disabled={!scanForm.rollId || !scanForm.articleCode || !scanForm.initialWeightKg || scan.isPending}>
                {scan.isPending ? 'Saqlanmoqda...' : 'Qabul qilish'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Input2({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input type={type} className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
             value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
