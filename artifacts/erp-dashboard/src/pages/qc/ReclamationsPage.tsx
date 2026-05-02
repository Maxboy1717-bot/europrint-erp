import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Reclamation {
  id: number;
  reclamationNumber: string;
  customerName: string;
  productName: string | null;
  category: string;
  status: "new" | "in_progress" | "resolved" | "rejected";
  priority: "low" | "medium" | "high" | "critical";
  resolutionDays: number | null;
  receivedAt: string;
  resolvedAt: string | null;
}

const STATUS_CONFIG: Record<Reclamation["status"], { label: string; className: string }> = {
  new:         { label: "Yangi",        className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "Jarayonda",    className: "bg-yellow-100 text-yellow-700" },
  resolved:    { label: "Hal qilingan", className: "bg-emerald-100 text-emerald-700" },
  rejected:    { label: "Rad etilgan",  className: "bg-rose-100 text-rose-700" },
};

const PRIORITY_CONFIG: Record<Reclamation["priority"], string> = {
  low:      "bg-slate-100 text-slate-700",
  medium:   "bg-blue-100 text-blue-700",
  high:     "bg-orange-100 text-orange-700",
  critical: "bg-rose-600 text-white",
};

const SLA_RESOLUTION_DAYS = 7;

export default function ReclamationsPage() {
  const { t } = useTranslation('qc');

  const { data, isLoading } = useQuery<{ items: Reclamation[] }>({
    queryKey: ["/api/qc/reclamations"],
    queryFn: () => apiRequest("GET", "/api/qc/reclamations"),
  });

  const items = selectArray<Reclamation>(data, "items");
  const newCount = items.filter((r) => r.status === "new").length;
  const inProgress = items.filter((r) => r.status === "in_progress").length;
  const resolved = items.filter((r) => r.status === "resolved").length;
  const overSla = items.filter(
    (r) => r.resolutionDays !== null && r.resolutionDays > SLA_RESOLUTION_DAYS,
  ).length;

  return (
    <DedicatedPageShell
      title={t('reclamations.title', "Reklamatsiya")}
      description={t('reclamations.description', "Mijoz shikoyatlari va ularni hal qilish (SLA: 7 kun)")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('reclamations.new', "Yangi")} value={newCount} icon={<AlertCircle className="h-4 w-4" />} variant={newCount > 0 ? "warning" : "default"} />
        <KpiCard label={t('reclamations.inProgress', "Jarayonda")} value={inProgress} icon={<Clock className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('reclamations.resolved', "Hal qilingan")} value={resolved} icon={<CheckCircle2 className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('reclamations.overSla', "SLA dan oshgan")} value={overSla} icon={<MessageSquare className="h-4 w-4" />} variant={overSla > 0 ? "danger" : "success"} />
      </div>

      <Section title={t('reclamations.list', "Reklamatsiyalar ro'yxati")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('reclamations.empty', "Reklamatsiya yo'q")}</p>
        ) : (
          <div className="space-y-2">
            {items.map((r) => {
              const sCfg = STATUS_CONFIG[r.status];
              const pCfg = PRIORITY_CONFIG[r.priority];
              const overdue = r.resolutionDays !== null && r.resolutionDays > SLA_RESOLUTION_DAYS;
              return (
                <div key={r.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.reclamationNumber}</span>
                      <span className="text-sm text-muted-foreground">— {r.customerName}</span>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={pCfg}>{r.priority}</Badge>
                      <Badge className={sCfg.className}>{sCfg.label}</Badge>
                      {overdue ? <Badge variant="destructive">SLA</Badge> : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>Mahsulot: <strong>{r.productName ?? '—'}</strong></span>
                    <span>Kategoriya: <strong>{r.category}</strong></span>
                    <span>Qabul: <strong>{new Date(r.receivedAt).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
