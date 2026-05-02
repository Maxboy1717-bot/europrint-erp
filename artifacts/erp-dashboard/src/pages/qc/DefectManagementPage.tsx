import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RotateCcw, Trash2, DollarSign } from "lucide-react";

interface DefectRecord {
  id: number;
  defectCode: string;
  productName: string;
  workCenterName: string | null;
  quantity: number;
  unit: string;
  estimatedLossUzs: number;
  decision: "rework" | "scrap" | "downgrade" | "pending";
  rootCause: string | null;
  reportedAt: string;
}

const DECISION_CONFIG: Record<DefectRecord["decision"], { label: string; className: string }> = {
  rework:    { label: "Qayta ishlash", className: "bg-yellow-100 text-yellow-700" },
  scrap:     { label: "Brak",          className: "bg-rose-100 text-rose-700" },
  downgrade: { label: "Pasaytirish",   className: "bg-orange-100 text-orange-700" },
  pending:   { label: "Kutilmoqda",    className: "bg-slate-100 text-slate-700" },
};

export default function DefectManagementPage() {
  const { t } = useTranslation('qc');

  const { data, isLoading } = useQuery<{ items: DefectRecord[] }>({
    queryKey: ["/api/qc/defects/extended"],
    queryFn: () => apiRequest("GET", "/api/qc/defects/extended"),
  });

  const items = selectArray<DefectRecord>(data, "items");
  const reworkCount = items.filter((d) => d.decision === "rework").length;
  const scrapCount = items.filter((d) => d.decision === "scrap").length;
  const totalLoss = items.reduce((s, d) => s + (d.estimatedLossUzs || 0), 0);

  return (
    <DedicatedPageShell
      title={t('defectMgmt.title', "Brak Boshqaruvi")}
      description={t('defectMgmt.description', "Nuqsonlar — qayta ishlash / brak / pasaytirish qarorlari")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('defectMgmt.total', "Jami brak")} value={items.length} icon={<AlertTriangle className="h-4 w-4" />} variant="warning" />
        <KpiCard label={t('defectMgmt.rework', "Qayta ishlash")} value={reworkCount} icon={<RotateCcw className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('defectMgmt.scrap', "Brak")} value={scrapCount} icon={<Trash2 className="h-4 w-4" />} variant="danger" />
        <KpiCard label={t('defectMgmt.loss', "Yo'qotish (UZS)")} value={totalLoss.toLocaleString()} icon={<DollarSign className="h-4 w-4" />} variant="danger" />
      </div>

      <Section title={t('defectMgmt.list', "Brak yozuvlari")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('defectMgmt.empty', "Brak yozuvi yo'q")}</p>
        ) : (
          <div className="space-y-2">
            {items.map((d) => {
              const cfg = DECISION_CONFIG[d.decision];
              return (
                <div key={d.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{d.defectCode}</Badge>
                      <span className="font-medium">{d.productName}</span>
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span>Markaz: <strong>{d.workCenterName ?? '—'}</strong></span>
                    <span>Miqdor: <strong>{d.quantity} {d.unit}</strong></span>
                    <span>Yo'qotish: <strong>{d.estimatedLossUzs.toLocaleString()} UZS</strong></span>
                    <span>Sana: <strong>{new Date(d.reportedAt).toLocaleDateString()}</strong></span>
                  </div>
                  {d.rootCause ? (
                    <p className="text-xs italic mt-2 text-muted-foreground">
                      {t('defectMgmt.rootCause', "Sabab")}: {d.rootCause}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
