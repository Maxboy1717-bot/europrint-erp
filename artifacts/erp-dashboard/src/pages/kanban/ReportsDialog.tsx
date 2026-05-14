/**
 * @module ReportsDialog
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, RefreshCw, FileSpreadsheet, FileText } from "lucide-react";
import { type EmployeePerformance } from "./kanban-types";
import { queryClient, getAuthHeaders } from "@/lib/queryClient";
import { apiRequest } from '@/lib/queryClient';
import { EPStatusPill, EPLoader } from "@/components/ep";

export function ReportsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const { data: performance = [], isLoading } = useQuery<EmployeePerformance[]>({
    queryKey: ["/api/kanban/reports/employee-performance"],
    enabled: open,
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}d`;
  };

  const handleExport = async (format: "excel" | "pdf") => {
    setExporting(format);
    try {
      const res = await apiRequest('GET', `/api/kanban/reports/export?format=${format}`);
      if (!res.ok) throw new Error(`Export xatosi: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "excel" ? "xlsx" : "pdf";
      a.download = `kanban-hisobot-${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export xatosi:", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-6">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Xodimlar samaradorligi hisoboti
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void queryClient.invalidateQueries({ queryKey: ["/api/kanban/reports"] })}
                data-testid="button-refresh-report"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Yangilash
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("excel")}
                disabled={exporting !== null}
                data-testid="button-export-excel"
              >
                {exporting === "excel"
                  ? <EPLoader className="mr-1" />
                  : <FileSpreadsheet className="h-4 w-4 mr-1" />}
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
                disabled={exporting !== null}
                data-testid="button-export-pdf"
              >
                {exporting === "pdf"
                  ? <EPLoader className="mr-1" />
                  : <FileText className="h-4 w-4 mr-1" />}
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {([1, 2, 3, 4, 5]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead className="text-right">Vazifalar</TableHead>
                  <TableHead className="text-right">Vaqt</TableHead>
                  <TableHead className="text-right">Natijalar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(performance) ? performance : []).map((emp) => (
                  <TableRow key={emp.user.id} data-testid={`row-performance-${emp.user.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={emp.user.profileImageUrl || undefined} />
                          <AvatarFallback>{String((emp.user as unknown as Record<string,unknown>).fullName ?? (emp.user as unknown as Record<string,unknown>).full_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{String((emp.user as unknown as Record<string,unknown>).fullName ?? (emp.user as unknown as Record<string,unknown>).full_name ?? "Noma'lum")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <EPStatusPill tone="neutral">{emp.totalTasks}</EPStatusPill>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatTime(emp.totalTimeMinutes)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{emp.totalResults}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {performance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">
                      Ma'lumotlar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
