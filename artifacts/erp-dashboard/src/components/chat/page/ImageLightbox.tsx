/**
 * @module ImageLightbox
 * @description React UI component.
 */

import { useEffect } from "react";
import { X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

/** `/api/storage/foo` → `/api/storage/download/foo` — role-gated force-download route
 *  (see storage.controller.ts); every attempt is reason-logged server-side. */
function toDownloadUrl(src: string): string {
  return src.includes("/storage/") ? src.replace("/storage/", "/storage/download/") : src;
}

export function ImageLightbox({ src, alt, onClose }: Props) {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const res = await fetch(toDownloadUrl(src), { credentials: "include" });
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
      a.download = alt || "rasm";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast({ title: t("xatolik", "Xatolik"), description: t("docPreviewDownloadFailed", "Faylni yuklab bo'lmadi"), variant: "destructive" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt || "Rasm"}
          className="max-w-full max-h-[85vh] rounded-lg object-contain"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); void handleDownload(); }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
