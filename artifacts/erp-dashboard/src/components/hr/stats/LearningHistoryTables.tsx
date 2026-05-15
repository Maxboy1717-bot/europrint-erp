/**
 * @module LearningHistoryTables
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2 } from "lucide-react";
import { Assignment, Certificate } from "./types";
import { useTranslation } from '@/lib/i18n';

interface LearningHistoryTablesProps {
  assignments: Assignment[];
  certificates: Certificate[];
}

export function LearningHistoryTables({ assignments = [], certificates = [] }: LearningHistoryTablesProps) {
  const { t } = useTranslation("common");
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeCertificates = Array.isArray(certificates) ? certificates : [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Course Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <CardTitle>{t("tayinlanganKurslar")}</CardTitle>
          </div>
          <CardDescription>{t("oquvJarayoniHolati")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("kursNomi")}</TableHead>
                <TableHead>{t("tayinlangan")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeAssignments.slice(0, 5).map((assignment: Assignment) => (
                <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{assignment.courseName}</TableCell>
                  <TableCell>{assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString('uz-UZ') : "—"}</TableCell>
                  <TableCell>
                    {assignment.completedAt ? (
                      <Badge variant="default">{t("completed")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("inProgress")}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {safeAssignments.length === 0 && (
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

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <CardTitle>{t("sertifikatlar")}</CardTitle>
          </div>
          <CardDescription>{t("muvaffaqiyatliTopshirilganKurslar")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("kursNomi")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("raqami")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeCertificates.slice(0, 5).map((certificate: Certificate) => (
                <TableRow key={certificate.id} data-testid={`row-certificate-${certificate.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{certificate.courseName}</TableCell>
                  <TableCell>{certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('uz-UZ') : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{certificate.certificateNumber}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {safeCertificates.length === 0 && (
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
