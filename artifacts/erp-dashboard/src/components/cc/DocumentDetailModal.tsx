/**
 * Hujjat tafsilotlari modali — light theme.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Printer, FileDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { EPLoader, EPDocumentPreview } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface DocumentDetail {
  id: string;
  documentNumber: string;
  subject: string;
  templateCode: string;
  templateNameUz: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  language: 'uz' | 'ru';
  basketState: string;
  workflowState: string;
  isInboxOverdue: boolean;
  senderName: string | null;
  basketEnteredAt: string;
  createdAt: string;
}

const STATE: Record<string, { uz: string; tone: string }> = {
  draft:       { uz: "Qoralama",       tone: "bg-slate-100 text-slate-700 border-slate-200" },
  sent:        { uz: "Yuborilgan",     tone: "bg-blue-50 text-[var(--ep-blue)] border-blue-200" },
  in_progress: { uz: "Jarayonda",      tone: "bg-amber-50 text-[var(--ep-yellow)] border-amber-200" },
  approved:    { uz: "Tasdiqlangan",   tone: "bg-emerald-50 text-[var(--ep-green)] border-emerald-200" },
  rejected:    { uz: "Rad etilgan",    tone: "bg-red-50 text-[var(--ep-red)] border-red-200" },
  cancelled:   { uz: "Bekor qilingan", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  archived:    { uz: "Arxivlangan",    tone: "bg-slate-100 text-slate-700 border-slate-200" },
};

const PRIORITY: Record<string, { uz: string; tone: string }> = {
  urgent: { uz: "Kritik",   tone: "bg-red-50 text-[var(--ep-red)] border-red-200" },
  high:   { uz: "Yuqori",   tone: "bg-amber-50 text-[var(--ep-yellow)] border-amber-200" },
  normal: { uz: "O'rtacha", tone: "bg-blue-50 text-[var(--ep-blue)] border-blue-200" },
  low:    { uz: "Past",     tone: "bg-slate-50 text-slate-600 border-slate-200" },
};

export function DocumentDetailModal({ documentId, open, onOpenChange }: {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [printReason, setPrintReason] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const docQ = useQuery<DocumentDetail>({
    queryKey: [`/api/cc/baskets/${documentId}`],
    queryFn: () => apiRequest<DocumentDetail>("GET", `/api/cc/baskets/${documentId}`),
    enabled: open,
  });

  const bodyQ = useQuery<{ aiBody: string; senderComment: string | null }>({
    queryKey: [`/api/cc/documents/${documentId}`],
    queryFn: () => apiRequest<{ aiBody: string; senderComment: string | null }>("GET", `/api/cc/documents/${documentId}`),
    enabled: open,
  });

  const doc = docQ.data;

  // Real backend already logs a reason (min 3 chars) to cc_print_log/cc_audit_trail —
  // it just had zero FE callers until now (see cc-workflow.service.ts logPrint()).
  const printMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/cc/documents/${documentId}/print`, { reason: printReason.trim() }),
    onSuccess: () => {
      toast({ title: t("submitBtn") ?? "OK", description: "Chop etish jurnalga yozildi" });
      setPrintReason("");
    },
    onError: () => toast({ title: "Xatolik", description: "Jurnalga yozib bo'lmadi", variant: "destructive" }),
  });

  // Office-style inline PDF preview: fetch the already-built PDF generator (GET
  // /cc/documents/:id/pdf) as a blob so it renders inline via EPDocumentPreview's
  // <iframe> instead of forcing a raw download (the endpoint sets Content-Disposition:
  // attachment, which a direct <a>/window.open would just save to disk).
  const handleViewPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/cc/documents/${documentId}/pdf`, { credentials: "include" });
      if (!res.ok) {
        toast({ title: "Xatolik", description: "PDF yaratib bo'lmadi", variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      setPdfPreviewUrl(URL.createObjectURL(blob));
    } catch {
      toast({ title: "Xatolik", description: "PDF yaratib bo'lmadi", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="sr-only">{t("hujjatTafsilotlari")}</DialogTitle>

          {docQ.isLoading || !doc ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={14} />
              {t("Yuklanmoqda...")}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border">
                  {doc.documentNumber}
                </span>
                <Tag tone={PRIORITY[doc.priority]?.tone ?? PRIORITY.normal.tone}
                     label={PRIORITY[doc.priority]?.uz ?? "Normal"} />
                <Tag tone={STATE[doc.workflowState]?.tone ?? STATE.draft.tone}
                     label={STATE[doc.workflowState]?.uz ?? doc.workflowState} />
                {doc.isInboxOverdue && <Tag tone="bg-red-50 text-[var(--ep-red)] border-red-200" label={t("muddatiOtgan1")} />}
              </div>

              <div className="text-base font-semibold leading-tight">{doc.subject}</div>

              <div className="text-xs mt-2 flex items-center gap-3 text-muted-foreground">
                <span>📤 {doc.senderName ?? "Noma'lum"}</span>
                <span>🕒 {new Date(doc.createdAt).toLocaleString('uz-UZ')}</span>
              </div>
            </>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {bodyQ.isLoading ? (
            <EPLoader className="mx-auto" />
          ) : (
            <div className="space-y-4">
              <Section title="AI tayyorlagan matn" icon={<FileText size={14} />}>
                <pre className="whitespace-pre-wrap text-sm bg-muted/30 border rounded-lg p-3 leading-relaxed font-sans">
                  {bodyQ.data?.aiBody ?? "Matn yuklab bo'lmadi"}
                </pre>
              </Section>

              {bodyQ.data?.senderComment && (
                <Section title={t("yuboruvchiIzohi")}>
                  <div className="bg-amber-50/50 border border-amber-200 text-amber-900 rounded-lg p-3 text-sm">
                    {bodyQ.data.senderComment}
                  </div>
                </Section>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Office-style PDF preview + "print with reason" — backend already built
            (cc-documents.controller.ts GET :id/pdf, POST :id/print), only the FE
            wiring was missing until now. */}
        <div className="p-3 border-t flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleViewPdf()}
            disabled={pdfLoading}
          >
            {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
            PDF ko'rish
          </Button>

          <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
            <Input
              value={printReason}
              onChange={(e) => setPrintReason(e.target.value)}
              placeholder="Chop etish sababi (kamida 3 belgi)"
              className="h-8 text-xs"
              maxLength={2000}
            />
            <Button
              size="sm"
              onClick={() => printMutation.mutate()}
              disabled={printReason.trim().length < 3 || printMutation.isPending}
            >
              {printMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Printer className="w-3.5 h-3.5 mr-1.5" />}
              Chop etish
            </Button>
          </div>
        </div>
      </DialogContent>

      {pdfPreviewUrl && (
        <EPDocumentPreview
          fileUrl={pdfPreviewUrl}
          fileName={`${doc?.documentNumber ?? documentId}.pdf`}
          fileType="application/pdf"
          onClose={() => {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
          }}
        />
      )}
    </Dialog>
  );
}

function Tag({ tone, label }: { tone: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", tone)}>
      {label}
    </span>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}
