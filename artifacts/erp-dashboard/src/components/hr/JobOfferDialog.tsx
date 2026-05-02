import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Send, Briefcase } from "lucide-react";

interface JobOfferFormData {
  position: string;
  department: string;
  start_date: string;
  probation_months: string;
  salary_probation: string;
  salary_main: string;
  work_schedule: string;
  offer_valid_until: string;
  additional_conditions: string;
}

interface JobOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: number;
  candidateName: string;
  funnelId: number;
  vacancyTitle?: string | null;
}

const SCHEDULE_OPTIONS = [
  { value: "5/2 (09:00-18:00)", label: "5/2 (09:00-18:00)" },
  { value: "6/1 (09:00-18:00)", label: "6/1 (09:00-18:00)" },
  { value: "Smenali (2/2)", label: "Smenali (2/2)" },
  { value: "Erkin (masofaviy)", label: "Erkin (masofaviy)" },
  { value: "Gibrid", label: "Gibrid" },
];

export function JobOfferDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  funnelId,
  vacancyTitle,
}: JobOfferDialogProps) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [savedData, setSavedData] = useState<JobOfferFormData | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const oneWeekLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [form, setForm] = useState<JobOfferFormData>({
    position: vacancyTitle ?? "",
    department: "",
    start_date: today,
    probation_months: "3",
    salary_probation: "",
    salary_main: "",
    work_schedule: "5/2 (09:00-18:00)",
    offer_valid_until: oneWeekLater,
    additional_conditions: "",
  });

  const set = (key: keyof JobOfferFormData) => (val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/hr/recruitment/job-offers", {
        candidate_id: candidateId,
        funnel_id: funnelId,
        ...form,
        salary_probation: form.salary_probation ? Number(form.salary_probation) : null,
        salary_main: form.salary_main ? Number(form.salary_main) : null,
        probation_months: Number(form.probation_months),
      }),
    onSuccess: () => {
      setSaved(true);
      setSavedData(form);
      toast({ title: "Job Offer saqlandi", description: "Endi print / PDF qilishingiz mumkin." });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Job Offer saqlanmadi", variant: "destructive" });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const printDate = new Date().toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-400" />
            Job Offer — {candidateName}
          </DialogTitle>
        </DialogHeader>

        {!saved ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Lavozim <span className="text-red-400">*</span></Label>
                <Input
                  value={form.position}
                  onChange={(e) => set("position")(e.target.value)}
                  placeholder="Masalan: Marketing menejer"
                  data-testid="input-offer-position"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Bo'linma / Departament</Label>
                <Input
                  value={form.department}
                  onChange={(e) => set("department")(e.target.value)}
                  placeholder="Masalan: Savdo bo'limi"
                  data-testid="input-offer-department"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Ishga kirish sanasi <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date")(e.target.value)}
                  data-testid="input-offer-start-date"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Sinov muddati (oy)</Label>
                <Select value={form.probation_months} onValueChange={set("probation_months")}>
                  <SelectTrigger data-testid="select-offer-probation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 oy</SelectItem>
                    <SelectItem value="2">2 oy</SelectItem>
                    <SelectItem value="3">3 oy</SelectItem>
                    <SelectItem value="6">6 oy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Maosh (sinov muddati, UZS)</Label>
                <Input
                  type="number"
                  value={form.salary_probation}
                  onChange={(e) => set("salary_probation")(e.target.value)}
                  placeholder="Masalan: 4000000"
                  data-testid="input-offer-salary-probation"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Maosh (asosiy, UZS)</Label>
                <Input
                  type="number"
                  value={form.salary_main}
                  onChange={(e) => set("salary_main")(e.target.value)}
                  placeholder="Masalan: 6000000"
                  data-testid="input-offer-salary-main"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Ish tartibi (grafik)</Label>
                <Select value={form.work_schedule} onValueChange={set("work_schedule")}>
                  <SelectTrigger data-testid="select-offer-schedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(SCHEDULE_OPTIONS) ? SCHEDULE_OPTIONS : []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Taklif amal qilish muddati</Label>
                <Input
                  type="date"
                  value={form.offer_valid_until}
                  onChange={(e) => set("offer_valid_until")(e.target.value)}
                  data-testid="input-offer-valid-until"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Qo'shimcha shartlar</Label>
              <Textarea
                value={form.additional_conditions}
                onChange={(e) => set("additional_conditions")(e.target.value)}
                placeholder="Ijtimoiy paket, transport, sog'liqni saqlash, bonus..."
                rows={3}
                data-testid="textarea-offer-conditions"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Print-ready offer preview */}
            <div
              id="job-offer-print-area"
              className="border border-gray-300 rounded-lg p-6 bg-white text-gray-800 print:border-0 print:p-0"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold uppercase tracking-wide">ISH TAKLIFI</h2>
                <p className="text-sm text-gray-500">{printDate}</p>
              </div>
              <p className="text-sm mb-4">
                Hurmatli <strong>{candidateName}</strong>,
              </p>
              <p className="text-sm mb-6">
                Sizni <strong>EuroPrint</strong> kompaniyasiga quyidagi shartlarda taklif qilishdan mamnunmiz:
              </p>

              <table className="w-full text-sm border-collapse mb-6">
                <tbody>
                  {([
                    ["Lavozim", savedData?.position],
                    ["Bo'linma", savedData?.department || "—"],
                    ["Ishga kirish sanasi", savedData?.start_date],
                    ["Sinov muddati", `${savedData?.probation_months} oy`],
                    ["Maosh (sinov muddati)", savedData?.salary_probation ? `${Number(savedData.salary_probation).toLocaleString()} UZS` : "—"],
                    ["Maosh (asosiy)", savedData?.salary_main ? `${Number(savedData.salary_main).toLocaleString()} UZS` : "—"],
                    ["Ish tartibi", savedData?.work_schedule],
                    ["Taklif amal qilish muddati", savedData?.offer_valid_until],
                  ]).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-200">
                      <td className="py-2 pr-4 font-medium text-gray-600 w-48">{label}</td>
                      <td className="py-2 font-semibold text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {savedData?.additional_conditions && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Qo'shimcha shartlar:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">{savedData.additional_conditions}</p>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Nomzod imzosi</p>
                  <div className="mt-4 border-b border-gray-400 w-40" />
                  <p className="text-xs text-gray-500 mt-1">{candidateName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">HR menejer imzosi</p>
                  <div className="mt-4 border-b border-gray-400 w-40" />
                  <p className="text-xs text-gray-500 mt-1">EuroPrint HR</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!saved ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!form.position.trim() || !form.start_date || submitMutation.isPending}
                className="gap-2"
                data-testid="button-submit-offer"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setSaved(false); }}>Tahrirlash</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Yopish</Button>
              <Button className="gap-2" onClick={handlePrint} data-testid="button-print-offer">
                <Printer className="w-4 h-4" />
                PDF / Chop etish
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
