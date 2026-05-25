/**
 * @module EditPersonalCardDialogs
 * @description Profil sahifasidagi 4 ta read-only kartochka uchun fokuslangan
 *   tahrirlash dialoglari. Hammasi `PATCH /api/employees/:id` orqali saqlaydi —
 *   backend `adaptEmployeePayload` employees + users (drift) jadvallariga
 *   ajratib yozadi.
 *
 *   Dialoglar:
 *     - EditPersonalInfoDialog    — F.I.SH · tug'ilgan sana · jins · yosh
 *     - EditContactInfoDialog     — telefon · manzil · tuman · telegram
 *     - EditWorkConditionsDialog  — ish haqi turi · smena · sex/hudud · attestatsiya
 *     - EditFamilyInfoDialog      — oilaviy holat · farzandlar · uy turi · oila a'zolari
 */

import { ReactNode } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// [2026-05-21 i18n Phase 3.2E] tLabel for module-level form labels
import { tLabel } from "@/lib/i18n/tLabel";

interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSave: () => void;
  isPending: boolean;
  children: ReactNode;
}

function DialogShell({ open, onOpenChange, title, description, onSave, isPending, children }: DialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3 py-2">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Bekor qilish
          </Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PersonalInfo ────────────────────────────────────────────────────────────

export interface PersonalInfoForm {
  fullName: string;
  birthDate: string;
  gender: string;
  age: string;
}

interface PersonalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PersonalInfoForm;
  onChange: (form: PersonalInfoForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function EditPersonalInfoDialog({ open, onOpenChange, form, onChange, onSave, isPending }: PersonalInfoDialogProps) {
  const set = <K extends keyof PersonalInfoForm>(k: K, v: PersonalInfoForm[K]) => onChange({ ...form, [k]: v });
  return (
    <DialogShell
      open={open} onOpenChange={onOpenChange} onSave={onSave} isPending={isPending}
      title={tLabel('hr.editPersonalTitle', "Shaxsiy ma'lumotlarni tahrirlash")}
      description={tLabel('hr.editPersonalDesc', "To'liq ism, tug'ilgan sana, jins va yosh")}
    >
      <div>
        <Label htmlFor="pi-fullName">{tLabel('common.empCardFullName', "To'liq F.I.SH")}</Label>
        <Input id="pi-fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pi-birthDate">{tLabel('common.empCardBirthDate', "Tug'ilgan sana")}</Label>
          <Input id="pi-birthDate" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pi-age">Yosh</Label>
          <Input id="pi-age" type="number" min="0" value={form.age} onChange={(e) => set("age", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Jins</Label>
        <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
          <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="erkak">Erkak</SelectItem>
            <SelectItem value="ayol">Ayol</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </DialogShell>
  );
}

// ─── ContactInfo ─────────────────────────────────────────────────────────────

export interface ContactInfoForm {
  phone: string;
  address: string;
  district: string;
  telegramChatId: string;
}

interface ContactInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ContactInfoForm;
  onChange: (form: ContactInfoForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function EditContactInfoDialog({ open, onOpenChange, form, onChange, onSave, isPending }: ContactInfoDialogProps) {
  const set = <K extends keyof ContactInfoForm>(k: K, v: ContactInfoForm[K]) => onChange({ ...form, [k]: v });
  return (
    <DialogShell
      open={open} onOpenChange={onOpenChange} onSave={onSave} isPending={isPending}
      title={tLabel('hr.editContactTitle', "Aloqa ma'lumotlarini tahrirlash")}
      description={tLabel('hr.editContactDesc', "Telefon, manzil, tuman, Telegram")}
    >
      <div>
        <Label htmlFor="ci-phone">Telefon</Label>
        <Input id="ci-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998..." />
      </div>
      <div>
        <Label htmlFor="ci-address">{tLabel('common.address', 'Manzil')}</Label>
        <Input id="ci-address" value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="ci-district">{tLabel('common.empCardDistrict', 'Tuman / hudud')}</Label>
        <Input id="ci-district" value={form.district} onChange={(e) => set("district", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="ci-tg">{tLabel('common.empCardTelegramChatId', 'Telegram chat ID')}</Label>
        <Input id="ci-tg" value={form.telegramChatId} onChange={(e) => set("telegramChatId", e.target.value)} />
      </div>
    </DialogShell>
  );
}

// ─── WorkConditions ──────────────────────────────────────────────────────────

export interface WorkConditionsForm {
  salaryType: string;
  shift: string;
  workshopZone: string;
  attestationDate: string;
}

interface WorkConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WorkConditionsForm;
  onChange: (form: WorkConditionsForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function EditWorkConditionsDialog({ open, onOpenChange, form, onChange, onSave, isPending }: WorkConditionsDialogProps) {
  const set = <K extends keyof WorkConditionsForm>(k: K, v: WorkConditionsForm[K]) => onChange({ ...form, [k]: v });
  return (
    <DialogShell
      open={open} onOpenChange={onOpenChange} onSave={onSave} isPending={isPending}
      title={tLabel('hr.editWorkCondTitle', "Ish shartlarini tahrirlash")}
      description={tLabel('hr.editWorkCondDesc', "Ish haqi turi, smena, sex/hudud, attestatsiya sanasi")}
    >
      <div>
        <Label>{tLabel('common.empCardSalaryType', 'Ish haqi turi')}</Label>
        <Select value={form.salaryType} onValueChange={(v) => set("salaryType", v)}>
          <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="oylik">{tLabel('common.empCardSalaryFixed', 'Oylik (fiks)')}</SelectItem>
            <SelectItem value="soatbay">Soatbay</SelectItem>
            <SelectItem value="ishbay">{tLabel('common.empCardSalaryPiece', 'Ishbay (akkord)')}</SelectItem>
            <SelectItem value="contract">{tLabel('common.empCardSalaryContract', 'Shartnoma asosida')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{tLabel('common.shift', 'Smena')}</Label>
        <Select value={form.shift} onValueChange={(v) => set("shift", v)}>
          <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="A">{tLabel('common.empCardShiftA', 'A smena')}</SelectItem>
            <SelectItem value="B">{tLabel('common.empCardShiftB', 'B smena')}</SelectItem>
            <SelectItem value="C">{tLabel('common.empCardShiftC', 'C smena')}</SelectItem>
            <SelectItem value="D">{tLabel('common.empCardShiftD', 'D smena')}</SelectItem>
            <SelectItem value="kunlik">Kunlik</SelectItem>
            <SelectItem value="ofis">Ofis</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="wc-zone">{tLabel('common.empCardWorkshop', 'Sex / hudud')}</Label>
        <Input id="wc-zone" value={form.workshopZone} onChange={(e) => set("workshopZone", e.target.value)} placeholder="masalan 1-sex" />
      </div>
      <div>
        <Label htmlFor="wc-attest">{tLabel('common.empCardCertifDate', 'Attestatsiya sanasi')}</Label>
        <Input id="wc-attest" type="date" value={form.attestationDate} onChange={(e) => set("attestationDate", e.target.value)} />
      </div>
    </DialogShell>
  );
}

// ─── FamilyInfo ──────────────────────────────────────────────────────────────

export interface FamilyInfoForm {
  maritalStatus: string;
  childrenCount: string;
  childrenEducation: string;
  housingType: string;
  householdSize: string;
  householdMembers: string;
}

interface FamilyInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FamilyInfoForm;
  onChange: (form: FamilyInfoForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function EditFamilyInfoDialog({ open, onOpenChange, form, onChange, onSave, isPending }: FamilyInfoDialogProps) {
  const set = <K extends keyof FamilyInfoForm>(k: K, v: FamilyInfoForm[K]) => onChange({ ...form, [k]: v });
  return (
    <DialogShell
      open={open} onOpenChange={onOpenChange} onSave={onSave} isPending={isPending}
      title={tLabel('hr.editFamilyTitle', "Oila ma'lumotlarini tahrirlash")}
      description={tLabel('hr.editFamilyDesc', "Oilaviy holat, farzandlar, uy-joy ma'lumotlari")}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{tLabel('common.empCardMaritalStatus', 'Oilaviy holat')}</Label>
          <Select value={form.maritalStatus} onValueChange={(v) => set("maritalStatus", v)}>
            <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="turmush qurmagan">{tLabel('common.empCardMaritalSingle', 'Turmush qurmagan')}</SelectItem>
              <SelectItem value="turmush qurgan">{tLabel('common.empCardMaritalMarried', 'Turmush qurgan')}</SelectItem>
              <SelectItem value="ajrashgan">Ajrashgan</SelectItem>
              <SelectItem value="beva/beva ayol">Beva</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="fi-children">{tLabel('common.empCardChildrenCount', 'Farzandlar soni')}</Label>
          <Input id="fi-children" type="number" min="0" value={form.childrenCount} onChange={(e) => set("childrenCount", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>{tLabel('common.empCardChildrenEducation', "Farzandlar ta'limi")}</Label>
        <Select value={form.childrenEducation} onValueChange={(v) => set("childrenEducation", v)}>
          <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yo'q">{tLabel('common.empCardNoChildren', "Farzand yo'q")}</SelectItem>
            <SelectItem value="maktabgacha">Maktabgacha</SelectItem>
            <SelectItem value="maktabda">Maktabda</SelectItem>
            <SelectItem value="oliy ta'lim">{tLabel('common.empCardChildHigherEd', "Oliy ta'limda")}</SelectItem>
            <SelectItem value="bitirgan">{tLabel('common.empCardChildEducDone', "Ta'limni bitirgan")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{tLabel('common.empCardHousingType', 'Uy turi')}</Label>
          <Select value={form.housingType} onValueChange={(v) => set("housingType", v)}>
            <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="shaxsiy uy">{tLabel('common.empCardHousingOwn', 'Shaxsiy uy')}</SelectItem>
              <SelectItem value="kvartira">Kvartira</SelectItem>
              <SelectItem value="ijara">{tLabel('common.empCardHousingRent', 'Ijaraga olingan')}</SelectItem>
              <SelectItem value="yotoqxona">Yotoqxona</SelectItem>
              <SelectItem value="qarindoshlar bilan">{tLabel('common.empCardHousingRelatives', 'Qarindoshlar bilan')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="fi-hsize">{tLabel('common.empCardHouseholdSize', 'Oilada nechta kishi')}</Label>
          <Input id="fi-hsize" type="number" min="1" value={form.householdSize} onChange={(e) => set("householdSize", e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="fi-members">{tLabel('common.empCardLivesWith', 'Kimlar bilan yashaydi')}</Label>
        <Input id="fi-members" value={form.householdMembers} onChange={(e) => set("householdMembers", e.target.value)} placeholder={tLabel('hr.editFamilyMembersPlaceholder', "masalan: Turmush o'rtog'i, 2 ta farzand")} />
      </div>
    </DialogShell>
  );
}
