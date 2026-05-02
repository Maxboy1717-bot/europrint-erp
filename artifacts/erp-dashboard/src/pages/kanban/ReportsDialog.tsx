import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, RefreshCw } from "lucide-react";
import { type EmployeePerformance } from "./kanban-types";
import { queryClient } from "@/lib/queryClient";

export function ReportsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: performance = [], isLoading } = useQuery<EmployeePerformance[]>({
    queryKey: ["/api/kanban/reports/employee-performance"],
    enabled: open,
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}d`;
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Xodimlar samaradorligi hisoboti
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {([1, 2, 3, 4, 5]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead className="text-right">Vazifalar</TableHead>
                  <TableHead className="text-right">Vaqt</TableHead>
                  <TableHead className="text-right">Natijalar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(performance) ? performance : []).map((emp) => (
                  <TableRow key={emp.user.id} data-testid={`row-performance-${emp.user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={emp.user.profileImageUrl || undefined} />
                          <AvatarFallback>{emp.user.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{emp.user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{emp.totalTasks}</Badge>
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
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Ma'lumotlar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>
  );
}
