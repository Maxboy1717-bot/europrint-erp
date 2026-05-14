/**
 * @module OrgNodePortretTab
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight, ChevronLeft, Save, Settings, Users, Zap, DollarSign,
  Send, ClipboardList, Clock, BookOpen, Briefcase, MessageCircle,
} from "lucide-react";

import { PortretData, ToolTestReqs, PortretStep, HRRequest } from "@/components/hr/portret/types";
import { HRRequestDialog } from "@/components/hr/portret/HRRequestDialog";
import { HRRequestsHistory } from "@/components/hr/portret/HRRequestsHistory";
import { PortretBlokA } from "@/components/hr/portret/PortretBlokA";
import { PortretBlokB } from "@/components/hr/portret/PortretBlokB";
import { PortretBlokC } from "@/components/hr/portret/PortretBlokC";
import { PortretBlokD } from "@/components/hr/portret/PortretBlokD";
import { PortretBlokE } from "@/components/hr/portret/PortretBlokE";
import { PortretSection3 } from "@/components/hr/portret/PortretSection3";
import { PortretSection4 } from "@/components/hr/portret/PortretSection4";
import { useTranslation } from '@/lib/i18n';

const STEPS: PortretStep[] = [
  { id: "A",   icon: Settings,      title: "Blok A",    full: "Lavozim tahlili"       },
  { id: "B",   icon: Users,         title: "Blok B",    full: "Demografik talablar"   },
  { id: "C",   icon: BookOpen,      title: "Blok C",    full: "Vazifalar & Natijalar" },
  { id: "D",   icon: Zap,           title: "Blok D",    full: "TOOL TEST"             },
  { id: "E",   icon: Briefcase,     title: "Blok E",    full: "Tajriba & Bilim"       },
  { id: "III", icon: DollarSign,    title: "III bo'lim", full: "Ish sharoitlari"      },
  { id: "IV",  icon: MessageCircle, title: "IV bo'lim", full: "Kandidatga aytiladi"   },
];

const TOOL_TRAITS_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const DEFAULT_PORTRET: PortretData = {
  position_name_variants: "", main_purpose: "", vacancy_reason: "new",
  problem_solved: "", reports_to: "",
  age_min: 22, age_max: 45, gender: "any", family_status: "", education_req: "higher",
  department_duties: "", main_duties: "", expected_result: "",
  danger_candidate: "", experience_required: false, experience_field: "",
  current_employment: "", industry_experience: "", professional_skills: "",
  probation_months: 3, work_schedule: "5/2", travel_required: "none",
  social_package: [], additional_conditions: "",
};

const DEFAULT_TOOL_REQS: ToolTestReqs = {
  traits: Object.fromEntries(TOOL_TRAITS_KEYS.map(k => [k, 0])),
  iq_min: 4, leadership_min: 70, replication_min: 70,
};

export function OrgNodePortretTab({ nodeId, nodeName }: { nodeId: number; nodeName: string }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [portret, setPortret] = useState<PortretData>(DEFAULT_PORTRET);
  const [toolReqs, setToolReqs] = useState<ToolTestReqs>(DEFAULT_TOOL_REQS);
  const [hrDialogOpen, setHrDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<{
    portret: {
      id: number;
      portret_data: { portret?: PortretData; tool_test_requirements?: ToolTestReqs };
      creator_name: string | null;
      updated_at: string;
    } | null;
  }>({
    queryKey: [`/api/org-structure/nodes/${nodeId}/portret`],
    enabled: nodeId > 0,
  });

  const { data: reqData } = useQuery<{ requests: HRRequest[] }>({
    queryKey: [`/api/org-structure/nodes/${nodeId}/hr-requests`],
    enabled: nodeId > 0,
  });

  useEffect(() => {
    if (data?.portret?.portret_data) {
      const pd = data.portret.portret_data;
      if (pd.portret) setPortret({ ...DEFAULT_PORTRET, ...pd.portret });
      if (pd.tool_test_requirements) setToolReqs({ ...DEFAULT_TOOL_REQS, ...pd.tool_test_requirements });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/org-structure/nodes/${nodeId}/portret`, {
      portret_data: { portret, tool_test_requirements: toolReqs },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${nodeId}/portret`] });
      toast({ title: "Portret saqlandi ✓" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const p = (field: keyof PortretData) => ( val: unknown) =>
    setPortret(prev => ({ ...prev, [field]: val }));

  const setTrait = (key: string, val: number) =>
    setToolReqs(prev => ({ ...prev, traits: { ...prev.traits, [key]: val } }));

  const setOtherToolReq = (field: keyof Omit<ToolTestReqs, 'traits'>, val: number) =>
    setToolReqs(prev => ({ ...prev, [field]: val }));

  const toggleSocial = (opt: string) => {
    const cur = portret.social_package ?? [];
    p("social_package")(cur.includes(opt) ? (Array.isArray(cur) ? cur : []).filter(x => x !== opt) : [...cur, opt]);
  };

  const cp = (field: keyof NonNullable<PortretData["candidate_presentation"]>) => (val: string) =>
    setPortret(prev => ({
      ...prev,
      candidate_presentation: { ...prev.candidate_presentation, [field]: val },
    }));

  const filledA = ([portret.position_name_variants, portret.main_purpose, portret.problem_solved, portret.vacancy_reason]).filter(Boolean).length;
  const filledC = ([portret.department_duties, portret.main_duties, portret.expected_result]).filter(Boolean).length;
  const filledE = ([portret.danger_candidate, portret.current_employment, portret.professional_skills]).filter(Boolean).length
    + (portret.experience_required ? 1 : 0);
  const totalFilled = filledA + filledC + filledE;
  const pct = Math.round((totalFilled / 11) * 100);

  if (isLoading) return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" /></div>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> {t("xodimPortreti")}<Badge variant="outline" className="text-[9px]">{pct}% to'ldirilgan</Badge></h3>
          {data?.portret?.updated_at && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-2.5 w-2.5" /> Oxirgi saqlash: {new Date(data.portret.updated_at).toLocaleString("uz-UZ")} {data.portret.creator_name && ` · ${data.portret.creator_name}`}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="h-3.5 w-3.5 mr-1.5" /> {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}</Button>
          <Button size="sm" onClick={() => setHrDialogOpen(true)} className="bg-primary text-primary-foreground"><Send className="h-3.5 w-3.5 mr-1.5" /> {t("hrGaSorov")}</Button>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-1.5"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>

      <div className="flex gap-1">
        {(Array.isArray(STEPS) ? STEPS : []).map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setStep(i)} className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-0.5 rounded-lg text-xs transition-all border ${step === i ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border/40 text-muted-foreground hover:border-primary/40"}`}>
              <Icon className="w-3 h-3" /><span className="font-medium leading-tight">{s.title}</span><span className="text-[8px] opacity-60 leading-tight text-center hidden sm:block">{s.full}</span>
            </button>
          );
        })}
      </div>

      {step === 0 && <PortretBlokA portret={portret} onChange={p} />}
      {step === 1 && <PortretBlokB portret={portret} onChange={p} />}
      {step === 2 && <PortretBlokC portret={portret} onChange={p} />}
      {step === 3 && <PortretBlokD toolReqs={toolReqs} onTraitChange={setTrait} onOtherChange={setOtherToolReq} />}
      {step === 4 && <PortretBlokE portret={portret} onChange={p} />}
      {step === 5 && <PortretSection3 portret={portret} onChange={p} onToggleSocial={toggleSocial} />}
      {step === 6 && <PortretSection4 portret={portret} onChange={cp} />}

      <div className="flex items-center justify-between border-t pt-3">
        <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep(s => s - 1)}><ChevronLeft className="w-3.5 h-3.5 mr-1" /> {t("back")}</Button>
        <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="w-3.5 h-3.5 mr-1" /> {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}</Button>
        {step < STEPS.length - 1 ? <Button size="sm" onClick={() => setStep(s => s + 1)}>{t("nextBtn")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Button> : <Button size="sm" onClick={() => saveMutation.mutate()} className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white"><Save className="w-3.5 h-3.5 mr-1" /> {t("Saqlash")}</Button>}
      </div>

      <HRRequestsHistory requests={reqData?.requests ?? []} />
      <HRRequestDialog nodeId={nodeId} nodeName={nodeName} portretId={data?.portret?.id} open={hrDialogOpen} onClose={() => setHrDialogOpen(false)} />
    </div>
  );
}
