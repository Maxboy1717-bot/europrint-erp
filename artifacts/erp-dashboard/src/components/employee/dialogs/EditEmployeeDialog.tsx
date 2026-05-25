/**
 * @module EditEmployeeDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from '@/lib/i18n';

interface EditEmployeeForm {
  fullName: string;
  employeeId: string;
  phone: string;
  telegramChatId: string;
  birthDate: string;
  hireDate: string;
  attestationDate: string;
  address: string;
  gender: string;
  status: string;
  shift: string;
  workshopZone: string;
  salaryType: string;
  positionId: string;
  departmentId: string;
  age: string;
  maritalStatus: string;
  childrenCount: string;
  childrenEducation: string;
  housingType: string;
  householdSize: string;
  householdMembers: string;
  latitude: string;
  longitude: string;
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: EditEmployeeForm;
  onChange: (form: EditEmployeeForm) => void;
  onSave: () => void;
  isPending: boolean;
  allDepartments: { id: string; name: string }[];
  allPositions: { id: string; name: string }[];
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending,
  allDepartments,
  allPositions
}: EditEmployeeDialogProps) {
  const { t } = useTranslation("common");
  const updateField = (field: keyof EditEmployeeForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("xodimMalumotlariniTahrirlash")}</DialogTitle>
          <DialogDescription>{t("asosiyMalumotlarniOzgartiringVaSaqlang")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Main Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">{t("asosiyMalumotlar")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="edit-fullName">{t("toliqIsmi")}</Label>
                <Input id="edit-fullName" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-employeeId">{t("tabelRaqami")}</Label>
                <Input id="edit-employeeId" value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-phone">{t("telefonRaqami")}</Label>
                <Input id="edit-phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-telegram">{t("telegramId")}</Label>
                <Input id="edit-telegram" value={form.telegramChatId} onChange={(e) => updateField("telegramChatId", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{t("jinsi")}</Label>
                <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="erkak">{t("erkak")}</SelectItem>
                    <SelectItem value="ayol">{t("ayol")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">{t("ishMalumotlari")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("bolim1")}</Label>
                <Select value={form.departmentId} onValueChange={(v) => updateField("departmentId", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("bolimTanlang")} /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(allDepartments) ? allDepartments : []).map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("lavozim1")}</Label>
                <Select value={form.positionId} onValueChange={(v) => updateField("positionId", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("lavozimTanlang")} /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(allPositions) ? allPositions : []).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("smena")}</Label>
                <Select value={form.shift} onValueChange={(v) => updateField("shift", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A smena">{t("aSmena07001500")}</SelectItem>
                    <SelectItem value="B smena">{t("bSmena15002300")}</SelectItem>
                    <SelectItem value="C smena">{t("cSmena23000700")}</SelectItem>
                    <SelectItem value="D smena">{t("dSmenaKunduzgi")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("holati")}</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="on_leave">{t("tatilda")}</SelectItem>
                    <SelectItem value="sick">{t("kasalxonada")}</SelectItem>
                    <SelectItem value="inactive">{t("inactive")}</SelectItem>
                    <SelectItem value="terminated">{t("ishdanBoshatilgan")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("maoshTuri")}</Label>
                <Select value={form.salaryType} onValueChange={(v) => updateField("salaryType", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t("oylikStavka")}</SelectItem>
                    <SelectItem value="hourly">{t("soatbay")}</SelectItem>
                    <SelectItem value="piecework">{t("akkord")}</SelectItem>
                    <SelectItem value="contract">{t("shartnomaAsosida")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-workshopZone">{t("sexZona")}</Label>
                <Input id="edit-workshopZone" value={form.workshopZone} onChange={(e) => updateField("workshopZone", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">{t("sanalar")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-birthDate">{t("tugilganSana")}</Label>
                <Input id="edit-birthDate" type="date" value={form.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-hireDate">{t("ishgaKirishSanasi")}</Label>
                <Input id="edit-hireDate" type="date" value={form.hireDate} onChange={(e) => updateField("hireDate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-attestationDate">{t("attestatsiyaSanasi")}</Label>
                <Input id="edit-attestationDate" type="date" value={form.attestationDate} onChange={(e) => updateField("attestationDate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-age">{t("yoshi")}</Label>
                <Input id="edit-age" type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Address & Geo */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">{t("manzilJoylashuv")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="edit-address">{t("address")}</Label>
                <Input id="edit-address" value={form.address} onChange={(e) => updateField("address", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-latitude">{t("kenglikLatitude")}</Label>
                <Input id="edit-latitude" value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-longitude">{t("uzunlikLongitude")}</Label>
                <Input id="edit-longitude" value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Personal */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">{t("shaxsiyMalumotlar")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("oilaviyHolati")}</Label>
                <Select value={form.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="turmush qurmagan">{t("turmushQurmagan")}</SelectItem>
                    <SelectItem value="turmush qurgan">{t("turmushQurgan")}</SelectItem>
                    <SelectItem value="ajrashgan">{t("ajrashgan")}</SelectItem>
                    <SelectItem value="beva/beva ayol">{t("bevaBevaAyol")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-childrenCount">{t("farzandlarSoni")}</Label>
                <Input id="edit-childrenCount" type="number" value={form.childrenCount} onChange={(e) => updateField("childrenCount", e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>{t("farzandlarningTalimHolati")}</Label>
                <Select value={form.childrenEducation} onValueChange={(v) => updateField("childrenEducation", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yo'q">{t("farzandYoq")}</SelectItem>
                    <SelectItem value="maktabgacha">{t("maktabgacha")}</SelectItem>
                    <SelectItem value="maktabda">{t("maktabda")}</SelectItem>
                    <SelectItem value="oliy ta'lim">{t("oliyTalimda")}</SelectItem>
                    <SelectItem value="bitirgan">{t("talimniBitirgan")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Housing */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">{t("uyJoySharoiti")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t("uyTuri")}</Label>
                <Select value={form.housingType} onValueChange={(v) => updateField("housingType", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shaxsiy uy">{t("shaxsiyUy")}</SelectItem>
                    <SelectItem value="kvartira">{t("kvartira")}</SelectItem>
                    <SelectItem value="ijara">{t("ijaragaOlingan")}</SelectItem>
                    <SelectItem value="yotoqxona">{t("yotoqxona")}</SelectItem>
                    <SelectItem value="qarindoshlar bilan">{t("qarindoshlarBilan")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-householdSize">{t("oilaAzolariSoni")}</Label>
                <Input id="edit-householdSize" type="number" value={form.householdSize} onChange={(e) => updateField("householdSize", e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-householdMembers">{t("kimlarBilanYashaydi")}</Label>
                <Input id="edit-householdMembers" value={form.householdMembers} onChange={(e) => updateField("householdMembers", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
