import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle } from "lucide-react";
import { AttendanceRecord, DisciplineRecord } from "./types";

interface AttendanceDisciplineTablesProps {
  attendance: AttendanceRecord[];
  discipline: DisciplineRecord[];
  getAttendanceStatusBadge: (status: string) => { label: string; variant: "default" | "destructive" | "secondary" };
  getDisciplineTypeBadge: (type: string) => { label: string; variant: "default" | "destructive" | "secondary" };
  onOpenAttendanceDialog: () => void;
  onOpenDisciplineDialog: () => void;
}

export function AttendanceDisciplineTables({
  attendance,
  discipline,
  getAttendanceStatusBadge,
  getDisciplineTypeBadge,
  onOpenAttendanceDialog,
  onOpenDisciplineDialog,
}: AttendanceDisciplineTablesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <CardTitle>Davomat</CardTitle>
            </div>
            <Button size="sm" onClick={onOpenAttendanceDialog} data-testid="button-add-attendance">
              Davomat qo'shish
            </Button>
          </div>
          <CardDescription>Oxirgi davomat yozuvlari</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Izoh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(attendance) ? attendance : []).slice(0, 5).map((record: AttendanceRecord) => {
                const badge = getAttendanceStatusBadge(record.status);
                return (
                  <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                    <TableCell>{new Date(record.date).toLocaleDateString('uz-UZ')}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.notes || "—"}</TableCell>
                  </TableRow>
                );
              })}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    Ma'lumot topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discipline Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>Intizom</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenDisciplineDialog} data-testid="button-add-discipline">
              Intizom yozuvi
            </Button>
          </div>
          <CardDescription>Rag'bat va choralar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>Tavsif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(discipline) ? discipline : []).slice(0, 5).map((record: DisciplineRecord) => {
                const badge = getDisciplineTypeBadge(record.type);
                return (
                  <TableRow key={record.id} data-testid={`row-discipline-${record.id}`}>
                    <TableCell>{new Date(record.date).toLocaleDateString('uz-UZ')}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.description || "—"}</TableCell>
                  </TableRow>
                );
              })}
              {discipline.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    Ma'lumot topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
