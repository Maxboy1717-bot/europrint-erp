/**
 * @module OffboardingSection
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserX, FileText, CheckCircle2 } from "lucide-react";
import { ChecklistItem } from "./types";

import { useTranslation } from '@/lib/i18n';
interface OffboardingSectionProps {
  offboardingChecklists: ChecklistItem[];
}

export function OffboardingSection({offboardingChecklists = [],
}: OffboardingSectionProps) {
  const { t } = useTranslation('common');
  const safeOffboarding = Array.isArray(offboardingChecklists) ? offboardingChecklists : [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("offboardingVaBoshatish")}</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Jarayondagilar", v: safeOffboarding.length, c: "text-[var(--ep-blue)]", i: UserX },
          { l: "Bu oy bo'shatilgan", v: "12", c: "text-[var(--ep-green)]", i: CheckCircle2 },
          { l: "O'rtacha muddat", v: "14 kun", c: "text-[var(--ep-primary)]", i: FileText },
          { l: "Exit-intervyu", v: "92%", c: "text-primary", i: FileText },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3 flex items-start justify-between">
            <div>
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            </div>
            <s.i className={`h-5 w-5 ${s.c} mt-1`} />
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("faolOffboardingJarayonlari")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("xodim1")}</TableHead><TableHead>{t("bolim1")}</TableHead>
              <TableHead>{t("date")}</TableHead><TableHead>{t("checklist")}</TableHead>
              <TableHead>{t("status28")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {safeOffboarding.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">{t("faolOffboardingJarayonlariYoq")}</TableCell></TableRow>
              ) : safeOffboarding.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{item.fullName || `Xodim #${item.userId}`}</TableCell>
                  <TableCell className="text-muted-foreground">{t('marketing')}</TableCell>
                  <TableCell>20.10.2023</TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-muted rounded overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.round(((item.completedItems || 0) / (item.totalItems || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs">{item.completedItems || 0}/{item.totalItems || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{t("inProgress")}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
