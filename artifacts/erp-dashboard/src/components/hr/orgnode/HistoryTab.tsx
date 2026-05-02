import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";
import { HistoryEntry } from "./types";

interface HistoryTabProps {
  nodeId: string | number;
}

export function HistoryTab({ nodeId }: HistoryTabProps) {
  const { data: historyData, isLoading: histLoading } = useQuery<{
    nodeId: number; history: HistoryEntry[];
  }>({
    queryKey: [`/api/org-structure/nodes/${nodeId}/history`],
    enabled: !!nodeId,
  });

  if (histLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff5d2e]" />
      </div>
    );
  }

  if (!historyData?.history || historyData.history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
        <History className="h-10 w-10 opacity-20" />
        <p>Hozircha tarix mavjud emas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(Array.isArray(historyData.history) ? historyData.history : []).map((entry) => (
        <Card key={entry.id} className="border-l-4 border-l-[#ff5d2e]/50">
          <CardContent className="py-3 px-4 flex justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">{entry.action}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(entry.changedAt).toLocaleString("uz-UZ")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kim: {entry.changedBy}
              </p>
              {entry.details && (
                <p className="text-xs text-muted-foreground/70 mt-1">{entry.details}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
