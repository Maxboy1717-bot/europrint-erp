import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight, ChevronLeft, Save, Users, Zap,
  Settings, DollarSign, BookOpen, Briefcase, MessageCircle,
} from "lucide-react";

import {
  PortretData, ToolTestReqs, ChannelData, Step,
  CHANNELS_LIST,
} from "@/components/recruiting/portret/types";

import { StepBasicInfo } from "@/components/recruiting/portret/StepBasicInfo";
import { StepDemographics } from "@/components/recruiting/portret/StepDemographics";
import { StepDuties } from "@/components/recruiting/portret/StepDuties";
import { StepToolTest } from "@/components/recruiting/portret/StepToolTest";
import { StepExperience } from "@/components/recruiting/portret/StepExperience";
import { StepConditions } from "@/components/recruiting/portret/StepConditions";
import { StepPresentation } from "@/components/recruiting/portret/StepPresentation";

const STEPS: Step[] = [
  { id: "A",   icon: Settings,      title: "Blok A",   full: "Lavozim tahlili"       },
  { id: "B",   icon: Users,         title: "Blok B",   full: "Demografik talablar"   },
  { id: "C",   icon: BookOpen,      title: "Blok C",   full: "Vazifalar va natijalar" },
  { id: "D",   icon: Zap,           title: "Blok D",   full: "TOOL TEST"             },
  { id: "E",   icon: Briefcase,     title: "Blok E",   full: "Tajriba va bilim"      },
  { id: "III", icon: DollarSign,    title: "III bo'lim", full: "Ish sharoitlari"     },
  { id: "IV",  icon: MessageCircle, title: "IV bo'lim", full: "Kandidatga aytiladi"  },
];

const DEFAULT_TOOL_REQS: ToolTestReqs = {
  traits: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
  iq_min: 4,
  leadership_min: 70,
  replication_min: 70,
};

const DEFAULT_PORTRET: PortretData = {
  position_name_variants: "", main_purpose: "", vacancy_reason: "new", problem_solved: "", reports_to: "",
  age_min: 22, age_max: 45, gender: "any", family_status: "", education_req: "higher",
  department_duties: "", main_duties: "", expected_result: "",
  danger_candidate: "", experience_required: false, experience_field: "",
  current_employment: "", industry_experience: "", professional_skills: "",
  salary_min: undefined, salary_max: undefined,
  probation_months: 3, work_schedule: "5/2", travel_required: "none",
  social_package: [], additional_conditions: "",
};

const SOCIAL_PACKAGE_OPTIONS = [
  "Tibbiy sug'urta", "Korporativ transport", "Ovqatlanish", "Sport zali",
  "Telefon aloqasi", "Korporativ o'quv", "Bonus dasturi",
];

interface VacancyPortretDialogProps {
  vacancyId: number;
  vacancyTitle: string;
  isUrgent?: boolean;
  open: boolean;
  onClose: () => void;
}

