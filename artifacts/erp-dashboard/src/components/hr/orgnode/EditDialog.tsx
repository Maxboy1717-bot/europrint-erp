import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NodeDetail, NODE_TYPE_LABELS } from "./types";

interface EditDialogProps {
  node: NodeDetail;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDialog({
  node, open, onClose, onSuccess,
}: EditDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: node.name,
    nameRu: node.nameRu || "",
    color: node.color,
    tskp: node.tskp || "",
    tskpRu: node.tskpRu || "",
    description: node.description || "",
    nodeType: node.nodeType,
  });

  const mutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/org-structure/nodes/${node.id}`, form),
    onSuccess: () => {
      toast({ title: "Saqlandi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bo'limni tahrirlash — {node.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div>
            <Label>Nomi (UZ)</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Nomi (RU)</Label>
            <Input value={form.nameRu} onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))} />
          </div>
          <div>
            <Label>Turi</Label>
            <Select value={form.nodeType} onValueChange={(v) => setForm((f) => ({ ...f, nodeType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(NODE_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rang</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-8 w-16 rounded border" />
              <span className="text-sm text-muted-foreground">{form.color}</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label>QYaM (UZ)</Label>
            <Input value={form.tskp}
              onChange={(e) => setForm((f) => ({ ...f, tskp: e.target.value }))}
              placeholder="Asosiy vazifasi (QYaM)..." />
          </div>
          <div className="col-span-2">
            <Label>QYaM (RU)</Label>
            <Input value={form.tskpRu}
              onChange={(e) => setForm((f) => ({ ...f, tskpRu: e.target.value }))}
              placeholder="ЦКП (RU)..." />
          </div>
          <div className="col-span-2">
            <Label>Tavsif</Label>
            <Input value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}>
            {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
