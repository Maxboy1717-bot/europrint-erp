import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoveRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NodeDetail } from "./types";

interface MoveDialogProps {
  node: NodeDetail;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MoveDialog({
  node, open, onClose, onSuccess,
}: MoveDialogProps) {
  const { toast } = useToast();
  const [newParentId, setNewParentId] = useState(node.parentId ? String(node.parentId) : "");

  const mutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/org-structure/nodes/${node.id}/move`, {
      newParentId: newParentId ? Number(newParentId) : null,
    }),
    onSuccess: () => {
      toast({ title: "Node ko'chirildi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Ko'chirishda xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveRight className="h-4 w-4 text-[#ff5d2e]" />
            Ko'chirish — {node.name}
          </DialogTitle>
        </DialogHeader>
        <div className="py-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Bu bo'limni boshqa ota-nodega o'tkazing. Hozirgi ota: #{node.parentId ?? "—"}
          </p>
          <div>
            <Label>Yangi ota node ID</Label>
            <Input
              type="number"
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              placeholder="Bo'sh qoldirsa — ildiz darajaga"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ildiz darajaga ko'chirish uchun bo'sh qoldiring
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button
            className="bg-[#ff5d2e] hover:bg-[#e04e22]"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Ko'chirilmoqda..." : "Ko'chirish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
