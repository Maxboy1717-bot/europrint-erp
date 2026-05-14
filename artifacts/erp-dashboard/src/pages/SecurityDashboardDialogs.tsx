/**
 * @module SecurityDashboardDialogs
 * @description Modal dialog components for the Security Dashboard: visitor
 * registration, security incident reporting, and PPE inspection entry.
 * Each dialog is purely presentational — form state and submit callbacks
 * are owned by the parent orchestrator.
 */

;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INCIDENT_TYPE_LABEL, type VisitorForm, type IncidentForm, type PPEForm } from "./SecurityDashboardTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ---------------------------------------------------------------------------
// Visitor dialog
// ---------------------------------------------------------------------------

interface VisitorDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: VisitorForm; onChange: (p: Partial<VisitorForm>) => void;
  isPending: boolean; onSubmit: () => void;
}

export function VisitorDialog({ open, onOpenChange, form, onChange, isPending, onSubmit }: VisitorDialogProps) {
  const { t } = useTranslation("common");
  const disabled = isPending || !form.fullName || !form.purpose || !form.hostEmployeeName;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiTashrif")}</DialogTitle>
          <DialogDescription>{t("tashrifchiniRoyxatdanOtkazing")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">{t("toliqIsmi1")}</label>
            <Input value={form.fullName} onChange={e => onChange({ fullName: e.target.value })}
              placeholder={t("abdullayevBobur")} data-testid="input-visitor-name" />
          </div>
          <div>
            <label className="text-sm font-medium">{t("company")}</label>
            <Input value={form.company} onChange={e => onChange({ company: e.target.value })}
              placeholder={t("kompaniyaNomi1")} data-testid="input-visitor-company" />
          </div>
          <div>
            <label className="text-sm font-medium">{t("maqsad")}</label>
            <Input value={form.purpose} onChange={e => onChange({ purpose: e.target.value })}
              placeholder={t("yigilishAuditorlik")} data-testid="input-visitor-purpose" />
          </div>
          <div>
            <label className="text-sm font-medium">{t("mezboni")}</label>
            <Input value={form.hostEmployeeName} onChange={e => onChange({ hostEmployeeName: e.target.value })}
              placeholder={t("qaysiXodimgaKeldi")} data-testid="input-visitor-host" />
          </div>
          <div>
            <label className="text-sm font-medium">{t("nishonRaqami")}</label>
            <Input value={form.badgeNumber} onChange={e => onChange({ badgeNumber: e.target.value })}
              placeholder="V-001" data-testid="input-visitor-badge" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button disabled={disabled} data-testid="button-submit-visitor" onClick={onSubmit}>
            {isPending && <EPLoader className="w-4 h-4 mr-2" />}Qayd etish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Incident dialog
// ---------------------------------------------------------------------------

interface IncidentDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: IncidentForm; onChange: (p: Partial<IncidentForm>) => void;
  onSubmit: () => void;
}

export function IncidentDialog({ open, onOpenChange, form, onChange, onSubmit }: IncidentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("hodisaQaydEtish1")}</DialogTitle>
          <DialogDescription>{t("xavfsizlikHodisasiniQaydEting")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">{t("hodisaTuri1")}</label>
            <Select value={form.type} onValueChange={v => onChange({ type: v })}>
              <SelectTrigger data-testid="select-incident-type" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(INCIDENT_TYPE_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">{t("tavsif")}</label>
            <Textarea value={form.description} onChange={e => onChange({ description: e.target.value })}
              placeholder={t("hodisaniBatafsilTavsiflang")} data-testid="input-incident-description" rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium">{t("joylasuv")}</label>
            <Input value={form.location} onChange={e => onChange({ location: e.target.value })}
              placeholder={t("omborSex1")} data-testid="input-incident-location" />
          </div>
          <div>
            <label className="text-sm font-medium">{t("darajasi")}</label>
            <Select value={form.severity} onValueChange={v => onChange({ severity: v })}>
              <SelectTrigger data-testid="select-incident-severity" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">{t("high")}</SelectItem>
                <SelectItem value="medium">{t("medium")}</SelectItem>
                <SelectItem value="low">{t("low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">{t("qaydEtgan")}</label>
            <Input value={form.reportedBy} onChange={e => onChange({ reportedBy: e.target.value })}
              placeholder={t("kimXabarBerdi")} data-testid="input-incident-reporter" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button onClick={onSubmit} data-testid="button-submit-incident">{t("qaydEtish")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// PPE dialog
// ---------------------------------------------------------------------------

const PPE_ITEMS: { label: string; key: keyof Pick<PPEForm, "helmetOk" | "vestOk" | "glovesOk" | "bootsOk"> }[] = [
  { label: "Kask", key: "helmetOk" },
  { label: "Xavfsizlik vesti", key: "vestOk" },
  { label: "Qo'lqop", key: "glovesOk" },
  { label: "Maxsus botinqa", key: "bootsOk" },
];

interface PPEDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: PPEForm; onChange: (p: Partial<PPEForm>) => void;
  onSubmit: () => void;
}

export function PPEDialog({ open, onOpenChange, form, onChange, onSubmit }: PPEDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("ppeTekshiruvi")}</DialogTitle>
          <DialogDescription>{t("xodimShaxsiyHimoyaVositalariniTekshiring")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">{t("xodimIsmi1")}</label>
            <Input value={form.employeeName} onChange={e => onChange({ employeeName: e.target.value })}
              placeholder={t("ismiFamiliyasi")} data-testid="input-ppe-employee" />
          </div>
          <div>
            <label className="text-sm font-medium">{t("bolim2")}</label>
            <Input value={form.department} onChange={e => onChange({ department: e.target.value })}
              placeholder={t("ishlabChiqarishOmbor")} data-testid="input-ppe-department" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PPE_ITEMS.map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <input type="checkbox" id={item.key} checked={form[item.key]}
                  onChange={e => onChange({ [item.key]: e.target.checked })}
                  data-testid={`checkbox-ppe-${item.key}`} />
                <label htmlFor={item.key} className="text-sm">{item.label}</label>
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium">{t("Izoh")}</label>
            <Input value={form.notes} onChange={e => onChange({ notes: e.target.value })}
              placeholder={t("muammoBolsaYozing")} data-testid="input-ppe-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button onClick={onSubmit} data-testid="button-submit-ppe">{t("Saqlash")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
