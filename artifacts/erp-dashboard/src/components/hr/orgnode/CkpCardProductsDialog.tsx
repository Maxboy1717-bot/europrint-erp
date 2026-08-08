/**
 * @module CkpCardProductsDialog
 * @description GAP #10 write-path UI — karta+mahsulot ЦКП norma slotlarini (`ckp_card_products`)
 *   boshqarish (yaratish/yangilash/deaktivatsiya). CkpTab.tsx'dagi kunlik fakt-kiritish formasi
 *   mahsulot dropdown'ini to'ldiradi (cardProductTarget norma-resolution); shu norma qayerdan
 *   kelishini shu oyna orqali kiritish/tahrirlash mumkin.
 *
 *   Backend (org-structure/ckp.controller):
 *     - GET    /api/org-structure/ckp/card-products?cardId=      → { items, total }
 *     - POST   /api/org-structure/ckp/card-products               { cardId, productId, targetValue?, formulaType?, measurementUnit?, notes? }
 *     - DELETE /api/org-structure/ckp/card-products/:id           → deaktivatsiya (is_active=false)
 *
 *   ⭐ FABRIKATSIYA YO'Q (Q-40): faqat REAL /api/products ro'yxati (CkpTab'dan qayta ishlatiladi,
 *   alohida so'rov yo'q) + real saqlangan slotlar. ⭐ Qoida 14: deaktivatsiya DeleteConfirmDialog
 *   orqali tasdiqlanadi.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { ProductOption } from "./CkpTab"; // type-only import — avoids a runtime circular dependency (CkpTab renders this dialog)

/** ckp_card_products qatori (transport shakli — ckp-fact.repository bilan bir xil). */
interface CardProductRow {
  id: number;
  card_id: number;
  product_id: number;
  target_value?: number | string | null;
  formula_type?: string | null;
  measurement_unit?: string | null;
  is_active: boolean;
  notes?: string | null;
}

