/**
 * @module RecruitingHeaderActions
 * @description React UI component.
 */

import { UseMutationResult } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Briefcase, AlertTriangle } from "lucide-react";
import type { Vacancy } from "@/components/recruiting/types";
import { useTranslation } from '@/lib/i18n';

interface NewForm {
  fullName: string; phone: string; email: string; source: string; notes: string; vacancyId: string;
}

interface NewVacancyForm {
  title: string; vacancy_type: string; deadline_working_days: number;
}

interface RecruitingHeaderActionsProps {
  urgentVacancyCount: number;
  search: string;
  setSearch: (v: string) => void;
  createVacancyOpen: boolean;
  setCreateVacancyOpen: (v: boolean) => void;
  newVacancyForm: NewVacancyForm;
  setNewVacancyForm: React.Dispatch<React.SetStateAction<NewVacancyForm>>;
  createVacancyMutation: UseMutationResult<any, Error, NewVacancyForm>;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  newForm: NewForm;
  setNewForm: React.Dispatch<React.SetStateAction<NewForm>>;
  openVacancies: Vacancy[];
  createMutation: UseMutationResult<any, Error, NewForm>;
}

export function RecruitingHeaderActions({
  urgentVacancyCount, search, setSearch,
  createVacancyOpen, setCreateVacancyOpen, newVacancyForm, setNewVacancyForm, createVacancyMutation,
  addOpen, setAddOpen, newForm, setNewForm, openVacancies, createMutation,
}: RecruitingHeaderActionsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center gap-2">
      {urgentVacancyCount > 0 && <Badge className="bg-[var(--ep-red)] text-white gap-1"><AlertTriangle className="w-3 h-3" />{urgentVacancyCount} SHOSHILINCH</Badge>}
      <Input data-testid="input-search-candidates" placeholder={t("ismYokiTelefon")} value={search} onChange={e => setSearch(e.target.value)} className="w-48 h-9" />
      <Button data-testid="button-create-vacancy" variant="outline" onClick={() => setCreateVacancyOpen(true)} className="border-primary/40 text-primary hover:bg-primary/10">
        <Briefcase className="w-4 h-4 mr-1" />{t("yangiVakansiya")}
      </Button>
      <Dialog open={createVacancyOpen} onOpenChange={setCreateVacancyOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiVakansiyaYaratish")}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">{t("asosiyMalumotlarniKiritingSaqlangandanSong")}</p>
          <div className="flex flex-col gap-3 py-2">
            <div><Label className="text-xs mb-1 block">{t("lavozimNomi1")}<span className="text-red-400">*</span></Label><Input data-testid="input-vacancy-title" placeholder={t("masalanMarketingMenejer")} value={newVacancyForm.title} onChange={e => setNewVacancyForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div>
              <Label className="text-xs mb-1 block">{t("vakansiyaTuri")}</Label>
              <Select value={newVacancyForm.vacancy_type} onValueChange={v => setNewVacancyForm(p => ({ ...p, vacancy_type: v }))}>
                <SelectTrigger data-testid="select-vacancy-type" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">{t("standart15IshKun")}</SelectItem>
                  <SelectItem value="INTERNAL">{t("ichki5IshKun")}</SelectItem>
                  <SelectItem value="COMPLEX">{t("murakkab25IshKun")}</SelectItem>
                  <SelectItem value="TOP_MANAGEMENT">{t("topMenejment40IshKun")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">{t("slaMuddatIshKunlari")}</Label><Input type="number" min={1} max={90} value={newVacancyForm.deadline_working_days} onChange={e => setNewVacancyForm(p => ({ ...p, deadline_working_days: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateVacancyOpen(false)}>{t("Bekor")}</Button>
            <Button data-testid="button-submit-vacancy" onClick={() => createVacancyMutation.mutate(newVacancyForm)} disabled={!newVacancyForm.title.trim() || createVacancyMutation.isPending}>
              {createVacancyMutation.isPending ? "Saqlanmoqda..." : "Saqlash → Portret to'ldirish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <Button data-testid="button-add-candidate" onClick={() => setAddOpen(true)} className="bg-primary text-primary-foreground border-none">
          <Plus className="w-4 h-4 mr-1" />{t("yangiNomzod")}
        </Button>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiNomzodQoshish")}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input data-testid="input-candidate-name" placeholder={t("toliqIsm1")} value={newForm.fullName} onChange={e => setNewForm(p => ({ ...p, fullName: e.target.value }))} />
            <Input data-testid="input-candidate-phone" placeholder={t("telefonRaqami1")} value={newForm.phone} onChange={e => setNewForm(p => ({ ...p, phone: e.target.value }))} />
            <Input data-testid="input-candidate-email" placeholder={t("emailIxtiyoriy")} value={newForm.email} onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))} />
            <div>
              <Label className="text-xs mb-1 block">{t("vakansiyaIxtiyoriy")}</Label>
              <Select value={newForm.vacancyId} onValueChange={v => setNewForm(p => ({ ...p, vacancyId: v }))}>
                <SelectTrigger data-testid="select-candidate-vacancy" className="h-9"><SelectValue placeholder={t("vakansiyaniTanlang")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("vakansiyaTanlanmagan")}</SelectItem>
                  {(Array.isArray(openVacancies) ? openVacancies : []).map(v => <SelectItem key={v.id} value={String(v.id)}>{v.is_urgent ? "🔴 " : ""}{v.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Select value={newForm.source} onValueChange={v => setNewForm(p => ({ ...p, source: v }))}>
              <SelectTrigger data-testid="select-candidate-source" className="h-9"><SelectValue placeholder={t("manba")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OTHER">{t("qoldaKiritildi")}</SelectItem>
                <SelectItem value="TELEGRAM">{t("telegram")}</SelectItem>
                <SelectItem value="HH_UZ">hh.uz</SelectItem>
                <SelectItem value="REFERRAL">{t("tavsiya")}</SelectItem>
                <SelectItem value="WEBSITE">{t("sayt")}</SelectItem>
              </SelectContent>
            </Select>
            <Input data-testid="input-candidate-notes" placeholder={t("izohIxtiyoriy")} value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))} />
            <Button data-testid="button-submit-candidate" onClick={() => createMutation.mutate(newForm)} disabled={!newForm.fullName || !newForm.phone || createMutation.isPending}>
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
