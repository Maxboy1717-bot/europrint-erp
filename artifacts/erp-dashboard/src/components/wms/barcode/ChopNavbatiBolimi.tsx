/**
 * @module ChopNavbatiBolimi
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer } from "lucide-react";
import { PrintJob } from "./types";

export function ChopNavbatiBolimi() {
  const { data: navbat, isLoading } = useQuery<PrintJob[]>({
    queryKey: ["/api/barcode-warehouse/print-queue"],
  });

  if (isLoading) return <Skeleton className="h-20 w-full rounded-lg" />;

  const kutayotganlar = navbat?.filter((p: PrintJob) => p.status === "PENDING") || [];

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Chop navbati ({kutayotganlar.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {kutayotganlar.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Navbat bo'sh</p>
        ) : (
          <div className="space-y-1">
            {(Array.isArray(kutayotganlar) ? kutayotganlar : []).slice(0, 10).map((p: PrintJob) => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                <span className="truncate text-muted-foreground">{p.templateName || "Yorliq"}</span>
                <Badge variant="outline" className="text-xs">{p.copies} nusxa</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
