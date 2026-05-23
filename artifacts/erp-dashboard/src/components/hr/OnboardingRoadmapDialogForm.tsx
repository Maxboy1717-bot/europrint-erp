/**
 * @module OnboardingRoadmapDialogForm
 * @description Form step for OnboardingRoadmapDialog (step="form").
 * Split from OnboardingRoadmapDialog.tsx (Rule 16).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Map, CheckCircle2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type { Employee, RoadmapFormData } from "./OnboardingRoadmapDialog.types";

interface RoadmapFormProps {
  form: RoadmapFormData;
  setForm: React.Dispatch<React.SetStateAction<RoadmapFormData>>;
  employees: Employee[];
  hasExistingRoadmap: boolean;
  onClose: () => void;
  onViewExisting: () => void;
  onGenerate: () => void;
  isPending: boolean;
}

export function OnboardingRoadmapDialogForm({
  form, setForm, employees, hasExistingRoadmap,
  onClose, onViewExisting, onGenerate, isPending,
}: RoadmapFormProps) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4 py-2">
      {hasExistingRoadmap && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {t("buNomzodUchunYolXaritasi")}
          <Button
            size="sm" variant="outline"
            className="ml-auto h-6 text-[10px] border-emerald-500/40 text-emerald-400"
            onClick={onViewExisting}
          >
            {t("view")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{t("lavozimNomi")}</Label>
          <Input
            value={form.lavozim_nomi}
            onChange={e => setForm(f => ({ ...f, lavozim_nomi: e.target.value }))}
            placeholder={t("masalanMarketingMenejeri")}
            className="h-8 text-sm mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{t("bolinma")}</Label>
          <Input
            value={form.bolim}
            onChange={e => setForm(f => ({ ...f, bolim: e.target.value }))}
            placeholder={t("masalanMarketingBolimi")}
            className="h-8 text-sm mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{t("nastavnik")}</Label>
          <Select value={form.nastavnik_id} onValueChange={v => setForm(f => ({ ...f, nastavnik_id: v }))}>
            <SelectTrigger className="h-9 text-sm mt-1">
              <SelectValue placeholder={t("nastavnikTanlang")} />
            </SelectTrigger>
            <SelectContent>
              {employees.slice(0, 50).map(emp => {
                const name = emp.full_name || emp.fullName ||
                  `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || `#${emp.id}`;
                return <SelectItem key={emp.id} value={String(emp.id)}>{name}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">{t("kirishSanasi")}</Label>
          <Input
            type="date"
            value={form.kirish_sanasi}
            onChange={e => setForm(f => ({ ...f, kirish_sanasi: e.target.value }))}
            className="h-8 text-sm mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">{t("reglamentlarRoYxatiHarBirQator")}</Label>
        <Textarea
          value={form.reglamentlar}
          onChange={e => setForm(f => ({ ...f, reglamentlar: e.target.value }))}
          placeholder={"Mehnat tartib-qoidalari\nIsh xavfsizligi bo'yicha yo'riqnoma\nMijozlar bilan ishlash standartlari"}
          className="text-sm mt-1 min-h-[80px]"
        />
      </div>

      <div>
        <Label className="text-xs">{t("haftalikMaqsadlar4Hafta")}</Label>
        <div className="space-y-2 mt-1">
          {([0, 1, 2, 3] as const).map(i => (
            <Input
              key={`week-${i}`}
              value={form.haftalik_maqsadlar[i]}
              onChange={e => setForm(f => {
                const arr: [string, string, string, string] = [...f.haftalik_maqsadlar];
                arr[i] = e.target.value;
                return { ...f, haftalik_maqsadlar: arr };
              })}
              placeholder={`${i + 1}-hafta maqsadi`}
              className="h-8 text-sm"
            />
          ))}
        </div>
      </div>

      <div className="w-32">
        <Label className="text-xs">{t("sinovMuddatiOy")}</Label>
        <Select value={form.sinov_muddat_oy} onValueChange={v => setForm(f => ({ ...f, sinov_muddat_oy: v }))}>
          <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["1", "2", "3", "6"].map(v => (
              <SelectItem key={v} value={v}>{v} oy</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
        <Button onClick={onGenerate} disabled={isPending} className="gap-2" data-testid="button-generate-roadmap">
          <Map className="h-4 w-4" />
          {isPending ? "Saqlanmoqda..." : "Yo'l xaritasini yaratish"}
        </Button>
      </DialogFooter>
    </div>
  );
}
