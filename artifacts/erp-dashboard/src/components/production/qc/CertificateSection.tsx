/**
 * @module CertificateSection
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, RefreshCw, FileText, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from '@/lib/i18n';

export function CertificateSection() {
  const { t } = useTranslation("common");
  const { data: certList = [], isLoading: certLoading, refetch: refetchCerts } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/qc/certificates"],
    enabled: true,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("mahsulotSertifikatlari")}</h2>
          <p className="text-sm text-muted-foreground">{t("sifatVaMuvofiqlikSertifikatlariReestri")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchCerts()} data-testid="button-refresh-certs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
          </Button>
          <Button data-testid="button-add-cert">
            {t("sertifikatYuklash")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { label: "Faol sertifikatlar", value: certList.length, icon: Award, color: "text-[var(--ep-blue)]" },
          { label: "Muddati o'tayotgan", value: (Array.isArray(certList) ? certList : []).filter(c => (c.daysLeft as number ?? 0) < 30).length, icon: Clock, color: "text-[var(--ep-yellow)]" },
          { label: "Tasdiqlangan", value: (Array.isArray(certList) ? certList : []).filter(c => c.status === "approved").length, icon: CheckCircle, color: "text-[var(--ep-green)]" },
        ]).map(s => (
          <Card key={s.label}><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("sertifikatNomi")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("berilganSana")}</TableHead>
              <TableHead>{t("amalQilishMuddati")}</TableHead>
              <TableHead>{t("holati")}</TableHead>
              <TableHead>{t("fayl")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {certLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : certList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("sertifikatlarTopilmadi")}
                </TableCell></TableRow>
              ) : (Array.isArray(certList) ? certList : []).map((c, i) => (
                <TableRow key={`k-${i}`} data-testid={`row-cert-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{c.name as string}</TableCell>
                  <TableCell>{c.type as string}</TableCell>
                  <TableCell>{c.issueDate ? format(new Date(c.issueDate as string), "dd.MM.yyyy") : "—"}</TableCell>
                  <TableCell>{c.expiryDate ? format(new Date(c.expiryDate as string), "dd.MM.yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status as string}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" data-testid={`button-download-cert-${i}`}><FileText className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
