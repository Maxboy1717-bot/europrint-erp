/**
 * @module undo-toast
 * @description React UI component.
 */

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { logClientError } from "@/lib/errorLogger";

export function useUndoDelete() {
  const { toast } = useToast();

  const showUndoToast = (
    recordType: string,
    recordId: string | number,
    recordName: string,
    onUndo?: () => void
  ) => {
    toast({
      title: `"${recordName}" o'chirildi`,
      description: "Qaytarish uchun tugmani bosing",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await apiRequest("POST", `/api/europrint-control/deleted-records/${recordId}/restore`, {
                tableName: recordType,
              });
              onUndo?.();
            } catch (error) {
              logClientError(error, "undo-toast: restore failed");
            }
          }}
          data-testid="button-undo-delete"
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Qaytarish
        </Button>
      ),
    });
  };

  return { showUndoToast };
}
