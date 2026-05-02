import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, ScanBarcode } from "lucide-react";
import { PickingTask } from "./types";

interface PickingProps {
  count: number;
  tasks: PickingTask[];
  onPick: (taskId: number, barcodeId: string) => void;
  isPending: boolean;
}

export function PickingPanel({ count, tasks, onPick, isPending }: PickingProps) {
  const pendingTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.status === "pending");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Picking topshiriqlari
          {count > 0 && <Badge variant="secondary">{count}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Kutayotgan picking topshiriq yo'q
          </p>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(pendingTasks) ? pendingTasks : []).map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50" data-testid={`picking-task-${task.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{task.materialName}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.requestedQty} dona | {task.barcodeId}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onPick(task.id, task.barcodeId)}
                  disabled={isPending}
                  data-testid={`button-pick-${task.id}`}
                >
                  <ScanBarcode className="h-3 w-3 mr-1" />
                  Tanlash
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
