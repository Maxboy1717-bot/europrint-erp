/**
 * @module HROnboardingDialogs
 * @description Dialog components for the HROnboarding page.
 * Currently: CreateOnboardingDialog — form to start a new onboarding flow.
 */

import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingForm } from "./HROnboardingTypes";

interface CreateOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: OnboardingForm;
  setForm: (updater: (f: OnboardingForm) => OnboardingForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateOnboardingDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isPending,
}: CreateOnboardingDialogProps) {
  const { t } = useTranslation("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiOnboardingBoshlash")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>{t("xodimId")}</Label>
            <Input
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              placeholder={t("xodimIdRaqami1")}
              type="number"
            />
          </div>
          <div>
            <Label>{t("xodimIsmi")}</Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder={t("toliqIsmi")}
            />
          </div>
          <div>
            <Label>{t("lavozimi")}</Label>
            <Input
              value={form.positionName}
              onChange={(e) => setForm((f) => ({ ...f, positionName: e.target.value }))}
              placeholder={t("lavozimNomi1")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button
            onClick={onSubmit}
            disabled={!form.userId || !form.fullName || isPending}
          >
            {isPending ? "Saqlanmoqda..." : "Boshlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
