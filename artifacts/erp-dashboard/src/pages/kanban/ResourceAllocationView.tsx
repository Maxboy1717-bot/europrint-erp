/**
 * @module ResourceAllocationView
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { type T, type AllocationData } from "./kanban-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { RefreshCw } from "lucide-react";
import { EPStatusPill } from "@/components/ep";

export function ResourceAllocationView({ t, boardId }: { t: typeof T.uz; boardId: string | null }) {
  const { data: allocation = [], isLoading } = useQuery<AllocationData[]>({
    queryKey: ['/api/kanban/resource-allocation', boardId],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="p-6" data-testid="allocation-loading">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="p-4" data-testid="allocation-view">
      <h2 className="text-lg font-semibold mb-4">{t.allocation.title}</h2>
      {allocation.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">{t.allocation.noData}</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t.allocation.employee}</th>
                <th className="text-center px-4 py-3 font-medium">{t.allocation.today}</th>
                <th className="text-center px-4 py-3 font-medium">{t.allocation.thisWeek}</th>
                <th className="text-center px-4 py-3 font-medium">{t.allocation.thisMonth}</th>
                <th className="text-center px-4 py-3 font-medium">{t.allocation.total}</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(allocation) ? allocation : []).map((row) => (
                <tr key={row.user.id} className="border-t hover-elevate" data-testid={`allocation-row-${row.user.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={row.user.profileImageUrl || undefined} />
                        <AvatarFallback>{String((row.user as unknown as Record<string,unknown>).fullName ?? (row.user as unknown as Record<string,unknown>).full_name ?? "?").split(" ").map(n => n[0] ?? "").join("").substring(0, 2).toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <span>{String((row.user as unknown as Record<string,unknown>).fullName ?? (row.user as unknown as Record<string,unknown>).full_name ?? "Noma'lum")}</span>
                    </div>
                  </td>
                  <td className="text-center px-4 py-3">
                    <Badge variant={row.today > 3 ? "destructive" : "secondary"}>{row.today}</Badge>
                  </td>
                  <td className="text-center px-4 py-3">
                    <Badge variant={row.thisWeek > 10 ? "destructive" : "secondary"}>{row.thisWeek}</Badge>
                  </td>
                  <td className="text-center px-4 py-3">
                    <EPStatusPill tone="neutral">{row.thisMonth}</EPStatusPill>
                  </td>
                  <td className="text-center px-4 py-3">
                    <Badge variant="outline">{row.total}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
}
