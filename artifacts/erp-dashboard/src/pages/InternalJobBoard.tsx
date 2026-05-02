import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, Building2, DollarSign, Clock, Users, Search,
  CheckCircle, AlertTriangle, Send, ChevronDown, ChevronUp,
  UserCheck, Zap,
} from "lucide-react";

interface InternalVacancy {
  id: number;
  title: string;
  description?: string;
  requirements?: string;
  salary_min?: number;
  salary_max?: number;
  vacancy_type: string;
  deadline_working_days?: number;
  created_at: string;
  is_urgent?: boolean;
  department_name?: string;
  applicant_count?: number;
  portret?: Record<string, any> | null;
}

function VacancyCard({
  vacancy,
  onApply,
}: {
  vacancy: InternalVacancy;
  onApply: (v: InternalVacancy) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={`transition-all ${vacancy.is_urgent ? "border-red-500/40" : "border-border/50"}`}
      data-testid={`internal-vacancy-card-${vacancy.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base text-on-surface">{vacancy.title}</h3>
              {vacancy.is_urgent && (
                <Badge className="bg-red-500 text-white gap-1 text-[10px]">
                  <Zap className="w-2.5 h-2.5" />
                  SHOSHILINCH
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">Ichki</Badge>
            </div>
            {vacancy.department_name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Building2 className="w-3 h-3" />
                {vacancy.department_name}
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onApply(vacancy)}
            className="shrink-0 gap-1"
            data-testid={`button-apply-${vacancy.id}`}
          >
            <Send className="w-3.5 h-3.5" />
            Ariza berish
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {vacancy.salary_min && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded px-2 py-0.5">
              <DollarSign className="w-3 h-3" />
              {Number(vacancy.salary_min).toLocaleString()}
              {vacancy.salary_max ? ` – ${Number(vacancy.salary_max).toLocaleString()}` : '+'} so'm
            </div>
          )}
          {vacancy.deadline_working_days && (
            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded px-2 py-0.5">
              <Clock className="w-3 h-3" />
              SLA: {vacancy.deadline_working_days} k.k.
            </div>
          )}
          {vacancy.applicant_count !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
              <Users className="w-3 h-3" />
              {vacancy.applicant_count} ariza
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(vacancy.created_at).toLocaleDateString("uz-UZ")}
          </div>
        </div>

        {vacancy.description && (
          <div className="mb-2">
            <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
              {vacancy.description}
            </p>
          </div>
        )}

        {vacancy.requirements && expanded && (
          <div className="mb-2">
            <p className="text-xs font-medium text-on-surface mb-1">Talablar:</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{vacancy.requirements}</p>
          </div>
        )}

        {vacancy.portret?.salary_min && expanded && (
          <div className="bg-muted/30 rounded-lg p-2 mt-2 text-xs space-y-1">
            {vacancy.portret.main_purpose && (
              <div><span className="text-muted-foreground">Maqsad: </span>{String(vacancy.portret.main_purpose).slice(0, 150)}</div>
            )}
            {vacancy.portret.work_schedule && (
              <div><span className="text-muted-foreground">Grafik: </span>{String(vacancy.portret.work_schedule)}</div>
            )}
          </div>
        )}

        {(vacancy.description || vacancy.requirements) && (
          <button
            onClick={() => setExpanded(p => !p)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 mt-1"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Kamroq" : "Ko'proq"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function ApplyDialog({
  vacancy,
  open,
  onClose,
}: {
  vacancy: InternalVacancy | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [coverNote, setCoverNote] = useState("");

  const applyMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/recruitment/internal-apply/${vacancy!.id}`, {
        cover_note: coverNote,
      }),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) {
        toast({ title: "Xatolik", description: String(data.error), variant: "destructive" });
        return;
      }
      toast({ title: "Ariza yuborildi!", description: `${vacancy?.title} bo'yicha arizangiz HR manegerga tushdi.` });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/internal-board"] });
      setCoverNote("");
      onClose();
    },
    onError: (err: Error) => {
      const msg = err?.message ?? "Noma'lum xatolik";
      toast({ title: "Xatolik", description: msg, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Ichki ariza — {vacancy?.title}
          </DialogTitle>
        </DialogHeader>

        {vacancy && (
          <div className="py-2 space-y-4">
            <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{vacancy.title}</p>
              {vacancy.department_name && (
                <p className="text-xs text-muted-foreground">{vacancy.department_name}</p>
              )}
              {vacancy.salary_min && (
                <p className="text-xs text-green-600">
                  {Number(vacancy.salary_min).toLocaleString()} so'm dan
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm mb-1 block">Motivatsion xat (ixtiyoriy)</Label>
              <Textarea
                value={coverNote}
                onChange={e => setCoverNote(e.target.value)}
                placeholder="Nega ushbu lavozim siz uchun mos? Tajriba va ko'nikmalaringiz haqida qisqacha yozing..."
                rows={4}
                className="text-sm"
                data-testid="textarea-cover-note"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <p className="font-medium mb-1">Muhim eslatma:</p>
              <p>Arizangiz HR menejeriga tushadi va standart tanlov bosqichlari bo'yicha ko'rib chiqiladi. Natija haqida Telegram orqali xabar olasiz.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            data-testid="button-submit-apply"
          >
            <Send className="w-4 h-4 mr-1" />
            {applyMutation.isPending ? "Yuborilmoqda..." : "Ariza yuborish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InternalJobBoard() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "urgent">("all");
  const [applyTarget, setApplyTarget] = useState<InternalVacancy | null>(null);

  const { data: resp, isLoading } = useQuery<{ data: InternalVacancy[] }>({
    queryKey: ["/api/hr/recruitment/internal-board"],
    staleTime: 60_000,
  });

  const vacancies = resp?.data ?? [];

  const filtered = (Array.isArray(vacancies) ? vacancies : []).filter(v => {
    const matchSearch = !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.department_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.description || "").toLowerCase().includes(search.toLowerCase());
    const matchDept = departmentFilter === "all" ||
      (v.department_name || "") === departmentFilter;
    const matchType = typeFilter === "all" || (typeFilter === "urgent" && v.is_urgent);
    return matchSearch && matchDept && matchType;
  });

  const departments = Array.from(new Set((vacancies ?? []).map(v => v.department_name || "").filter(Boolean)));
  const urgentCount = (Array.isArray(vacancies) ? vacancies : []).filter(v => v.is_urgent).length;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-base">Ichki Vakansiyalar</h1>
          <Badge variant="secondary">{vacancies.length} ta</Badge>
          {urgentCount > 0 && (
            <Badge className="bg-red-500 text-white gap-1">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount} shoshilinch
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground flex-1">
            Bu sahifada faqat kompaniya ichki xodimlari uchun mo'ljallangan vakansiyalar ko'rsatiladi. Ariza berish uchun vakansiyani tanlang.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Vakansiya yoki bo'lim nomi..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-internal"
            />
          </div>
          {departments.length > 0 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px] h-8 text-sm" data-testid="select-dept-filter">
                <SelectValue placeholder="Bo'lim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha bo'limlar</SelectItem>
                {(Array.isArray(departments) ? departments : []).map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as "all" | "urgent")}>
            <SelectTrigger className="w-[150px] h-8 text-sm" data-testid="select-type-filter">
              <SelectValue placeholder="Tur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha turlar</SelectItem>
              <SelectItem value="urgent">Faqat shoshilinch</SelectItem>
            </SelectContent>
          </Select>
          {(search || departmentFilter !== "all" || typeFilter !== "all") && (
            <span className="text-xs text-muted-foreground self-center">{filtered.length} ta topildi</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30 animate-pulse" />
              <p className="text-sm">Yuklanmoqda...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium mb-1">
                {vacancies.length === 0
                  ? "Hozircha ichki vakansiyalar yo'q"
                  : "Mos vakansiya topilmadi"}
              </p>
              <p className="text-xs text-muted-foreground">
                {vacancies.length === 0
                  ? "HR bo'limi yangi ichki vakansiya e'lon qilganda bu yerda ko'rinadi"
                  : "Boshqa kalit so'z yoki bo'lim tanlang"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(filtered) ? filtered : []).map(v => (
              <VacancyCard
                key={v.id}
                vacancy={v}
                onApply={setApplyTarget}
              />
            ))}
          </div>
        )}

        {vacancies.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            Jami {vacancies.length} ta ichki vakansiya mavjud — ariza berishni unutmang!
          </div>
        )}
      </div>

      <ApplyDialog
        vacancy={applyTarget}
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
      />
    </div>
  );
}
