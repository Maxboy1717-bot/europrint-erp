import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Brain, Target, UserCheck, Edit, Check, BarChart3, Clock, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HRCapitalProfile {
  employeeId: string;
  visotskiyCategory?: string;
  toolTestScore?: string;
  psychologicalProfile?: string;
  onboardingStatus?: string;
  offboardingStatus?: string;
  recruitingChannel?: string;
  notes?: string;
  updatedAt: string;
}

interface HRCapitalTabProps {
  employeeId: string;
}

const VISOTSKIY_COLORS: Record<string, string> = {
  Flagman: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  Performer: "bg-green-500/10 text-green-700 border-green-500/30",
  Troublemaker: "bg-red-500/10 text-red-700 border-red-500/30",
};

const ONBOARDING_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: "Boshlanmagan", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Davom etmoqda", color: "bg-yellow-500/10 text-yellow-700" },
  completed: { label: "Yakunlangan", color: "bg-green-500/10 text-green-700" },
};

const TOOL_TEST_SCORES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

type FormState = {
  visotskiyCategory: string;
  toolTestScore: string;
  psychologicalProfile: string;
  onboardingStatus: string;
  offboardingStatus: string;
  recruitingChannel: string;
  notes: string;
};

function buildFormFromProfile(profile: HRCapitalProfile): FormState {
  return {
    visotskiyCategory: profile.visotskiyCategory || "",
    toolTestScore: profile.toolTestScore || "",
    psychologicalProfile: profile.psychologicalProfile || "",
    onboardingStatus: profile.onboardingStatus || "not_started",
    offboardingStatus: profile.offboardingStatus || "",
    recruitingChannel: profile.recruitingChannel || "",
    notes: profile.notes || "",
  };
}

const EMPTY_FORM: FormState = {
  visotskiyCategory: "",
  toolTestScore: "",
  psychologicalProfile: "",
  onboardingStatus: "not_started",
  offboardingStatus: "",
  recruitingChannel: "",
  notes: "",
};

const TEST_TYPE_LABELS: Record<string, string> = {
  tool_test: "TOOL TEST",
  iq: "IQ Test",
  leadership: "Liderlik",
  replication: "Takrorlash",
};

const INDICATOR_KEYS = ["A","B","C","D","E","F","G","H","I","J"];
const INDICATOR_COLORS: Record<string, string> = {
  A: "#6366f1", B: "#22c55e", C: "#f59e0b", D: "#ef4444", E: "#8b5cf6",
  F: "#06b6d4", G: "#f97316", H: "#14b8a6", I: "#84cc16", J: "#ec4899",
};

function CenteredBar({ value, color }: { value: number; color: string }) {
  const center = 50;
  const pct = Math.max(0, Math.min(100, ((value + 100) / 200) * 100));
  const isNeg = value < 0;
  const barLeft = isNeg ? pct : center;
  const barWidth = Math.abs(pct - center);
  return (
    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden flex-1">
      <div
        className="absolute top-0 h-full rounded-full transition-all"
        style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: color }}
      />
      <div className="absolute top-0 h-full w-px bg-foreground/25" style={{ left: "50%" }} />
    </div>
  );
}

