/**
 * @module AttendanceDisciplineTables
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle } from "lucide-react";
import { AttendanceRecord, DisciplineRecord } from "./types";
import { useTranslation } from '@/lib/i18n';

interface AttendanceDisciplineTablesProps {
  attendance: AttendanceRecord[];
  discipline: DisciplineRecord[];
  getAttendanceStatusBadge: (status: string) => { label: string; variant: "default" | "destructive" | "secondary" };
  getDisciplineTypeBadge: (type: string) => { label: string; variant: "default" | "destructive" | "secondary" };
  onOpenAttendanceDialog: () => void;
  onOpenDisciplineDialog: () => void;
}

export function AttendanceDisciplineTables({
  attendance = [],
  discipline = [],
  getAttendanceStatusBadge,
  getDisciplineTypeBadge,
  onOpenAttendanceDialog,
  onOpenDisciplineDialog,
}: AttendanceDisciplineTablesProps) {
  const { t } = useTranslation("common");
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const safeDiscipline = Array.isArray(discipline) ? discipline : [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <CardTitle>{t("davomat")}</CardTitle>
            </div>
            <Button size="sm" onClick={onOpenAttendanceDialog} data-testid="button-add-attendance">
              {t("davomatQoshish")}
            </Button>
          </div>
          <CardDescription>{t("oxirgiDavomatYozuvlari")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
                <TableHead>{t("Izoh")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeAttendance.slice(0, 5).map((record: AttendanceRecord) => {
                const badge = getAttendanceStatusBadge(record.status);
                return (
                  <TableRow key={record.id} data-testid={`row-attendance-${record.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>{new Date(record.date).toLocaleDateString('uz-UZ')}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.notes || "—"}</TableCell>
                  </TableRow>
                );
              })}
              {safeAttendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-[13px] text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      {/* Discipline Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>{t("intizom")}</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenDisciplineDialog} data-testid="button-add-discipline">
              {t("intizomYozuvi")}
            </Button>
          </div>
          <CardDescription>{t("ragbatVaChoralar")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("progress.description")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeDiscipline.slice(0, 5).map((record: DisciplineRecord) => {
                const badge = getDisciplineTypeBadge(record.type);
                return (
                  <TableRow key={record.id} data-testid={`row-discipline-${record.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>{new Date(record.date).toLocaleDateString('uz-UZ')}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.description || "—"}</TableCell>
                  </TableRow>
                );
              })}
              {safeDiscipline.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-[13px] text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
