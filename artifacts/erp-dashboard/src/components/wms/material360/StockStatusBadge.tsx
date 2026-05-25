/**
 * @module StockStatusBadge
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/lib/i18n';

export function StockStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("common");
  if (status === "zero") return <Badge className="bg-gray-800 text-gray-100">{t("tugagan")}</Badge>;
  if (status === "critical") return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{t("kritik")}</Badge>;
  if (status === "low") return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t("kam")}</Badge>;
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t("normal")}</Badge>;
}
