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
// ---------------------------------------------------------------------------
// Visitor dialog
// ---------------------------------------------------------------------------

interface VisitorDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: VisitorForm; onChange: (p: Partial<VisitorForm>) => void;
  isPending: boolean; onSubmit: () => void;
}

export function VisitorDialog({ open, onOpenChange, form, onChange, isPending, onSubmit }: VisitorDialogProps) {
  const disabled = isPending || !form.fullName || !form.purpose || !form.hostEmployeeName;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi Tashrif</DialogTitle>
          <DialogDescription>Tashrifchini ro'yxatdan o'tkazing</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">To'liq ismi *</label>
            <Input value={form.fullName} onChange={e => onChange({ fullName: e.target.value })}
              placeholder="Abdullayev Bobur" data-testid="input-visitor-name" />
          </div>
          <div>
            <label className="text-sm font-medium">Kompaniya</label>
            <Input value={form.company} onChange={e => onChange({ company: e.target.value })}
              placeholder="Kompaniya nomi" data-testid="input-visitor-company" />
          </div>
          <div>
            <label className="text-sm font-medium">Maqsad *</label>
            <Input value={form.purpose} onChange={e => onChange({ purpose: e.target.value })}
              placeholder="Yig'ilish, auditorlik..." data-testid="input-visitor-purpose" />
          </div>
          <div>
            <label className="text-sm font-medium">Mezboni *</label>
            <Input value={form.hostEmployeeName} onChange={e => onChange({ hostEmployeeName: e.target.value })}
              placeholder="Qaysi xodimga keldi" data-testid="input-visitor-host" />
          </div>
          <div>
            <label className="text-sm font-medium">Nishon raqami</label>
            <Input value={form.badgeNumber} onChange={e => onChange({ badgeNumber: e.target.value })}
              placeholder="V-001" data-testid="input-visitor-badge" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
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
          <DialogTitle className="text-[18px] font-semibold">Hodisa Qayd Etish</DialogTitle>
          <DialogDescription>Xavfsizlik hodisasini qayd eting</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Hodisa turi *</label>
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
            <label className="text-sm font-medium">Tavsif *</label>
            <Textarea value={form.description} onChange={e => onChange({ description: e.target.value })}
              placeholder="Hodisani batafsil tavsiflang" data-testid="input-incident-description" rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium">Joylasuv *</label>
            <Input value={form.location} onChange={e => onChange({ location: e.target.value })}
              placeholder="Ombor, Sex-1..." data-testid="input-incident-location" />
          </div>
          <div>
            <label className="text-sm font-medium">Darajasi</label>
            <Select value={form.severity} onValueChange={v => onChange({ severity: v })}>
              <SelectTrigger data-testid="select-incident-severity" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Yuqori</SelectItem>
                <SelectItem value="medium">O'rta</SelectItem>
                <SelectItem value="low">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Qayd etgan *</label>
            <Input value={form.reportedBy} onChange={e => onChange({ reportedBy: e.target.value })}
              placeholder="Kim xabar berdi" data-testid="input-incident-reporter" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
          <Button onClick={onSubmit} data-testid="button-submit-incident">Qayd etish</Button>
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
          <DialogTitle className="text-[18px] font-semibold">PPE Tekshiruvi</DialogTitle>
          <DialogDescription>Xodim shaxsiy himoya vositalarini tekshiring</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Xodim ismi *</label>
            <Input value={form.employeeName} onChange={e => onChange({ employeeName: e.target.value })}
              placeholder="Ismi Familiyasi" data-testid="input-ppe-employee" />
          </div>
          <div>
            <label className="text-sm font-medium">Bo'lim *</label>
            <Input value={form.department} onChange={e => onChange({ department: e.target.value })}
              placeholder="Ishlab chiqarish, Ombor..." data-testid="input-ppe-department" />
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
            <label className="text-sm font-medium">Izoh</label>
            <Input value={form.notes} onChange={e => onChange({ notes: e.target.value })}
              placeholder="Muammo bo'lsa yozing" data-testid="input-ppe-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
          <Button onClick={onSubmit} data-testid="button-submit-ppe">Saqlash</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