export function VacancyPortretDialog({
  vacancyId, vacancyTitle, isUrgent: initialUrgent, open, onClose,
}: VacancyPortretDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [portret, setPortret] = useState<PortretData>(DEFAULT_PORTRET);
  const [toolReqs, setToolReqs] = useState<ToolTestReqs>(DEFAULT_TOOL_REQS);
  const [channels, setChannels] = useState<ChannelData>(
    Object.fromEntries(CHANNELS_LIST.map(c => [c.key, { active: false }]))
  );
  const [isUrgent, setIsUrgent] = useState(initialUrgent ?? false);

  const { data } = useQuery<{
    data: { portret: PortretData | null; tool_test_requirements: ToolTestReqs | null; is_urgent: boolean };
  }>({
    queryKey: [`/api/hr/recruitment/vacancies/${vacancyId}/portret`],
    enabled: open && vacancyId > 0,
  });

  const { data: vacData } = useQuery<{
    data: { channels: ChannelData | null };
  }>({
    queryKey: [`/api/hr/recruitment/vacancies/${vacancyId}`],
    enabled: open && vacancyId > 0,
  });

  useEffect(() => {
    if (data?.data) {
      if (data.data.portret) setPortret({ ...DEFAULT_PORTRET, ...data.data.portret });
      if (data.data.tool_test_requirements) setToolReqs({ ...DEFAULT_TOOL_REQS, ...data.data.tool_test_requirements });
      setIsUrgent(data.data.is_urgent ?? false);
    }
  }, [data]);

  useEffect(() => {
    if (vacData?.data?.channels) {
      setChannels({
        ...Object.fromEntries(CHANNELS_LIST.map(c => [c.key, { active: false }])),
        ...vacData.data.channels,
      });
    }
  }, [vacData]);

  const portretMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/hr/recruitment/vacancies/${vacancyId}/portret`, {
      portret, tool_test_requirements: toolReqs, is_urgent: isUrgent,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] });
      queryClient.invalidateQueries({ queryKey: [`/api/hr/recruitment/vacancies/${vacancyId}/portret`] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/urgent"] });
      toast({ title: "Portret saqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const channelsMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/hr/recruitment/vacancies/${vacancyId}/channels`, { channels }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] });
      toast({ title: "Kanallar saqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  function handleSaveAll() {
    portretMutation.mutate();
    channelsMutation.mutate();
  }

  function handlePortretChange(field: keyof PortretData) {
    return (val: string | number | boolean | string[]) =>
      setPortret(prev => ({ ...prev, [field]: val }));
  }

  function handleTraitChange(key: string, val: number) {
    setToolReqs(prev => ({ ...prev, traits: { ...prev.traits, [key]: val } }));
  }

  function handleOtherToolChange(field: keyof ToolTestReqs, val: number) {
    setToolReqs(prev => ({ ...prev, [field]: val }));
  }

  function toggleSocialPackage(opt: string) {
    const current = portret.social_package ?? [];
    const updated = current.includes(opt)
      ? (Array.isArray(current) ? current : []).filter(x => x !== opt)
      : [...current, opt];
    handlePortretChange("social_package")(updated);
  }

  function handlePresentationChange(field: keyof NonNullable<PortretData["candidate_presentation"]>) {
    return (val: string) =>
      setPortret(prev => ({
        ...prev,
        candidate_presentation: { ...prev.candidate_presentation, [field]: val },
      }));
  }

  const isSaving = portretMutation.isPending || channelsMutation.isPending;

  const filledA = ([portret.position_name_variants, portret.main_purpose, portret.vacancy_reason, portret.problem_solved]).filter(Boolean).length;
  const filledB = ([portret.gender !== "any" ? portret.gender : "", portret.education_req !== "any" ? portret.education_req : ""]).filter(Boolean).length
    + (portret.age_min !== 22 || portret.age_max !== 45 ? 1 : 0);
  const filledC = ([portret.department_duties, portret.main_duties, portret.expected_result]).filter(Boolean).length;
  const filledE = ([portret.danger_candidate, portret.current_employment, portret.professional_skills]).filter(Boolean).length
    + (portret.experience_required ? 1 : 0);
  const completionPct = Math.round(((filledA + filledB + filledC + filledE) / 14) * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap text-lg">
            <span>Xodim Portreti</span>
            <span className="text-muted-foreground font-normal text-sm">— {vacancyTitle}</span>
            {isUrgent && <Badge className="bg-red-500 text-white text-xs">SHOSHILINCH</Badge>}
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              {completionPct}% to'ldirilgan
            </span>
          </DialogTitle>
          <div className="w-full bg-secondary rounded-full h-1 mt-1">
            <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 py-1 border-b border-border/30">
          <span className="text-xs text-muted-foreground">Shoshilinch vakansiya:</span>
          <button
            onClick={() => setIsUrgent(v => !v)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              isUrgent ? "bg-red-500 text-white border-red-500" : "border-border/40 text-muted-foreground"
            }`}
          >
            {isUrgent ? "🔴 Ha, shoshilinch" : "Yo'q"}
          </button>
        </div>

        <div className="flex gap-1 mb-2">
          {(Array.isArray(STEPS) ? STEPS : []).map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-0.5 rounded-lg text-xs transition-all border ${
                  step === i
                    ? "bg-primary text-white border-primary"
                    : "bg-background border-border/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="leading-tight text-center font-medium">{s.title}</span>
                <span className="text-[8px] opacity-60 leading-tight text-center hidden sm:block">{s.full}</span>
              </button>
            );
          })}
        </div>

        <div className="py-2">
          {step === 0 && <StepBasicInfo portret={portret} onChange={handlePortretChange} />}
          {step === 1 && <StepDemographics portret={portret} onChange={handlePortretChange} />}
          {step === 2 && <StepDuties portret={portret} onChange={handlePortretChange} />}
          {step === 3 && <StepToolTest toolReqs={toolReqs} onTraitChange={handleTraitChange} onOtherChange={handleOtherToolChange} />}
          {step === 4 && <StepExperience portret={portret} onChange={handlePortretChange} />}
          {step === 5 && (
            <StepConditions
              portret={portret}
              onChange={handlePortretChange}
              onToggleSocial={toggleSocialPackage}
              socialPackageOptions={SOCIAL_PACKAGE_OPTIONS}
            />
          )}
          {step === 6 && <StepPresentation portret={portret} onChangePresentation={handlePresentationChange} />}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/30">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Orqaga
            </Button>
            {step < STEPS.length - 1 && (
              <Button size="sm" onClick={() => setStep(s => s + 1)}>
                Keyingi <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
