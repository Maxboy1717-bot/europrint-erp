/**
 * @module EditDialog
 * @description React UI component.
 */

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
import { useTranslation } from '@/lib/i18n';

interface EditDialogProps {
  node: NodeDetail;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDialog({
  node, open, onClose, onSuccess,
}: EditDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: node.name,
    nameRu: node.nameRu || "",
    color: node.color,
    tskp: node.tskp || "",
    tskpRu: node.tskpRu || "",
    description: node.description || "",
    nodeType: node.nodeType,
    headUserId: node.headUserId ?? null,
  });

  // STEP C: department-head picker options. node.employees are user-id native
  // (org-queries findOneWithDetails returns appUsers.id), so emp.id IS the user id
  // head_user_id expects. Surface the current head even if not a dept member.
  const headOptions: { id: number; name: string }[] = (Array.isArray(node.employees) ? node.employees : [])
    .map((e) => ({ id: e.id, name: e.fullName }));
  if (node.headUserId != null && !headOptions.some((o) => o.id === node.headUserId)) {
    headOptions.unshift({ id: node.headUserId, name: node.headUserName || `#${node.headUserId}` });
  }

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
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Bo'limni tahrirlash — {node.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div>
            <Label>{t("nomiUz")}</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>{t("nomiRu")}</Label>
            <Input value={form.nameRu} onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))} />
          </div>
          <div>
            <Label>{t("type")}</Label>
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
            <Label>{t("rang")}</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-8 w-16 rounded border" />
              <span className="text-sm text-muted-foreground">{form.color}</span>
            </div>
          </div>
          <div className="col-span-2">
            <Label>{t("qyamUz")}</Label>
            <Input value={form.tskp}
              onChange={(e) => setForm((f) => ({ ...f, tskp: e.target.value }))}
              placeholder={t("asosiyVazifasiQyam")} />
          </div>
          <div className="col-span-2">
            <Label>{t("qyamRu")}</Label>
            <Input value={form.tskpRu}
              onChange={(e) => setForm((f) => ({ ...f, tskpRu: e.target.value }))}
              placeholder={t("ru")} />
          </div>
          <div className="col-span-2">
            <Label>{t("progress.description")}</Label>
            <Input value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label>Bo'lim boshlig'i</Label>
            <Select
              value={form.headUserId == null ? "__none__" : String(form.headUserId)}
              onValueChange={(v) => setForm((f) => ({ ...f, headUserId: v === "__none__" ? null : Number(v) }))}
            >
              <SelectTrigger><SelectValue placeholder="Boshliq tanlang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Yo'q (bo'sh) —</SelectItem>
                {headOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {headOptions.length === 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">Bu bo'limda hali xodim yo'q — avval xodim biriktiring.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}>
            {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
