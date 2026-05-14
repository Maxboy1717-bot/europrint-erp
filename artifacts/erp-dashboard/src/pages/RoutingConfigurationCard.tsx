/**
 * @module RoutingConfigurationCard
 * @description Individual routing card component with its operation-sequence
 * strip. Extracted from RoutingConfigurationSections to keep each file under
 * 300 lines.
 */

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Edit, Trash2, Settings, ArrowRight } from "lucide-react";
import {
  type RoutingWithProduct,
  type OperationWithWorkCenter,
  getRoutingOperations,
} from "./RoutingConfigurationTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RoutingCardLabels {
  version: string;
  effectiveFrom: string;
  manageOperations: string;
  operationSequence: string;
  deleteRouting: string;
  deleteWarning: string;
}

interface RoutingCardProps {
  routingData: RoutingWithProduct;
  operations: OperationWithWorkCenter[];
  labels: RoutingCardLabels;
  onManage: (routingData: RoutingWithProduct) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoutingCard({
  routingData,
  operations,
  labels,
  onManage,
  onDelete,
  isDeleting,
}: RoutingCardProps) {
  const ops = getRoutingOperations(operations, routingData.routing.id);

  return (
    <Card
      className="bg-card rounded-lg border-none shadow-none hover:bg-muted/40 transition-colors"
      data-testid={`card-routing-${routingData.routing.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="h-5 w-5 text-primary" />
              {routingData.routing.routingNumber}
              <Badge
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  routingData.routing.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-muted/60 text-foreground"
                )}
                data-testid={`badge-status-${routingData.routing.id}`}
              >
                {routingData.routing.status}
              </Badge>
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              <span className="font-bold text-foreground">{routingData.product?.name}</span>{" "}
              ({routingData.product?.code})
            </CardDescription>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
              onClick={() => onManage(routingData)}
              data-testid={`button-manage-${routingData.routing.id}`}
            >
              <Edit className="h-4 w-4 mr-2" />
              {labels.manageOperations}
            </Button>
            <DeleteConfirmDialog
              title={labels.deleteRouting}
              description={labels.deleteWarning}
              onConfirm={() => onDelete(routingData.routing.id)}
              isPending={isDeleting}
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                data-testid={`button-delete-${routingData.routing.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteConfirmDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {labels.version}
            </p>
            <p
              className="font-bold text-foreground"
              data-testid={`text-version-${routingData.routing.id}`}
            >
              v{routingData.routing.version}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {labels.effectiveFrom}
            </p>
            <p
              className="font-bold text-foreground"
              data-testid={`text-effective-${routingData.routing.id}`}
            >
              {routingData.routing.effectiveFrom ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {labels.manageOperations}
            </p>
            <p
              className="font-bold text-foreground"
              data-testid={`text-operations-${routingData.routing.id}`}
            >
              {ops.length}
            </p>
          </div>
        </div>

        {ops.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {labels.operationSequence}:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {ops.map((opData, idx) => (
                <div key={opData.operation.id} className="flex items-center gap-2">
                  <Badge
                    className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    data-testid={`badge-operation-${opData.operation.id}`}
                  >
                    {opData.operation.sequence}. {opData.operation.operationName}
                  </Badge>
                  {idx < ops.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
