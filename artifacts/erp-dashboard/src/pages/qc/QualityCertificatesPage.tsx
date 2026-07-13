/**
 * @module QualityCertificatesPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Award, Download, Calendar, AlertTriangle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const STATUS_LABELS = { active: "Amal qilmoqda", draft: "Loyiha", revoked: "Bekor qilingan" };

function CreateCertificateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [certNumber, setCertNumber]   = useState("");
  const [productName, setProductName] = useState("");
  const [issuedDate, setIssuedDate]   = useState("");
  const [status, setStatus]           = useState<string>("active");
  const [issuedBy, setIssuedBy]       = useState("");
  const [notes, setNotes]             = useState("");

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest<{ id: number }>("POST", "/api/qc/certificates", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/certificates"] });
      toast({ title: "Sertifikat yaratildi" });
      setCertNumber(""); setProductName(""); setIssuedDate("");
      setStatus("active"); setIssuedBy(""); setNotes("");
      onClose();
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  function handleSubmit() {
    if (!certNumber.trim()) {
      toast({ title: "Sertifikat raqami majburiy", variant: "destructive" });
      return;
    }
    const dto: Record<string, unknown> = { certNumber: certNumber.trim(), status };
    if (productName.trim()) dto.productName = productName.trim();
    if (issuedDate)         dto.issuedDate  = issuedDate;
    if (issuedBy.trim())    dto.issuedBy    = issuedBy.trim();
    if (notes.trim())       dto.notes       = notes.trim();
    mutation.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi sifat sertifikati</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Sertifikat raqami *</Label>
            <Input placeholder="QC-2026-001" value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Mahsulot nomi</Label>
            <Input placeholder="Masalan: Gofra quti 5-ply" value={productName}
              onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Berilgan sana</Label>
            <Input type="date" value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Holat</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Beruvchi shaxs</Label>
            <Input placeholder="Masalan: QC bo'lim boshlig'i" value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Izoh</Label>
            <Input placeholder="Qo'shimcha ma'lumot..." value={notes}
              onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit}
            disabled={mutation.isPending || !certNumber.trim()}>
            {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDaysUntilExpiry(expiry: string | null): number | null {
  if (!expiry) return null;
  const diff = new Date(expiry).getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function QualityCertificatesPage() {
  const { t } = useTranslation('qc');
  const [createOpen, setCreateOpen] = useState(false);

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
        <div className="flex justify-end mb-3">
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Yangi sertifikat
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
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
                      <Award className="h-4 w-4 text-[var(--ep-yellow)]" />
                      <span className="font-medium">{c.certNumber}</span>
                      <Badge variant={c.status === "valid" ? "default" : "destructive"}>
                        {c.status}
                      </Badge>
                      {expiringSoonFlag ? (
                        <Badge variant="outline" className="text-[var(--ep-yellow)]">
                          {days} {t('certs.daysLeft', "kun")}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span>{t("mahsulot")}<strong>{c.productName}</strong></span>
                      <span>{t("mijoz")}<strong>{c.customerName ?? '—'}</strong></span>
                      <span>{t("berildi1")} <strong>{c.issueDate}</strong></span>
                      <span>{t("muddati1")}<strong>{c.expiryDate ?? '—'}</strong></span>
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
      <CreateCertificateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </DedicatedPageShell>
  );
}
