import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, Calendar, AlertTriangle } from "lucide-react";

interface QualityCertificate {
  id: number;
  certNumber: string;
  productionOrderId: number | null;
  productName: string;
  customerName: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: "valid" | "expired" | "revoked";
  pdfUrl: string | null;
  testParametersCount: number;
}

const EXPIRY_WARN_DAYS = 30;

function getDaysUntilExpiry(expiry: string | null): number | null {
  if (!expiry) return null;
  const diff = new Date(expiry).getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function QualityCertificatesPage() {
  const { t } = useTranslation('qc');

  const { data, isLoading } = useQuery<{ items: QualityCertificate[] }>({
    queryKey: ["/api/qc/certificates"],
    queryFn: () => apiRequest("GET", "/api/qc/certificates"),
  });

  const items = selectArray<QualityCertificate>(data, "items");
  const valid = items.filter((c) => c.status === "valid").length;
  const expiringSoon = items.filter((c) => {
    const days = getDaysUntilExpiry(c.expiryDate);
    return days !== null && days <= EXPIRY_WARN_DAYS && days > 0;
  }).length;
  const expired = items.filter((c) => c.status === "expired").length;

  return (
    <DedicatedPageShell
      title={t('certs.title', "Sifat Sertifikatlari")}
      description={t('certs.description', "Mahsulot sifat sertifikatlari va ularning amal qilish muddati")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('certs.total', "Jami")} value={items.length} icon={<Award className="h-4 w-4" />} />
        <KpiCard label={t('certs.valid', "Amal qilmoqda")} value={valid} icon={<Award className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('certs.expiringSoon', `${EXPIRY_WARN_DAYS} kunda tugaydi`)} value={expiringSoon} icon={<Calendar className="h-4 w-4" />} variant={expiringSoon > 0 ? "warning" : "default"} />
        <KpiCard label={t('certs.expired', "Muddati o'tgan")} value={expired} icon={<AlertTriangle className="h-4 w-4" />} variant={expired > 0 ? "danger" : "default"} />
      </div>

      <Section title={t('certs.list', "Sertifikatlar")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('certs.empty', "Sertifikat yo'q")}</p>
        ) : (
          <div className="space-y-2">
            {items.map((c) => {
              const days = getDaysUntilExpiry(c.expiryDate);
              const expiringSoonFlag = days !== null && days <= EXPIRY_WARN_DAYS && days > 0;
              return (
                <div key={c.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">{c.certNumber}</span>
                      <Badge variant={c.status === "valid" ? "default" : "destructive"}>
                        {c.status}
                      </Badge>
                      {expiringSoonFlag ? (
                        <Badge variant="outline" className="text-yellow-700">
                          {days} {t('certs.daysLeft', "kun")}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span>Mahsulot: <strong>{c.productName}</strong></span>
                      <span>Mijoz: <strong>{c.customerName ?? '—'}</strong></span>
                      <span>Berildi: <strong>{c.issueDate}</strong></span>
                      <span>Muddati: <strong>{c.expiryDate ?? '—'}</strong></span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('certs.parameters', "Parametrlar")}: {c.testParametersCount} ta
                    </p>
                  </div>
                  {c.pdfUrl ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </a>
                    </Button>
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
