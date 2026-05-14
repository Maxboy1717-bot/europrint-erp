/**
 * @module OrdersRegistryDialogs
 * @description Create and detail dialogs for the OrdersRegistry page.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  OrdersRegistryEntry, CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS,
  STATUS_LABELS, STATUS_COLORS, Category,
} from "./OrdersRegistryTypes";

// ─── Create Order Form (used inside dialog) ───────────────────────────────────

function CreateOrderForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    category: "",
    title: "",
    content: "",
    issuedDate: new Date().toISOString().split("T")[0],
    status: "active",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/orders-registry", data),
    onSuccess: () => {
      toast({ title: "Buyruq muvaffaqiyatli qo'shildi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.title.trim() || !form.content.trim() || !form.issuedDate) {
      toast({ title: "Barcha majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>{t("kategoriya")}</Label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger>
              <SelectValue placeholder={t("kategoriyaTanlang")} />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map((c) => (
                <SelectItem key={c} value={c}>{c} — {CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="issuedDate">{t("chiqarilganSana")}</Label>
          <Input
            id="issuedDate"
            type="date"
            value={form.issuedDate}
            onChange={(e) => setForm((f) => ({ ...f, issuedDate: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="title">{t("sarlavha")}</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("buyruqSarlavhasi")}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="content">{t("buyruqMatni")}</Label>
        <Textarea
          id="content"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder={t("toliqBuyruqMatni")}
          rows={6}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>{"Holat"}</Label>
        <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelledDesc")}</SelectItem>
            <SelectItem value="expired">{t("muddatiOtgan")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Order Detail Content (used inside dialog) ────────────────────────────────

function OrderDetailContent({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const { data: entry, isLoading } = useQuery<OrdersRegistryEntry>({
    queryKey: [`/api/orders-registry/${orderId}`],
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : entry ? (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${CATEGORY_COLORS[entry.category as Category] || ""} border-0`}>
              {entry.number}
            </Badge>
            <Badge className={`${STATUS_COLORS[entry.status] || ""} border-0`}>
              {STATUS_LABELS[entry.status] || entry.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{entry.issuedDate}</span>
          </div>
          <h3 className="font-semibold text-base">{entry.title}</h3>
          <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {entry.content}
          </div>
          <p className="text-xs text-muted-foreground">
            Kiritilgan: {new Date(entry.createdAt).toLocaleString("uz-UZ")}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">{t("buyruqTopilmadi")}</p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{t("close2")}</Button>
      </DialogFooter>
    </div>
  );
}

// ─── Exported Dialog Wrappers ─────────────────────────────────────────────────

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateOrderDialog({open, onOpenChange, onSuccess }: CreateOrderDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> {t("yangiBuyruqQoshish")}
          </DialogTitle>
        </DialogHeader>
        <CreateOrderForm
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

interface OrderDetailDialogProps {
  viewId: number | null;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ viewId, onOpenChange }: OrderDetailDialogProps) {
  return (
    <Dialog open={viewId !== null} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> {t("buyruqTafsilotlari")}
          </DialogTitle>
        </DialogHeader>
        {viewId !== null && (
          <OrderDetailContent orderId={viewId} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
