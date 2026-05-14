/**
 * @module RemainingTabsDisciplineExtras
 * @description Sub-cards for the DisciplineTab: customer complaints and
 * assessment-skip records.  Kept in a separate file so that
 * RemainingTabsDiscipline.tsx stays under 300 lines.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquareWarning, ClipboardX } from "lucide-react";
import type { CustomerComplaint, AssessmentSkipRecord } from "./profile-types";
import { COMPLAINT_TYPE_LABELS, SEVERITY_LABELS, STATUS_LABELS } from "./RemainingTabsTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// CustomerComplaintsCard
// ---------------------------------------------------------------------------

interface CustomerComplaintsCardProps {
  customerComplaints?: CustomerComplaint[];
  loadingComplaints?: boolean;
}

export function CustomerComplaintsCard({ customerComplaints, loadingComplaints }: CustomerComplaintsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-[var(--ep-primary)]" />
          {t("mijozShikoyatlari")}
        </CardTitle>
        <CardDescription>{t("ushbuXodimBilanBogliqMijoz")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingComplaints ? (
          <div className="space-y-2">
            {([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 rounded-lg" />)}
          </div>
        ) : customerComplaints && customerComplaints.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("mijoz1")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("darajasi")}</TableHead>
                <TableHead>{t("holati")}</TableHead>
                <TableHead>{t("progress.description")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(customerComplaints) ? customerComplaints : []).map((complaint) => {
                const sev = SEVERITY_LABELS[complaint.severity] ?? { label: complaint.severity, className: "" };
                const st  = STATUS_LABELS[complaint.status]    ?? { label: complaint.status,   variant: "outline" as const };
                return (
                  <TableRow key={complaint.id} data-testid={`row-complaint-${complaint.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(complaint.createdAt).toLocaleDateString('uz-UZ')}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{complaint.customerName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {COMPLAINT_TYPE_LABELS[complaint.complaintType] || complaint.complaintType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${sev.className}`}>{sev.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">
                      {complaint.description}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        ) : (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <MessageSquareWarning className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">{t("mijozShikoyatlariTopilmadi")}</p>
            <p className="text-xs opacity-60 mt-1">{t("ushbuXodimBilanBogliqShikoyat")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AssessmentSkipsCard
// ---------------------------------------------------------------------------

interface AssessmentSkipsCardProps {
  assessmentSkips?: AssessmentSkipRecord[];
  loadingSkips?: boolean;
}

export function AssessmentSkipsCard({ assessmentSkips, loadingSkips }: AssessmentSkipsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardX className="h-5 w-5 text-[var(--ep-red)]" />
          {t("baholashOtkazibYuborishlar")}
        </CardTitle>
        <CardDescription>{t("k360BaholashVaAttestatsiyalarniOtkazib")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingSkips ? (
          <div className="space-y-2">
            {([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 rounded-lg" />)}
          </div>
        ) : assessmentSkips && assessmentSkips.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("period")}</TableHead>
                <TableHead>{t("kutilganSana")}</TableHead>
                <TableHead>{t("sabab")}</TableHead>
                <TableHead>{t("kimTomonidan")}</TableHead>
                <TableHead>{t("holati")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(assessmentSkips) ? assessmentSkips : []).map((skip) => (
                <TableRow key={skip.id} data-testid={`row-skip-${skip.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">
                    {skip.periodYear}-{String(skip.periodMonth).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(skip.expectedDate).toLocaleDateString('uz-UZ')}
                  </TableCell>
                  <TableCell className="text-sm max-w-[180px] truncate">
                    {skip.reason || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {skip.skippedBy === "employee" ? "Xodim"
                        : skip.skippedBy === "manager" ? "Rahbar"
                        : "Tizim"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {skip.status === "unexcused" ? (
                      <EPStatusPill tone="danger" className="text-xs">{t("uzrsiz")}</EPStatusPill>
                    ) : (
                      <EPStatusPill tone="neutral" className="text-xs">{t("uzrli")}</EPStatusPill>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        ) : (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <ClipboardX className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">{t("baholashOtkazibYuborishlarTopilmadi")}</p>
            <p className="text-xs opacity-60 mt-1">{t("xodimBarchaRejalashtirilganBaholashlardaQatnashgan")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
