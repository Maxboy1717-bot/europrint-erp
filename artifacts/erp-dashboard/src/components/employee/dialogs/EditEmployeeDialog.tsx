import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const updateField = (field: keyof EditEmployeeForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xodim ma'lumotlarini tahrirlash</DialogTitle>
          <DialogDescription>Asosiy ma'lumotlarni o'zgartiring va saqlang.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Main Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">Asosiy ma'lumotlar</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="edit-fullName">To'liq ismi</Label>
                <Input id="edit-fullName" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-employeeId">Tabel raqami</Label>
                <Input id="edit-employeeId" value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefon raqami</Label>
                <Input id="edit-phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-telegram">Telegram ID</Label>
                <Input id="edit-telegram" value={form.telegramChatId} onChange={(e) => updateField("telegramChatId", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Jinsi</Label>
                <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="erkak">Erkak</SelectItem>
                    <SelectItem value="ayol">Ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">Ish ma'lumotlari</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bo'lim</Label>
                <Select value={form.departmentId} onValueChange={(v) => updateField("departmentId", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Bo'lim tanlang" /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(allDepartments) ? allDepartments : []).map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lavozim</Label>
                <Select value={form.positionId} onValueChange={(v) => updateField("positionId", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Lavozim tanlang" /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(allPositions) ? allPositions : []).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Smena</Label>
                <Select value={form.shift} onValueChange={(v) => updateField("shift", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A smena">A smena (07:00–15:00)</SelectItem>
                    <SelectItem value="B smena">B smena (15:00–23:00)</SelectItem>
                    <SelectItem value="C smena">C smena (23:00–07:00)</SelectItem>
                    <SelectItem value="D smena">D smena (Kunduzgi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Holati</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Faol</SelectItem>
                    <SelectItem value="on_leave">Ta'tilda</SelectItem>
                    <SelectItem value="sick">Kasalxonada</SelectItem>
                    <SelectItem value="inactive">Nofaol</SelectItem>
                    <SelectItem value="terminated">Ishdan bo'shatilgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Maosh turi</Label>
                <Select value={form.salaryType} onValueChange={(v) => updateField("salaryType", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Oylik stavka</SelectItem>
                    <SelectItem value="hourly">Soatbay</SelectItem>
                    <SelectItem value="piecework">Akkord</SelectItem>
                    <SelectItem value="contract">Shartnoma asosida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-workshopZone">Sex / Zona</Label>
                <Input id="edit-workshopZone" value={form.workshopZone} onChange={(e) => updateField("workshopZone", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">Sanalar</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-birthDate">Tug'ilgan sana</Label>
                <Input id="edit-birthDate" type="date" value={form.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-hireDate">Ishga kirish sanasi</Label>
                <Input id="edit-hireDate" type="date" value={form.hireDate} onChange={(e) => updateField("hireDate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-attestationDate">Attestatsiya sanasi</Label>
                <Input id="edit-attestationDate" type="date" value={form.attestationDate} onChange={(e) => updateField("attestationDate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-age">Yoshi</Label>
                <Input id="edit-age" type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Address & Geo */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">Manzil & Joylashuv</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="edit-address">Manzil</Label>
                <Input id="edit-address" value={form.address} onChange={(e) => updateField("address", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-latitude">Kenglik (Latitude)</Label>
                <Input id="edit-latitude" value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Uzunlik (Longitude)</Label>
                <Input id="edit-longitude" value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Personal */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">Shaxsiy ma'lumotlar</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Oilaviy holati</Label>
                <Select value={form.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="turmush qurmagan">Turmush qurmagan</SelectItem>
                    <SelectItem value="turmush qurgan">Turmush qurgan</SelectItem>
                    <SelectItem value="ajrashgan">Ajrashgan</SelectItem>
                    <SelectItem value="beva/beva ayol">Beva/Beva ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-childrenCount">Farzandlar soni</Label>
                <Input id="edit-childrenCount" type="number" value={form.childrenCount} onChange={(e) => updateField("childrenCount", e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Farzandlarning ta'lim holati</Label>
                <Select value={form.childrenEducation} onValueChange={(v) => updateField("childrenEducation", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yo'q">Farzand yo'q</SelectItem>
                    <SelectItem value="maktabgacha">Maktabgacha</SelectItem>
                    <SelectItem value="maktabda">Maktabda</SelectItem>
                    <SelectItem value="oliy ta'lim">Oliy ta'limda</SelectItem>
                    <SelectItem value="bitirgan">Ta'limni bitirgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Housing */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">Uy-joy sharoiti</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Uy turi</Label>
                <Select value={form.housingType} onValueChange={(v) => updateField("housingType", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shaxsiy uy">Shaxsiy uy</SelectItem>
                    <SelectItem value="kvartira">Kvartira</SelectItem>
                    <SelectItem value="ijara">Ijaraga olingan</SelectItem>
                    <SelectItem value="yotoqxona">Yotoqxona</SelectItem>
                    <SelectItem value="qarindoshlar bilan">Qarindoshlar bilan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-householdSize">Oila a'zolari soni</Label>
                <Input id="edit-householdSize" type="number" value={form.householdSize} onChange={(e) => updateField("householdSize", e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-householdMembers">Kimlar bilan yashaydi</Label>
                <Input id="edit-householdMembers" value={form.householdMembers} onChange={(e) => updateField("householdMembers", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
