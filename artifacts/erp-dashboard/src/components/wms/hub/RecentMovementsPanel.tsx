/**
 * @module RecentMovementsPanel
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { RecentMovement } from "./types";

interface MovementsProps {
  movements: RecentMovement[];
}

export function RecentMovementsPanel({ movements }: MovementsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Oxirgi harakatlar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {movements && movements.length > 0 ? (
          <div className="space-y-2">
            {movements.slice(0, 8).map((m, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{m.materialName || m.barcodeId}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.movementType} | {m.quantity} {m.unit}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString("uz-UZ") : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Harakatlar yo'q
          </p>
        )}
      </CardContent>
    </Card>
  );
}
