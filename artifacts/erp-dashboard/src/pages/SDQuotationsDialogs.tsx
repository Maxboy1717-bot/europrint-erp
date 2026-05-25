/**
 * @module SDQuotationsDialogs
 * @description Confirm dialogs for delete and convert-to-order actions in the
 * SDQuotations page.
 */

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QuotationConfirmDialogsProps {
  confirmDeleteQuotationId: string | null;
  onDeleteOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;

  confirmConvertOrderId: string | null;
  onConvertOpenChange: (open: boolean) => void;
  onConfirmConvert: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotationConfirmDialogs({
  confirmDeleteQuotationId,
  onDeleteOpenChange,
  onConfirmDelete,
  confirmConvertOrderId,
  onConvertOpenChange,
  onConfirmConvert,
}: QuotationConfirmDialogsProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <ConfirmDialog
        open={confirmDeleteQuotationId !== null}
        onOpenChange={(open) => { if (!open) onDeleteOpenChange(false); }}
        title={t("taklifniOchirish")}
        description={t("ushbuTaklifnomaniOchirishniTasdiqlaysizmiBu")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={onConfirmDelete}
      />
      <ConfirmDialog
        open={confirmConvertOrderId !== null}
        onOpenChange={(open) => { if (!open) onConvertOpenChange(false); }}
        title={t("buyurtmagaAylantirish")}
        description={t("buTaklifniSavdoBuyurtmasigaAylantirishni")}
        confirmText="Ha, aylantirish"
        cancelText="Bekor qilish"
        variant="default"
        onConfirm={onConfirmConvert}
      />
    </>
  );
}
