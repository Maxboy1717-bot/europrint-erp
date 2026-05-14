/**
 * @module PageLoader
 * @description React UI component.
 */

;

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
export function PageLoader() {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] gap-3" data-testid="page-loader">
      <EPLoader className="w-8 h-8" />
      <p className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</p>
    </div>
  );
}
