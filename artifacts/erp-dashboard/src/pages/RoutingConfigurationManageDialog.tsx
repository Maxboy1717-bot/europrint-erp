/**
 * @module RoutingConfigurationManageDialog
 * @description ManageOperationsDialog — dialog that lists the existing
 * operations for a selected routing and provides an entry-point to add a new
 * one. Extracted from RoutingConfigurationDialogs to keep each file ≤300 lines.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Plus } from "lucide-react";

import {
  type RoutingWithProduct,
  type OperationWithWorkCenter,
  getRoutingOperations,
} from "./RoutingConfigurationTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ManageOperationsLabels {
  manageOperations: string;
  addOperation: string;
  workCenter: string;
  setupTime: string;
  machineTime: string;
  laborTime: string;
  deleteOperationTitle: string;
  deleteOperationDescription: string;
}

interface ManageOperationsDialogProps {
  selectedRouting: RoutingWithProduct | null;
  onClose: () => void;
  operations: OperationWithWorkCenter[];
  onAddOperation: () => void;
  onDeleteOperation: (id: string) => void;
  isDeletingOperation: boolean;
  labels: ManageOperationsLabels;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManageOperationsDialog({
  selectedRouting,
  onClose,
  operations,
  onAddOperation,
  onDeleteOperation,
  isDeletingOperation,
  labels,
}: ManageOperationsDialogProps) {
  if (!selectedRouting) return null;

  const ops = getRoutingOperations(operations, selectedRouting.routing.id);

  return (
    <Dialog open={!!selectedRouting} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-6" data-testid="dialog-manage-operations">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {selectedRouting.routing.routingNumber} — {selectedRouting.product.name}</DialogTitle>
          <DialogDescription>{labels.manageOperations}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={onAddOperation}
            className="w-full gap-2"
            data-testid="button-add-operation"
          >
            <Plus className="h-4 w-4" />
            {labels.addOperation}
          </Button>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {ops.map((opData) => (
              <div
                key={opData.operation.id}
                className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                data-testid={`row-operation-${opData.operation.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{opData.operation.sequence}</Badge>
                    <span className="font-medium">{opData.operation.operationName}</span>
                    <span className="text-sm text-muted-foreground">
                      ({opData.operation.operationNumber})
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {labels.workCenter}: {opData.workCenter?.name ?? "—"}
                    </p>
                    <p className="flex items-center gap-4">
                      <span>
                        {labels.setupTime}: {opData.operation.setupTime}
                      </span>
                      <span>
                        {labels.machineTime}: {opData.operation.machineTime}
                      </span>
                      <span>
                        {labels.laborTime}: {opData.operation.laborTime}
                      </span>
                    </p>
                  </div>
                </div>
                <DeleteConfirmDialog
                  title={labels.deleteOperationTitle}
                  description={labels.deleteOperationDescription}
                  onConfirm={() => onDeleteOperation(opData.operation.id)}
                  isPending={isDeletingOperation}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
