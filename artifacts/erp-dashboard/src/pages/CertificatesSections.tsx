/**
 * @module CertificatesSections
 * @description Table section listing all issued certificates.
 */

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Certificate } from "./CertificatesTypes";
import { useTranslation } from '@/lib/i18n';

interface CertificateTableProps {
  certificates: Certificate[];
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}

export function CertificateTable({
  certificates,
  onDownload,
  onDelete,
  isDeletePending,
}: CertificateTableProps) {
  const { t } = useTranslation("common");
  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-medium">
        {t("haliSertifikatBerilmagan")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="ep-table-scroll"><Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 rounded-tl-lg">
              {t("sertifikat1")}
            </TableHead>
            <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
              {t("xodim1")}
            </TableHead>
            <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
              {t("kurs")}
            </TableHead>
            <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
              {t("ball")}
            </TableHead>
            <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
              {t("bonus")}
            </TableHead>
            <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
              {t("berilganSana1")}
            </TableHead>
            <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right rounded-tr-lg">
              {t("Amallar")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(certificates) ? certificates : []).map(cert => (
            <TableRow
              key={cert.id}
              className="hover:bg-muted/40 transition-colors border-border"
            >
              <TableCell className="font-mono text-sm px-6 text-primary font-semibold">
                {cert.certificateNumber}
              </TableCell>
              <TableCell className="px-6">
                <div>
                  <div className="font-bold text-foreground">{cert.userName}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-tighter">
                    {cert.userEmployeeId}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6">
                <div>
                  <div className="text-foreground font-medium">{cert.courseName}</div>
                  <div className="text-xs text-muted-foreground">{cert.courseCode}</div>
                </div>
              </TableCell>
              <TableCell className="px-6 text-foreground">
                <span className="font-bold text-lg">{cert.score ? `${cert.score}%` : "—"}</span>
              </TableCell>
              <TableCell className="px-6">
                {cert.bonusAmount ? (
                  <span className="text-[var(--ep-green)] font-bold">
                    {cert.bonusAmount.toLocaleString()}{" "}
                    <span className="text-[10px] uppercase">{t("som")}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="px-6 text-foreground font-medium">
                {new Date(cert.issuedAt).toLocaleDateString("uz-UZ")}
              </TableCell>
              <TableCell className="px-6 text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDownload(cert.id)}
                    data-testid={`button-download-${cert.id}`}
                    className="text-primary hover:text-primary-dim"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {t("download")}
                  </Button>
                  <DeleteConfirmDialog
                    title={t("sertifikatniOchirishniTasdiqlaysizmi")}
                    description={t("sertifikatButunlayOchiriladi")}
                    onConfirm={() => onDelete(cert.id)}
                    isPending={isDeletePending}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></div>
    </div>
  );
}
