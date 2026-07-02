/**
 * @module EPDocumentPreview
 * @description Office-style inline document preview (Google-Docs-like): images and
 *   PDFs render inline in the modal (native browser PDF viewer via <iframe>, no extra
 *   dependency needed); other file types fall back to a "preview unavailable, download
 *   instead" panel. The Download action first asks the user for a short justification
 *   (min 5 chars — hujjat-eksport-cheklash, egasi 2026-07-02) and passes it as
 *   `?reason=` to the role-gated `/storage/download/*` backend route (see
 *   storage.controller.ts) — the USER-TYPED reason + role is written to `audit_logs`
 *   server-side for every attempt (allow/deny); a denied attempt surfaces the
 *   backend's message via toast.
 *
 *   Canonical way to preview any stored file (chat attachment, CC document, HR/SD
 *   document, etc.) — pass the existing `/api/storage/...` fileUrl straight through.
 */
import { useState } from "react";
import { X, Download, FileText, FileWarning, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface EPDocumentPreviewProps {
  /** Existing inline view URL, e.g. `msg.fileUrl` (`/api/storage/...`). */
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  onClose: () => void;
}

/** Kamida shu belgi soni — storage.controller.ts DownloadReasonSchema bilan bir xil. */
const MIN_REASON_LENGTH = 5;

/** `/api/storage/foo` → `/api/storage/download/foo?reason=...` — same controller,
 *  role-gated route; the user-typed reason is required server-side for documents. */
function toDownloadUrl(fileUrl: string, reason: string): string {
  const base = fileUrl.includes("/storage/")
    ? fileUrl.replace("/storage/", "/storage/download/")
    : fileUrl;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}reason=${encodeURIComponent(reason)}`;
}

function isPdf(fileUrl: string, fileType?: string): boolean {
  return fileType === "application/pdf" || /\.pdf($|\?)/i.test(fileUrl);
}

function isImage(fileUrl: string, fileType?: string): boolean {
  return !!fileType?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)($|\?)/i.test(fileUrl);
}

export function EPDocumentPreview({ fileUrl, fileName, fileType, onClose }: EPDocumentPreviewProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const pdf = isPdf(fileUrl, fileType);
  const image = isImage(fileUrl, fileType);
  const reasonValid = reason.trim().length >= MIN_REASON_LENGTH;

  const handleDownload = async (userReason: string) => {
    setDownloading(true);
    try {
      const res = await fetch(toDownloadUrl(fileUrl, userReason), { credentials: "include" });
      if (res.status === 403) {
        const body = await res.json().catch(() => null) as { message?: string } | null;
        toast({
          title: t("docPreviewDownloadDeniedTitle", "Yuklab olish rad etildi"),
          description: body?.message ?? t("docPreviewDownloadDeniedDesc", "Sizning rolingiz bu faylni yuklab olishga ruxsat etilmagan"),
          variant: "destructive",
        });
        return;
      }
      if (!res.ok) {
        toast({ title: t("xatolik", "Xatolik"), description: t("docPreviewDownloadFailed", "Faylni yuklab bo'lmadi"), variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName || "fayl";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast({ title: t("xatolik", "Xatolik"), description: t("docPreviewDownloadFailed", "Faylni yuklab bo'lmadi"), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--ep-surface)] rounded-lg shadow-xl border border-[var(--ep-border)] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--ep-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-[var(--ep-blue)] flex-shrink-0" />
            <span className="text-sm font-medium truncate">{fileName || "Hujjat"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => { setReason(""); setReasonOpen(true); }}
              disabled={downloading}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white transition-opacity",
                "bg-[var(--ep-blue)] hover:opacity-90 disabled:opacity-50",
              )}
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Yuklab olish
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {reasonOpen && (
          <div
            className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setReasonOpen(false)}
          >
            <div
              className="bg-[var(--ep-surface)] border border-[var(--ep-border)] rounded-lg shadow-xl w-full max-w-sm p-4 flex flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium">
                {t("docPreviewReasonTitle", "Yuklab olish sababi")}
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                autoFocus
                maxLength={500}
                placeholder={t("docPreviewReasonPlaceholder", "Bu faylni nima uchun yuklab olyapsiz? (kamida 5 belgi)")}
                className="w-full rounded-md border border-[var(--ep-border)] bg-transparent px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ep-blue)]"
              />
              {!reasonValid && reason.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("docPreviewReasonTooShort", "Sabab kamida 5 belgidan iborat bo'lishi kerak")}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setReasonOpen(false)}
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-muted text-muted-foreground"
                >
                  {t("bekorQilish", "Bekor qilish")}
                </button>
                <button
                  onClick={() => {
                    if (!reasonValid) return;
                    setReasonOpen(false);
                    void handleDownload(reason.trim());
                  }}
                  disabled={!reasonValid || downloading}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white transition-opacity",
                    "bg-[var(--ep-blue)] hover:opacity-90 disabled:opacity-50",
                  )}
                >
                  <Download className="w-3.5 h-3.5" />
                  {t("docPreviewDownloadConfirm", "Yuklab olish")}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 bg-muted/20">
          {pdf ? (
            <iframe src={fileUrl} title={fileName || "PDF"} className="w-full h-full border-0" />
          ) : image ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={fileUrl}
                alt={fileName || "Rasm"}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileWarning className="w-10 h-10" />
              <p className="text-sm">{t("docPreviewNoInlineView", "Bu fayl turi uchun ichki ko'rish mavjud emas")}</p>
              <p className="text-xs">{t("docPreviewDownloadInstead", "Ko'rish uchun yuklab oling")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
