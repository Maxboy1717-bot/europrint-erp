/**
 * @module OnboardingRoadmapDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Map, Printer, ChevronRight, User, Calendar, BookOpen, CheckCircle2, ClipboardList } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface Employee {
  id: number | string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  full_name?: string;
}

interface RoadmapFormData {
  lavozim_nomi: string;
  bolim: string;
  nastavnik_id: string;
  kirish_sanasi: string;
  reglamentlar: string;
  haftalik_maqsadlar: [string, string, string, string];
  sinov_muddat_oy: string;
}

interface GeneratedRoadmap {
  lavozim_nomi: string;
  bolim: string;
  nastavnik_name: string;
  kirish_sanasi: string;
  sinov_muddat_oy: number;
  weeks: {
    week: number;
    label: string;
    tasks: string[];
    meeting: string;
  }[];
  final_checkpoints: string[];
  reglamentlar: string[];
}

interface OnboardingRoadmapDialogProps {
  open: boolean;
  onClose: () => void;
  pipelineEntryId: number;
  candidateName: string;
  vacancyTitle?: string | null;
}

function generateRoadmap(form: RoadmapFormData, nastavnikName: string): GeneratedRoadmap {
  const reglamentlar = form.reglamentlar
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  const weeks = [
    {
      week: 1,
      label: "1-hafta: Materiallarni o'qish va adaptatsiya",
      tasks: [
        ...reglamentlar.slice(0, 3).map(r => `O'qish: ${r}`),
        "Kompaniya tuzilmasi va jarayonlar bilan tanishish",
        "Nastavnik bilan uchrashuv va reja tuzish",
      ],
      meeting: "Nastavnik bilan kirish suhbati",
    },
    {
      week: 2,
      label: "2-hafta: Amaliy vazifalar",
      tasks: [
        form.haftalik_maqsadlar[0] || "Asosiy vazifalarni o'rganish",
        ...reglamentlar.slice(3).map(r => `O'qish: ${r}`),
        "Birinchi mustaqil ish topshirig'ini bajarish",
      ],
      meeting: "Haftalik tekshiruv — 1-hafta natijalari",
    },
    {
      week: 3,
      label: "3-hafta: Mustaqil ishlash",
      tasks: [
        form.haftalik_maqsadlar[1] || "Mustaqil loyihada ishlash",
        "Jamoaviy uchrashuvlarda qatnashish",
        "Nastavnik ko'magida murakkab vazifalarni bajarish",
      ],
      meeting: "Haftalik tekshiruv — 2-hafta natijalari",
    },
    {
      week: 4,
      label: "4-hafta: Baholash va 30-kunlik chek-list",
      tasks: [
        form.haftalik_maqsadlar[2] || "Sinov muddati maqsadlari tekshiruvi",
        "30-kunlik baholash tayyorlash",
        form.haftalik_maqsadlar[3] || "Kelajakdagi rivojlanish rejasini tuzish",
      ],
      meeting: "30-kunlik rasmiy baholash (HR + Nastavnik)",
    },
  ];

  const sinov = parseInt(form.sinov_muddat_oy) || 3;

  const final_checkpoints = [
    `30-kun baholash: Asosiy kompetentsiyalar tekshiruvi`,
    `${Math.round(sinov * 30 / 2)}-kun oraliq tekshiruv: Nastavnik bilan progress sharhi`,
    `${sinov * 30}-kun (${sinov} oylik) yakuniy baholash: HR Director bilan suhbat`,
    "Sinov muddati yakuniy xulosasi va qaror qabul qilish",
  ];

  return {
    lavozim_nomi: form.lavozim_nomi,
    bolim: form.bolim,
    nastavnik_name: nastavnikName,
    kirish_sanasi: form.kirish_sanasi,
    sinov_muddat_oy: sinov,
    weeks,
    final_checkpoints,
    reglamentlar,
  };
}

export function OnboardingRoadmapDialog({
  open,
  onClose,
  pipelineEntryId,
  candidateName,
  vacancyTitle,
}: OnboardingRoadmapDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"form" | "result">("form");
  const [generatedRoadmap, setGeneratedRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [form, setForm] = useState<RoadmapFormData>({
    lavozim_nomi: vacancyTitle || "",
    bolim: "",
    nastavnik_id: "",
    kirish_sanasi: new Date().toISOString().split("T")[0],
    reglamentlar: "",
    haftalik_maqsadlar: ["", "", "", ""],
    sinov_muddat_oy: "3",
  });

  const { data: employeesRaw } = useQuery({ queryKey: ["/api/hr/employees"] });
  const employees: Employee[] = Array.isArray(employeesRaw)
    ? employeesRaw
    : ((employeesRaw as { data?: Employee[] })?.data || []);

  const { data: existingRoadmapRaw } = useQuery({
    queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/roadmap`],
    enabled: open,
  });
  const existingRoadmap = (existingRoadmapRaw as { data?: { roadmap_data?: GeneratedRoadmap } })?.data;

  const saveMutation = useMutation({
    mutationFn: (payload: {
      nastavnik_id?: number;
      kirish_sanasi: string;
      roadmap_data: GeneratedRoadmap;
    }) =>
      apiRequest("POST", `/api/hr/recruitment/pipeline/${pipelineEntryId}/roadmap`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/roadmap`] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/roadmaps"] });
      toast({ title: "Yo'l xaritasi saqlandi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  function handleGenerate() {
    if (!form.lavozim_nomi || !form.kirish_sanasi) {
      toast({ title: "Lavozim nomi va kirish sanasi majburiy", variant: "destructive" });
      return;
    }
    const nastavnik = (Array.isArray(employees) ? employees : []).find(e => String(e.id) === form.nastavnik_id);
    const nastavnikName = nastavnik
      ? (nastavnik.full_name || nastavnik.fullName || `${nastavnik.firstName || ""} ${nastavnik.lastName || ""}`.trim() || `#${nastavnik.id}`)
      : (form.nastavnik_id ? `Nastavnik #${form.nastavnik_id}` : "Belgilanmagan");
    const roadmap = generateRoadmap(form, nastavnikName);
    setGeneratedRoadmap(roadmap);
    saveMutation.mutate({
      nastavnik_id: form.nastavnik_id ? Number(form.nastavnik_id) : undefined,
      kirish_sanasi: form.kirish_sanasi,
      roadmap_data: roadmap,
    });
    setStep("result");
  }

  function handlePrint() {
    window.print();
  }

  const roadmapToShow = generatedRoadmap || existingRoadmap?.roadmap_data || null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setStep("form"); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-[var(--ep-green)]" />
            Yo'l Xaritasi — {candidateName}
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4 py-2">
            {existingRoadmap?.roadmap_data && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {t("buNomzodUchunYolXaritasi")}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto h-6 text-[10px] border-emerald-500/40 text-emerald-400"
                  onClick={() => setStep("result")}
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
                <Select
                  value={form.nastavnik_id}
                  onValueChange={v => setForm(f => ({ ...f, nastavnik_id: v }))}
                >
                  <SelectTrigger className="h-9 text-sm mt-1">
                    <SelectValue placeholder={t("nastavnikTanlang")} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.slice(0, 50).map(emp => {
                      const name = emp.full_name || emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || `#${emp.id}`;
                      return (
                        <SelectItem key={emp.id} value={String(emp.id)}>{name}</SelectItem>
                      );
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
              <Label className="text-xs">Reglamentlar ro'yxati (har bir qator — alohida material)</Label>
              <Textarea
                value={form.reglamentlar}
                onChange={e => setForm(f => ({ ...f, reglamentlar: e.target.value }))}
                placeholder={"Mehnat tartib-qoidalari\nIsh xavfsizligi bo'yicha yo'riqnoma\nMijozlar bilan ishlash standartlari"}
                className="text-sm mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-xs">Haftalik maqsadlar (4 hafta)</Label>
              <div className="space-y-2 mt-1">
                {([0, 1, 2, 3] as const).map(i => (
                  <Input
                    key={`k-${i}`}
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
              <Label className="text-xs">Sinov muddati (oy)</Label>
              <Select
                value={form.sinov_muddat_oy}
                onValueChange={v => setForm(f => ({ ...f, sinov_muddat_oy: v }))}
              >
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["1", "2", "3", "6"]).map(v => (
                    <SelectItem key={v} value={v}>{v} oy</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
              <Button
                onClick={handleGenerate}
                disabled={saveMutation.isPending}
                className="gap-2"
                data-testid="button-generate-roadmap"
              >
                <Map className="h-4 w-4" />
                {saveMutation.isPending ? "Saqlanmoqda..." : "Yo'l xaritasini yaratish"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2 print:space-y-3">
            {roadmapToShow ? (
              <>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 print:border print:border-gray-300 print:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="font-bold text-base">{roadmapToShow.lavozim_nomi} — Yo'l Xaritasi</h2>
                      {roadmapToShow.bolim && (
                        <p className="text-sm text-muted-foreground">{roadmapToShow.bolim}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">{roadmapToShow.sinov_muddat_oy} oy sinov</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>{t("nastavnik1")}<strong className="text-foreground">{roadmapToShow.nastavnik_name}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{t("kirishSanasi1")}<strong className="text-foreground">
                        {roadmapToShow.kirish_sanasi ? new Date(roadmapToShow.kirish_sanasi).toLocaleDateString("uz-UZ") : "—"}
                      </strong></span>
                    </div>
                  </div>
                </div>

                {roadmapToShow.reglamentlar && roadmapToShow.reglamentlar.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-[var(--ep-blue)]" />
                      <h3 className="font-semibold text-sm">{t("oqiladiganMateriallar")}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(roadmapToShow.reglamentlar) ? roadmapToShow.reglamentlar : []).map((r, i) => (
                        <Badge key={`k-${i}`} variant="outline" className="text-xs border-blue-500/40 text-blue-400">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4 text-[var(--ep-yellow)]" />
                    <h3 className="font-semibold text-sm">Gantt-style Jadval (4 hafta)</h3>
                  </div>
                  <div className="space-y-3">
                    {(Array.isArray(roadmapToShow.weeks) ? roadmapToShow.weeks : []).map((week) => (
                      <div key={week.week} className="border rounded-lg overflow-hidden">
                        <div className={`px-3 py-2 text-xs font-semibold flex items-center gap-2 ${
                          week.week === 1 ? "bg-blue-500/15 text-blue-400 border-b border-blue-500/20" :
                          week.week === 2 ? "bg-amber-500/15 text-amber-400 border-b border-amber-500/20" :
                          week.week === 3 ? "bg-orange-500/15 text-orange-400 border-b border-orange-500/20" :
                          "bg-green-500/15 text-green-400 border-b border-green-500/20"
                        }`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                            week.week === 1 ? "bg-blue-500" :
                            week.week === 2 ? "bg-amber-500" :
                            week.week === 3 ? "bg-orange-500" : "bg-green-500"
                          }`}>{week.week}</span>
                          {week.label}
                        </div>
                        <div className="px-3 py-2 space-y-1.5">
                          {(Array.isArray(week.tasks) ? week.tasks : []).map((task, ti) => (
                            <div key={ti} className="flex items-start gap-1.5 text-xs">
                              <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                              <span>{task}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1.5 text-xs mt-2 pt-2 border-t border-border/40 text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="italic">{week.meeting}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
                    <h3 className="font-semibold text-sm">{t("yakuniyChekList")}</h3>
                  </div>
                  <div className="space-y-1.5">
                    {(Array.isArray(roadmapToShow.final_checkpoints) ? roadmapToShow.final_checkpoints : []).map((cp, i) => (
                      <div key={`k-${i}`} className="flex items-start gap-2 text-xs">
                        <div className="w-4 h-4 mt-0.5 border-2 border-emerald-500/50 rounded shrink-0" />
                        <span>{cp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter className="print:hidden">
                  <Button variant="outline" onClick={() => setStep("form")}>
                    {t("edit")}
                  </Button>
                  <Button variant="outline" onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" />
                    {t("print1")}
                  </Button>
                  <Button onClick={onClose}>{t("close2")}</Button>
                </DialogFooter>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t("yolXaritasiHaliYaratilmagan")}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
