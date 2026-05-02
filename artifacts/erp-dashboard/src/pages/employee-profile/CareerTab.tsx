import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, TrendingUp, Target, ArrowRight, Users, Brain, Edit, Check, History } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CareerProfile {
  nextRecommendedPosition?: string;
  successionFor?: string;
  crossTrainingStatus?: string;
  crossTrainingNotes?: string;
  careerPathDirection?: string;
  notes?: string;
}

interface TransferRecord {
  id: string;
  transferDate: string;
  transferType: string;
  fromDepartment: string | null;
  toDepartment: string | null;
  fromPosition: string | null;
  toPosition: string | null;
  reason: string | null;
}

interface CareerData {
  profile: CareerProfile | null;
  timeInPosition: string;
  aiRecommendedPosition: string;
  currentRole: string;
  hireDate: string;
  transferHistory: TransferRecord[];
}

interface CareerTabProps {
  employeeId: string;
}

const CROSS_TRAINING_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: "Boshlanmagan", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Davom etmoqda", color: "bg-yellow-500/10 text-yellow-700" },
  completed: { label: "Bajarildi", color: "bg-green-500/10 text-green-700" },
};

function buildFormFromProfile(profile: CareerProfile) {
  return {
    nextRecommendedPosition: profile.nextRecommendedPosition || "",
    successionFor: profile.successionFor || "",
    crossTrainingStatus: profile.crossTrainingStatus || "not_started",
    crossTrainingNotes: profile.crossTrainingNotes || "",
    careerPathDirection: profile.careerPathDirection || "",
    notes: profile.notes || "",
  };
}

