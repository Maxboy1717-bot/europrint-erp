/**
 * @module AddNodeDialog
 * @description React UI component.
 */

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NODE_TYPE_LABELS } from "./types";
import { useTranslation } from '@/lib/i18n';

export function AddNodeDialog({
  open,
  onClose,
  onSuccess,
  initialParentId,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialParentId?: string;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    nameRu: "",
    nodeType: "department",
    tskp: "",
    parentId: initialParentId || "",
  });

  // Update parentId if initialParentId changes
  const prevParentId = useRef(initialParentId);
  if (prevParentId.current !== initialParentId) {
    prevParentId.current = initialParentId;
    setForm((f) => ({ ...f, parentId: initialParentId || "" }));
  }

  const mutation = useMutation({
    mutationFn: () => {
      const parentId = form.parentId ? Number(form.parentId) : null;
      const level = parentId ? undefined : 0;
      return apiRequest("POST", "/api/org-structure/nodes", {
        name: form.name,
        nameRu: form.nameRu,
        nodeType: form.nodeType,
        tskp: form.tskp,
        parentId,
        level,
      });
    },
    onSuccess: () => {
      toast({ title: "Bo'lim qo'shildi" });
      onSuccess();
      onClose();
      setForm({ name: "", nameRu: "", nodeType: "department", tskp: "", parentId: "" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiBolimQoshish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>{t("nomiUz")}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("masalanMoliyaBolimi")}
            />
          </div>
          <div>
            <Label>{t("nomiRu")}</Label>
            <Input
              value={form.nameRu}
              onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
              placeholder={t("untitled")}
            />
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
            <Label>{t("qyamAsosiyVazifasiMaks32Belgi")}</Label>
            <Input
              value={form.tskp}
              onChange={(e) => setForm((f) => ({ ...f, tskp: e.target.value.slice(0, 32) }))}
              placeholder={t("asosiyVazifasi")}
              maxLength={32}
            />
            <p className="text-xs text-muted-foreground mt-0.5">{form.tskp.length}/32</p>
          </div>
          <div>
            <Label>{t("otaNodeId")}</Label>
            <Input
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              placeholder={t("masalan2BoShQoldirsaIldiz")}
              type="number"
            />
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