function HRCapitalTestHistory({ employeeId }: { employeeId: string }) {
  const { data } = useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["/api/hr/hrc-tests/employee", employeeId, "results"],
    queryFn: async () => {
      const res = await fetch(`/api/hr/hrc-tests/employee/${employeeId}/results`, { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: !!employeeId,
  });
  interface HRCSession {
    id: number;
    test_type: string;
    score: number;
    syndrome: string;
    iq_level: string;
    status: string;
    created_at: string;
    indicators: Record<string, number>;
  }
  const sessions = (data?.data ?? []) as unknown as HRCSession[];

  if (sessions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet-500" />
          HR Capital Test Tarixi
        </CardTitle>
        <CardDescription>Barcha test natijalari</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(Array.isArray(sessions) ? sessions : []).map((s) => (
            <div key={s.id} className="p-3 bg-muted/40 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="text-xs bg-primary/10 text-primary border-0">
                    {TEST_TYPE_LABELS[s.test_type] ?? s.test_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleDateString("uz-UZ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.syndrome && (
                    <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-300">{s.syndrome}</Badge>
                  )}
                  {s.iq_level && (
                    <Badge className="text-[10px] bg-blue-100 text-blue-700 border-0">{s.iq_level}</Badge>
                  )}
                  {s.score !== null && s.score !== undefined && (
                    <span className={`font-bold ${s.test_type === "tool_test" && s.score < 0 ? "text-red-500" : "text-primary"}`}>
                      {s.test_type === "tool_test"
                        ? `${s.score > 0 ? "+" : ""}${s.score}`
                        : `${s.score}%`}
                    </span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${s.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {s.status === "completed" ? "Tugallandi" : s.status === "expired" ? "Muddati o'tdi" : s.status}
                  </span>
                </div>
              </div>
              {s.test_type === "tool_test" && s.status === "completed" && s.indicators && (
                <div className="grid grid-cols-5 gap-x-3 gap-y-1 pt-1">
                  {(Array.isArray(INDICATOR_KEYS) ? INDICATOR_KEYS : []).map(k => {
                    const v = Number(s.indicators?.[k] ?? 0);
                    return (
                      <div key={k} className="flex items-center gap-1">
                        <span className="text-[9px] font-bold w-3 shrink-0" style={{ color: INDICATOR_COLORS[k] }}>{k}</span>
                        <CenteredBar value={v} color={INDICATOR_COLORS[k]} />
                        <span className={`text-[9px] w-6 text-right shrink-0 ${v < 0 ? "text-red-500" : "text-green-600"}`}>
                          {v > 0 ? "+" : ""}{v}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HRCapitalTab({ employeeId }: HRCapitalTabProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: profile, isLoading } = useQuery<HRCapitalProfile | null>({
    queryKey: ["/api/employees", employeeId, "capital-profile"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/capital-profile`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (profile && !editing) {
      setForm(buildFormFromProfile(profile));
    }
  }, [profile, editing]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormState) => {
      return apiRequest("POST", `/api/employees/${employeeId}/capital-profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "capital-profile"] });
      setEditing(false);
      toast({ title: "HR Kapital profili saqlandi" });
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border ${profile?.visotskiyCategory ? (VISOTSKIY_COLORS[profile.visotskiyCategory] || "") : ""}`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Visotskiy kategoriyasi</p>
                {profile?.visotskiyCategory ? (
                  <p className="text-xl font-bold mt-1">{profile.visotskiyCategory}</p>
                ) : (
                  <p className="text-lg font-bold text-muted-foreground">—</p>
                )}
              </div>
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tool Test natijasi</p>
                <p className="text-2xl font-bold text-purple-600">{profile?.toolTestScore || "—"}</p>
                <p className="text-xs text-muted-foreground">A-J shkala</p>
              </div>
              <BarChart3 className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Onboarding holati</p>
                {profile?.onboardingStatus ? (
                  <Badge className={`mt-1 ${ONBOARDING_LABELS[profile.onboardingStatus]?.color}`}>
                    {ONBOARDING_LABELS[profile.onboardingStatus]?.label}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>
              <UserCheck className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              HR Kapital Ma'lumotlari
            </CardTitle>
            <CardDescription>Visotskiy metodologiyasi va psixologik profil</CardDescription>
          </div>
          <Button
            size="sm"
            variant={editing ? "default" : "outline"}
            onClick={() => {
              if (editing) {
                saveMutation.mutate(form);
              } else {
                setEditing(true);
                if (profile) {
                  setForm(buildFormFromProfile(profile));
                }
              }
            }}
            disabled={saveMutation.isPending}
            data-testid="button-edit-hr-capital"
          >
            {editing ? (
              saveMutation.isPending ? "Saqlanmoqda..." : <><Check className="h-4 w-4 mr-1" />Saqlash</>
            ) : (
              <><Edit className="h-4 w-4 mr-1" />Tahrirlash</>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visotskiy kategoriyasi</Label>
                <Select
                  value={form.visotskiyCategory}
                  onValueChange={(v) => setForm({ ...form, visotskiyCategory: v })}
                >
                  <SelectTrigger data-testid="select-visotskiy">
                    <SelectValue placeholder="Tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flagman">Flagman (Yetakchi)</SelectItem>
                    <SelectItem value="Performer">Performer (Bajaruvchi)</SelectItem>
                    <SelectItem value="Troublemaker">Troublemaker (Muammoli)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tool Test natijasi (A-J)</Label>
                <Select
                  value={form.toolTestScore}
                  onValueChange={(v) => setForm({ ...form, toolTestScore: v })}
                >
                  <SelectTrigger data-testid="select-tool-test">
                    <SelectValue placeholder="Shkala..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(TOOL_TEST_SCORES) ? TOOL_TEST_SCORES : []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Psixologik profil sindromi</Label>
                <Input
                  value={form.psychologicalProfile}
                  onChange={(e) => setForm({ ...form, psychologicalProfile: e.target.value })}
                  placeholder="Masalan: DISC — D turi"
                  data-testid="input-psych-profile"
                />
              </div>

              <div className="space-y-2">
                <Label>Onboarding holati</Label>
                <Select
                  value={form.onboardingStatus}
                  onValueChange={(v) => setForm({ ...form, onboardingStatus: v })}
                >
                  <SelectTrigger data-testid="select-onboarding">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Boshlanmagan</SelectItem>
                    <SelectItem value="in_progress">Davom etmoqda</SelectItem>
                    <SelectItem value="completed">Yakunlangan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recruiting kanali</Label>
                <Input
                  value={form.recruitingChannel}
                  onChange={(e) => setForm({ ...form, recruitingChannel: e.target.value })}
                  placeholder="Masalan: LinkedIn, Do'stlar tavsiyasi"
                  data-testid="input-recruiting-channel"
                />
              </div>

              <div className="space-y-2">
                <Label>Offboarding holati</Label>
                <Input
                  value={form.offboardingStatus}
                  onChange={(e) => setForm({ ...form, offboardingStatus: e.target.value })}
                  placeholder="—"
                  data-testid="input-offboarding"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Eslatmalar</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="HR izohlar..."
                  data-testid="input-hr-capital-notes"
                />
              </div>
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Visotskiy kategoriyasi</p>
                {profile.visotskiyCategory ? (
                  <Badge className={`mt-1 ${VISOTSKIY_COLORS[profile.visotskiyCategory] || ""}`}>
                    {profile.visotskiyCategory}
                  </Badge>
                ) : (
                  <p className="font-medium mt-1">—</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tool Test natijasi</p>
                <p className="font-bold text-2xl mt-1 text-purple-600">{profile.toolTestScore || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Psixologik profil</p>
                <p className="font-medium mt-1">{profile.psychologicalProfile || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recruiting kanali</p>
                <p className="font-medium mt-1">{profile.recruitingChannel || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Onboarding holati</p>
                {profile.onboardingStatus ? (
                  <Badge className={`mt-1 ${ONBOARDING_LABELS[profile.onboardingStatus]?.color || ""}`}>
                    {ONBOARDING_LABELS[profile.onboardingStatus]?.label}
                  </Badge>
                ) : (
                  <p className="font-medium mt-1">—</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Offboarding holati</p>
                <p className="font-medium mt-1">{profile.offboardingStatus || "—"}</p>
              </div>
              {profile.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Eslatmalar</p>
                  <p className="font-medium mt-1">{profile.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">HR Kapital profili to'ldirilmagan</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setEditing(true)}
                data-testid="button-start-hr-capital"
              >
                To'ldirish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <HRCapitalTestHistory employeeId={employeeId} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Visotskiy Metodologiyasi Haqida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["Flagman", "Performer", "Troublemaker"]).map((cat) => (
              <div
                key={cat}
                className={`rounded-md p-4 border ${VISOTSKIY_COLORS[cat]}`}
              >
                <p className="font-semibold">{cat}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cat === "Flagman" && "Eng yaxshi xodimlar — kompaniya tayanchi"}
                  {cat === "Performer" && "Ishonchli bajaruvchilar — asosiy kuch"}
                  {cat === "Troublemaker" && "Muammoli xodimlar — maxsus e'tibor talab qiladi"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