export function CareerTab({ employeeId }: CareerTabProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nextRecommendedPosition: "",
    successionFor: "",
    crossTrainingStatus: "not_started",
    crossTrainingNotes: "",
    careerPathDirection: "",
    notes: "",
  });

  const { data: careerData, isLoading } = useQuery<CareerData>({
    queryKey: ["/api/employees", employeeId, "career"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/career`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch career");
      return res.json();
    },
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (careerData?.profile && !editing) {
      setForm(buildFormFromProfile(careerData.profile));
    }
  }, [careerData, editing]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", `/api/employees/${employeeId}/career`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "career"] });
      setEditing(false);
      toast({ title: "Karera profili saqlandi" });
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

  const profile = careerData?.profile;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Joriy lavozimdagi vaqt</p>
                <p className="text-xl font-bold text-blue-600">{careerData?.timeInPosition || "—"}</p>
              </div>
              <Briefcase className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">AI tavsiya lavozim</p>
                <p className="text-sm font-bold text-purple-600 leading-snug mt-1">
                  {careerData?.aiRecommendedPosition || "—"}
                </p>
              </div>
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cross-training</p>
                {profile?.crossTrainingStatus ? (
                  <Badge className={`mt-1 ${CROSS_TRAINING_LABELS[profile.crossTrainingStatus]?.color}`}>
                    {CROSS_TRAINING_LABELS[profile.crossTrainingStatus]?.label}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Belgilanmagan</p>
                )}
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Karera rejasi
            </CardTitle>
            <CardDescription>Succession planning va karera yo'nalishi</CardDescription>
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
            data-testid="button-edit-career"
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
                <Label>Keyingi tavsiya etilgan lavozim</Label>
                <Input
                  value={form.nextRecommendedPosition}
                  onChange={(e) => setForm({ ...form, nextRecommendedPosition: e.target.value })}
                  placeholder="Masalan: Ustaxona boshlig'i"
                  data-testid="input-next-position"
                />
              </div>
              <div className="space-y-2">
                <Label>Succession — kimning o'rniga o'tishi mumkin</Label>
                <Input
                  value={form.successionFor}
                  onChange={(e) => setForm({ ...form, successionFor: e.target.value })}
                  placeholder="Masalan: Direktor"
                  data-testid="input-succession-for"
                />
              </div>
              <div className="space-y-2">
                <Label>Cross-training holati</Label>
                <Select
                  value={form.crossTrainingStatus}
                  onValueChange={(v) => setForm({ ...form, crossTrainingStatus: v })}
                >
                  <SelectTrigger data-testid="select-cross-training">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Boshlanmagan</SelectItem>
                    <SelectItem value="in_progress">Davom etmoqda</SelectItem>
                    <SelectItem value="completed">Bajarildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Karera yo'nalishi</Label>
                <Input
                  value={form.careerPathDirection}
                  onChange={(e) => setForm({ ...form, careerPathDirection: e.target.value })}
                  placeholder="Masalan: Texnik mutaxassis"
                  data-testid="input-career-direction"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Cross-training eslatma</Label>
                <Input
                  value={form.crossTrainingNotes}
                  onChange={(e) => setForm({ ...form, crossTrainingNotes: e.target.value })}
                  placeholder="Qo'shimcha ma'lumot..."
                  data-testid="input-cross-training-notes"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Umumiy eslatmalar</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="HR izohlar..."
                  data-testid="input-career-notes"
                />
              </div>
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Keyingi tavsiya etilgan lavozim</p>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  {profile.nextRecommendedPosition || "Belgilanmagan"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Succession planning</p>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-primary" />
                  {profile.successionFor || "Belgilanmagan"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Karera yo'nalishi</p>
                <p className="font-medium mt-1">{profile.careerPathDirection || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cross-training</p>
                <div className="mt-1 flex items-center gap-2">
                  {profile.crossTrainingStatus ? (
                    <Badge className={CROSS_TRAINING_LABELS[profile.crossTrainingStatus]?.color}>
                      {CROSS_TRAINING_LABELS[profile.crossTrainingStatus]?.label}
                    </Badge>
                  ) : "—"}
                  {profile.crossTrainingNotes && (
                    <span className="text-sm text-muted-foreground">{profile.crossTrainingNotes}</span>
                  )}
                </div>
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
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Karera profili to'ldirilmagan</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setEditing(true)}
                data-testid="button-start-career-edit"
              >
                To'ldirish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Karera Tavsiyasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 rounded-md p-4 border border-primary/20">
            <p className="text-sm font-medium text-primary mb-2">Tavsiya etilgan keyingi qadam:</p>
            <p className="font-semibold">{careerData?.aiRecommendedPosition || "Malaka oshirish kerak"}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Ushbu tavsiya xodimning joriy roli, ish staji va ko'nikmalariga asoslanib berildi.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Lavozim o'zgarishlari tarixi
          </CardTitle>
          <CardDescription>O'tkazma va ko'tarilish tarixi</CardDescription>
        </CardHeader>
        <CardContent>
          {careerData?.transferHistory && careerData.transferHistory.length > 0 ? (
            <div className="space-y-3" data-testid="transfer-history-list">
              {(Array.isArray(careerData.transferHistory) ? careerData.transferHistory : []).map((t) => {
                const typeLabels: Record<string, string> = {
                  department: "Bo'lim o'zgarishi",
                  position: "Lavozim o'zgarishi",
                  promotion: "Ko'tarilish",
                  demotion: "Tushirilish",
                  work_center: "Ish markazi o'zgarishi",
                };
                return (
                  <div key={t.id} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`transfer-record-${t.id}`}>
                    <div className="flex-shrink-0 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[t.transferType] || t.transferType}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(t.fromDepartment || t.fromPosition) && (
                          <span className="text-sm text-muted-foreground">
                            {t.fromPosition || t.fromDepartment}
                          </span>
                        )}
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {t.toPosition || t.toDepartment || "—"}
                        </span>
                      </div>
                      {t.reason && (
                        <p className="text-xs text-muted-foreground mt-1">{t.reason}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(t.transferDate).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <History className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">O'tkazma tarixi topilmadi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
