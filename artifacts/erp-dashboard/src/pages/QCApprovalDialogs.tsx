/**
 * @module QCApprovalDialogs
 * @description All Dialog components for the QC Approval page.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { QCOrder, TEST_CATEGORIES, TEST_PARAMS_BY_CATEGORY } from "./QCApprovalTypes";
import { useTranslation } from '@/lib/i18n';

interface InspectorSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: QCOrder | null;
  inspectorTestId: string;
  onInspectorTestIdChange: (value: string) => void;
  comments: string;
  onCommentsChange: (value: string) => void;
  isPending: boolean;
  onSubmit: () => void;
}

export function InspectorSubmitDialog({
  open,
  onOpenChange,
  selectedOrder,
  inspectorTestId,
  onInspectorTestIdChange,
  comments,
  onCommentsChange,
  isPending,
  onSubmit,
}: InspectorSubmitDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("inspeksiyaniYakunlash")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>{t("buyurtma3")}<strong>{selectedOrder?.papkaNo}</strong></p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex items-start gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--ep-blue)] mt-0.5" />
            <p className="text-sm text-[var(--ep-blue)] dark:text-blue-300">
              {t("testIdNiKiritingTest")}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">{t("qcTestId")}</label>
            <Input
              placeholder={t("testIdKiriting")}
              value={inspectorTestId}
              onChange={(e) => onInspectorTestIdChange(e.target.value)}
              data-testid="input-test-id"
            />
          </div>
          <Textarea
            placeholder={t("inspeksiyaIzohiIxtiyoriy")}
            value={comments}
            onChange={(e) => onCommentsChange(e.target.value)}
            data-testid="input-inspector-comments"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            onClick={onSubmit}
            disabled={isPending || !inspectorTestId.trim()}
            data-testid="btn-confirm-inspector-submit"
          >
            {isPending ? "Yuklanmoqda..." : "Menejrga yuborish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: QCOrder | null;
  comments: string;
  onCommentsChange: (value: string) => void;
  visualOk: boolean;
  onVisualOkChange: (value: boolean) => void;
  dimensionsOk: boolean;
  onDimensionsOkChange: (value: boolean) => void;
  printOk: boolean;
  onPrintOkChange: (value: boolean) => void;
  packagingOk: boolean;
  onPackagingOkChange: (value: boolean) => void;
  allChecked: boolean;
  isPending: boolean;
  onApprove: () => void;
}
export function ApprovalDialog({
  open,
  onOpenChange,
  selectedOrder,
  comments,
  onCommentsChange,
  visualOk,
  onVisualOkChange,
  dimensionsOk,
  onDimensionsOkChange,
  printOk,
  onPrintOkChange,
  packagingOk,
  onPackagingOkChange,
  allChecked,
  isPending,
  onApprove,
}: ApprovalDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {selectedOrder?.status === "pending_review" ? "QC Menejer Tasdiqlash" : "QC Ko'rish"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>{t("buyurtma3")}<strong>{selectedOrder?.papkaNo}</strong></p>

          {selectedOrder?.status !== "pending_review" && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
              <p className="text-sm text-[var(--ep-yellow)]">{t("buBuyurtmaHaliInspeksiyaYakunlanishini")}</p>
            </div>
          )}

          {selectedOrder?.status === "pending_review" && (
            <>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">{t("diqqat")}</p>
                  <p className="text-sm text-[var(--ep-yellow)] dark:text-yellow-300">
                    {t("barcha4TaNazoratNuqtasini")}
                  </p>
                </div>
              </div>
              <div className="space-y-3 border rounded-md p-3">
                <p className="text-sm font-medium text-muted-foreground">{t("sifatNazoratiChekListasi")}</p>
                <div className="flex items-center gap-2">
                  <Checkbox id="visual-ok" checked={visualOk} onCheckedChange={(v) => onVisualOkChange(!!v)} data-testid="checkbox-visual" />
                  <label htmlFor="visual-ok" className="text-sm cursor-pointer">{t("vizualTekshiruvRangiYuzasiNuqsonlar")}</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="dimensions-ok" checked={dimensionsOk} onCheckedChange={(v) => onDimensionsOkChange(!!v)} data-testid="checkbox-dimensions" />
                  <label htmlFor="dimensions-ok" className="text-sm cursor-pointer">{t("olchamlarFormatQalinlikGramajNorma")}</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="print-ok" checked={printOk} onCheckedChange={(v) => onPrintOkChange(!!v)} data-testid="checkbox-print" />
                  <label htmlFor="print-ok" className="text-sm cursor-pointer">{t("bosmaSifatiRasmMatnRanglar")}</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="packaging-ok" checked={packagingOk} onCheckedChange={(v) => onPackagingOkChange(!!v)} data-testid="checkbox-packaging" />
                  <label htmlFor="packaging-ok" className="text-sm cursor-pointer">{t("qadoqlashQutilashYigishEtiketkaTogri")}</label>
                </div>
              </div>
              <Textarea
                placeholder={t("qcIzohIxtiyoriy")}
                value={comments}
                onChange={(e) => onCommentsChange(e.target.value)}
                data-testid="input-comments"
              />
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("close2")}</Button>
          {selectedOrder?.status === "pending_review" && (
            <Button
              onClick={onApprove}
              disabled={isPending || !allChecked}
              data-testid="btn-confirm-approve"
            >
              {isPending ? "Yuklanmoqda..." : !allChecked ? "Barcha boxlarni belgilang" : "Tasdiqlash"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: QCOrder | null;
  comments: string;
  onCommentsChange: (value: string) => void;
  isPending: boolean;
  onReject: () => void;
}
export function RejectDialog({
  open,
  onOpenChange,
  selectedOrder,
  comments,
  onCommentsChange,
  isPending,
  onReject,
}: RejectDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("qcRadEtish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>{t("buyurtma3")}<strong>{selectedOrder?.papkaNo}</strong></p>
          <Textarea
            placeholder={t("radEtishSababiQaysiTestMuvaffaqiyatsiz")}
            value={comments}
            onChange={(e) => onCommentsChange(e.target.value)}
            required
            data-testid="input-reject-reason"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={isPending || !comments.trim()}
            data-testid="btn-confirm-reject"
          >
            {isPending ? "Yuklanmoqda..." : "Rad etish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface TestInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: QCOrder | null;
  testInputs: Record<string, Record<string, string>>;
  onTestInputChange: (category: string, param: string, value: string) => void;
  onCategoryChange: (category: string) => void;
  isPending: boolean;
  onSave: () => void;
}
export function TestInputDialog({
  open,
  onOpenChange,
  selectedOrder,
  testInputs,
  onTestInputChange,
  onCategoryChange,
  isPending,
  onSave,
}: TestInputDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Material Test Kiritish - {selectedOrder?.papkaNo}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="physical" onValueChange={onCategoryChange}>
          <TabsList className="grid grid-cols-2 lg:grid-cols-5">
            {(Array.isArray(TEST_CATEGORIES) ? TEST_CATEGORIES : []).map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
            ))}
          </TabsList>
          {(Array.isArray(TEST_CATEGORIES) ? TEST_CATEGORIES : []).map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="p-4 space-y-3">
              {(TEST_PARAMS_BY_CATEGORY[cat.id] || []).map(param => (
                <div key={param} className="flex items-center gap-3">
                  <label className="text-sm w-40 shrink-0">{param}</label>
                  <Input
                    placeholder={t("natijaKiriting")}
                    value={testInputs[cat.id]?.[param] || ""}
                    onChange={(e) => onTestInputChange(cat.id, param, e.target.value)}
                    data-testid={`input-test-${cat.id}-${param}`}
                  />
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("close2")}</Button>
          <Button
            onClick={onSave}
            disabled={isPending}
            data-testid="btn-save-tests"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash va Menejrga yuborish uchun tayyor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
