/**
 * @module HierarchyTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export function HierarchyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Tashkiliy tuzilma
        </CardTitle>
        <CardDescription>
          Xodimning tashkiliy zanjiri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground text-center py-8">
          Tashkiliy tuzilma ma'lumotlari yuklanmoqda...
        </div>
      </CardContent>
    </Card>
  );
}
