import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2 } from "lucide-react";
import { Assignment, Certificate } from "./types";

interface LearningHistoryTablesProps {
  assignments: Assignment[];
  certificates: Certificate[];
}

export function LearningHistoryTables({ assignments, certificates }: LearningHistoryTablesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Course Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <CardTitle>Tayinlangan kurslar</CardTitle>
          </div>
          <CardDescription>O'quv jarayoni holati</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kurs nomi</TableHead>
                <TableHead>Tayinlangan</TableHead>
                <TableHead>Holat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(assignments) ? assignments : []).slice(0, 5).map((assignment: Assignment) => (
                <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                  <TableCell className="font-medium">{assignment.courseName}</TableCell>
                  <TableCell>{assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString('uz-UZ') : "—"}</TableCell>
                  <TableCell>
                    {assignment.completedAt ? (
                      <Badge variant="default">Tugallangan</Badge>
                    ) : (
                      <Badge variant="secondary">Jarayonda</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
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

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <CardTitle>Sertifikatlar</CardTitle>
          </div>
          <CardDescription>Muvaffaqiyatli topshirilgan kurslar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kurs nomi</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Raqami</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(certificates) ? certificates : []).slice(0, 5).map((certificate: Certificate) => (
                <TableRow key={certificate.id} data-testid={`row-certificate-${certificate.id}`}>
                  <TableCell className="font-medium">{certificate.courseName}</TableCell>
                  <TableCell>{certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('uz-UZ') : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{certificate.certificateNumber}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {certificates.length === 0 && (
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
