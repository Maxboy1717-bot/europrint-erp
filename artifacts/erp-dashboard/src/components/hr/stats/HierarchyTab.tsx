/**
 * @module HierarchyTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export function HierarchyTab() {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {t("tashkiliyTuzilma")}
        </CardTitle>
        <CardDescription>
          {t("xodimningTashkiliyZanjiri")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground text-center py-8">
          {t("tashkiliyTuzilmaMalumotlariYuklanmoqda")}
        </div>
      </CardContent>
    </Card>
  );
}
