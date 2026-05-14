/**
 * @module DocumentsTabSectionsC
 * @description HRDocsSection — HR document flow table for DocumentsTab.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import {
  type HrDocument,
  STATUS_CONFIG, DOC_TYPE_LABELS,
} from "./DocumentsTabTypes";

interface HRDocsSectionProps {
  hrDocsArr: HrDocument[];
}

export function HRDocsSection({ hrDocsArr }: HRDocsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[var(--ep-purple)]" />
          Hujjatlar oqimi
        </CardTitle>
        <CardDescription>Xodim tomonidan yaratilgan barcha hujjatlar</CardDescription>
      </CardHeader>
      <CardContent>
        {hrDocsArr.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hujjat №</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>Sarlavha</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Tasdiqlash</TableHead>
                <TableHead>Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hrDocsArr.map(doc => {
                const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                const StatusIcon = statusCfg.icon;
                const approvalProgress =
                  doc.total_steps && doc.total_steps > 0
                    ? `${doc.approved_steps ?? 0}/${doc.total_steps}`
                    : "—";
                return (
                  <TableRow key={doc.id} data-testid={`row-hrdoc-${doc.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                      {doc.doc_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate">
                      {doc.title || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    <TableCell className="text-sm text-center">{approvalProgress}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs gap-1 ${statusCfg.className}`}>
                        <StatusIcon className="h-3 w-3" />{statusCfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        ) : (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">Hujjatlar topilmadi</p>
            <p className="text-xs opacity-60 mt-1">
              Hujjatlar oqimi orqali yaratilgan hujjatlar yo'q
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
