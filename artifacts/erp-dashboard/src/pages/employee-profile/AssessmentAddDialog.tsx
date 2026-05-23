/**
 * @module AssessmentAddDialog
 * @description Add-assessment dialog, StarRating helper, and REVIEWER_TYPES
 * for AssessmentTab. Extracted from AssessmentTab.tsx (Rule 16).
 */

import { Star, Shield, Users, UserCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ─── Static data ──────────────────────────────────────────────────────────────

export const REVIEWER_TYPES = [
  { value: "manager",       label: "Rahbar bahosi",             icon: Shield,    color: "bg-blue-500/10 text-[var(--ep-blue)] border-blue-500/20"     },
  { value: "peer",          label: "Hamkasb bahosi (anonim)",   icon: Users,     color: "bg-green-500/10 text-[var(--ep-green)] border-green-500/20"   },
  { value: "subordinate",   label: "Qo'l ostidagi xodim",       icon: UserCheck, color: "bg-purple-500/10 text-[var(--ep-purple)] border-purple-500/20"},
  { value: "service_chain", label: "Xizmat zanjiri",            icon: Link2,     color: "bg-orange-500/10 text-[var(--ep-primary)] border-orange-500/20"},
];

// ─── StarRating helper ────────────────────────────────────────────────────────

export function StarRating({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {([1, 2, 3, 4, 5]).map((s) => (
        <Star
          key={s}
          className={`${iconSize} ${s <= score ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssessmentForm {
  reviewerType: string;
  reviewerName: string;
  score: number;
  comment: string;
  isAnonymous: boolean;
}

interface AssessmentAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AssessmentForm;
  setForm: (form: AssessmentForm) => void;
  onSave: () => void;
  isPending: boolean;
  t: (key: string) => string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssessmentAddDialog({
  open, onOpenChange, form, setForm, onSave, isPending, t,
}: AssessmentAddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangi360Baho")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label>{t("bahovchiTuri")}</Label>
            <Select value={form.reviewerType} onValueChange={(v) => setForm({ ...form, reviewerType: v })}>
              <SelectTrigger data-testid="select-reviewer-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REVIEWER_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anon-check"
                checked={form.isAnonymous}
                onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                className="h-4 w-4"
                data-testid="checkbox-anonymous"
              />
              <Label htmlFor="anon-check">{t("anonim")}</Label>
            </div>
          </div>

          {!form.isAnonymous && (
            <div className="space-y-1">
              <Label>{t("bahovchiIsmi")}</Label>
              <Input
                value={form.reviewerName}
                onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
                placeholder={t("ismFamiliya")}
                data-testid="input-reviewer-name"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>{t("baho15")}</Label>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4, 5]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, score: s })}
                  className="focus:outline-none"
                  data-testid={`star-${s}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${s <= form.score ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                  />
                </button>
              ))}
              <span className="text-sm font-medium text-muted-foreground ml-1">{form.score}/5</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("Izoh")}</Label>
            <Input
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder={t("qoshimchaIzoh")}
              data-testid="input-assessment-comment"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onSave}
            disabled={isPending}
            data-testid="button-save-assessment"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