/** ck_ckp_card_products_formula CHECK bilan bir xil 4 tur (ckp-fact.service CKP_FORMULA_* bilan mos). */
const FORMULA_OPTIONS: { value: string; label: string }[] = [
  { value: "quantity_pct", label: "Miqdor% (fakt/norma)" },
  { value: "foiz", label: "Foiz (qiymat o'zi %)" },
  { value: "vaqt", label: "Vaqt-norma (teskari)" },
  { value: "boolean", label: "Ha/Yo'q" },
];

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface CkpCardProductsDialogProps {
  cardId: number;
  products: ProductOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CkpCardProductsDialog({ cardId, products, open, onOpenChange }: CkpCardProductsDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listKey = ["/api/org-structure/ckp/card-products", { cardId }] as const;
  const { data, isLoading } = useQuery<{ items?: CardProductRow[] } | CardProductRow[]>({
    queryKey: listKey,
    enabled: open,
    staleTime: 10_000,
  });
  const rows: CardProductRow[] = useMemo(() => {
    const raw = Array.isArray(data) ? data : Array.isArray(data?.items) ? data!.items : [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const productNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of products) m.set(p.id, p.name);
    return m;
  }, [products]);

  // ── Yaratish/yangilash formasi ──
  const [productId, setProductId] = useState<string>("");
  const [targetValue, setTargetValue] = useState<string>("");
  const [formulaType, setFormulaType] = useState<string>("");
  const [measurementUnit, setMeasurementUnit] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const resetForm = () => {
    setProductId("");
    setTargetValue("");
    setFormulaType("");
    setMeasurementUnit("");
    setNotes("");
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/org-structure/ckp/card-products"] });

  const upsertMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/org-structure/ckp/card-products", {
        cardId,
        productId: Number(productId),
        targetValue: targetValue.trim() === "" ? undefined : Number(targetValue),
        formulaType: formulaType === "" ? undefined : formulaType,
        measurementUnit: measurementUnit.trim() === "" ? undefined : measurementUnit.trim(),
        notes: notes.trim() === "" ? undefined : notes.trim(),
      }),
    onSuccess: () => {
      invalidate();
      resetForm();
      toast({ title: t("ckpNormaSaqlandi", "ЦКП norma slot saqlandi") });
    },
    onError: (e: unknown) =>
      toast({ title: e instanceof Error ? e.message : t("Xatolik", "Xatolik"), variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/org-structure/ckp/card-products/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: t("ckpNormaDeaktivatsiya", "ЦКП norma slot deaktivatsiya qilindi") });
    },
    onError: (e: unknown) =>
      toast({ title: e instanceof Error ? e.message : t("Xatolik", "Xatolik"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t("ckpMahsulotNormalari", "Mahsulot bo'yicha ЦКП normalar")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Yaratish/yangilash formasi ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-border/60 bg-muted/20 p-3">
            <div>
              <Label className="text-xs">{t("mahsulot", "Mahsulot")}</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger data-testid="select-cp-product">
                  <SelectValue placeholder={t("mahsulotniTanlang", "Mahsulotni tanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">{t("mavjudMahsulotYoq", "Mavjud mahsulot yo'q")}</div>
                  ) : products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("ckpNormaQiymati", "Norma (maqsad qiymat)")}</Label>
              <Input
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="masalan 100"
                data-testid="input-cp-target"
              />
            </div>
            <div>
              <Label className="text-xs">{t("ckpFormulaTuri", "Formula turi")}</Label>
              <Select value={formulaType} onValueChange={setFormulaType}>
                <SelectTrigger data-testid="select-cp-formula">
                  <SelectValue placeholder={t("ckpKartaGlobalDefault", "(karta-global default)")} />
                </SelectTrigger>
                <SelectContent>
                  {FORMULA_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("olchovBirligi", "O'lchov birligi")}</Label>
              <Input
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value)}
                placeholder="dona / kg / m2"
                data-testid="input-cp-unit"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">{t("izoh", "Izoh (ixtiyoriy)")}</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="textarea-cp-notes"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button
                size="sm"
                disabled={!productId || upsertMutation.isPending}
                onClick={() => upsertMutation.mutate()}
                data-testid="button-cp-save"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {upsertMutation.isPending ? t("saqlanmoqda", "Saqlanmoqda...") : t("saqlash", "Saqlash")}
              </Button>
            </div>
          </div>

          {/* ── Mavjud slotlar ── */}
          {isLoading ? (
            <EPLoader />
          ) : rows.length === 0 ? (
            <EPEmptyState
              icon={Package}
              variant="inline"
              title={t("ckpNormaYoq", "ЦКП mahsulot normasi yo'q")}
              description={t(
                "ckpNormaYoqIzoh2",
                "Bu karta uchun hali mahsulot bo'yicha alohida norma kiritilmagan — kunlik faktda karta-global norma ishlatiladi."
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t("mahsulot", "Mahsulot")}</th>
                    <th className="py-2 pr-3 font-medium text-right">{t("norma", "Norma")}</th>
                    <th className="py-2 pr-3 font-medium">{t("ckpFormulaTuri", "Formula turi")}</th>
                    <th className="py-2 pr-3 font-medium">{t("holat", "Holat")}</th>
                    <th className="py-2 font-medium text-right">{t("amal", "Amal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const targetNum = toNum(r.target_value);
                    return (
                      <tr key={r.id} className="border-b border-border/50" data-testid={`cp-row-${r.id}`}>
                        <td className="py-2 pr-3">{productNameById.get(r.product_id) ?? `#${r.product_id}`}</td>
                        <td className="py-2 pr-3 text-right">
                          {targetNum != null ? `${targetNum}${r.measurement_unit ? ` ${r.measurement_unit}` : ""}` : "—"}
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">
                          {FORMULA_OPTIONS.find((f) => f.value === r.formula_type)?.label ?? r.formula_type ?? t("ckpKartaGlobalDefault", "(karta-global default)")}
                        </td>
                        <td className="py-2 pr-3">
                          <EPStatusPill tone={r.is_active ? "success" : "neutral"} className="text-[11px]">
                            {r.is_active ? t("faol", "Faol") : t("nofaol", "Nofaol")}
                          </EPStatusPill>
                        </td>
                        <td className="py-2 text-right">
                          {r.is_active && (
                            <DeleteConfirmDialog
                              title={t("ckpNormaDeaktivatsiyaTasdiq", "ЦКП norma slotni deaktivatsiya qilish")}
                              description={t(
                                "ckpNormaDeaktivatsiyaMatn",
                                "Bu mahsulot uchun norma o'chiriladi — kunlik fakt karta-global normaga qaytadi. Tarixiy faktlar o'zgarmaydi."
                              )}
                              buttonText={t("deaktivatsiya", "Deaktivatsiya")}
                              isPending={deactivateMutation.isPending}
                              onConfirm={() => deactivateMutation.mutate(r.id)}
                              trigger={
                                <Button size="sm" variant="ghost" data-testid={`button-cp-deactivate-${r.id}`}>
                                  {t("deaktivatsiya", "Deaktivatsiya")}
                                </Button>
                              }
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
