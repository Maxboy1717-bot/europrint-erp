import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Plus, RefreshCw, CheckCircle, XCircle, Clock, Cog, BarChart3, Layers } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KaizenSuggestion {
  id: number;
  employeeId: string;
  departmentId: number | null;
  title: string;
  description: string;
  expectedImpact: string | null;
  status: string;
  approvedBy: string | null;
  implementedAt: string | null;
  resultMeasured: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  submitted:    { label: "Topshirildi",       color: "bg-blue-100 text-blue-800",   icon: Clock },
  review:       { label: "Ko'rib chiqilmoqda", color: "bg-yellow-100 text-yellow-800", icon: Layers },
  approved:     { label: "Tasdiqlandi",        color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected:     { label: "Rad etildi",         color: "bg-red-100 text-red-800",     icon: XCircle },
  implementing: { label: "Amalga oshirilmoqda",color: "bg-purple-100 text-purple-800", icon: Cog },
  completed:    { label: "Yakunlandi",          color: "bg-teal-100 text-teal-800",  icon: BarChart3 },
};

const KANBAN_COLUMNS = [
  "submitted", "review", "approved", "implementing", "completed", "rejected",
] as const;

// ─── Submit Form ──────────────────────────────────────────────────────────────

function SubmitForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", description: "", expectedImpact: "" });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/kaizen/suggestions", data),
    onSuccess: () => {
      toast({ title: "G'oya muvaffaqiyatli topshirildi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Sarlavha va tavsif majburiy", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Sarlavha *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="G'oya qisqa sarlavhasi"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Tavsif *</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="G'oyani batafsil tushuntiring"
          rows={4}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="impact">Kutilayotgan natija</Label>
        <Textarea
          id="impact"
          value={form.expectedImpact}
          onChange={(e) => setForm((f) => ({ ...f, expectedImpact: e.target.value }))}
          placeholder="Qanday foydani kutmoqdasiz?"
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Topshirilmoqda..." : "Topshirish"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Status Change Dialog ─────────────────────────────────────────────────────

function StatusDialog({
  suggestion,
  onClose,
  onSuccess,
}: {
  suggestion: KaizenSuggestion;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [resultMeasured, setResultMeasured] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { status: string; rejectionReason?: string; resultMeasured?: string }) =>
      apiRequest("PATCH", `/api/kaizen/suggestions/${suggestion.id}/status`, data),
    onSuccess: () => {
      toast({ title: "Status yangilandi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const TRANSITIONS: Record<string, string[]> = {
    submitted:    ["review", "rejected"],
    review:       ["approved", "rejected"],
    approved:     ["implementing", "rejected"],
    implementing: ["completed"],
    rejected:     [],
    completed:    [],
  };
  const NEXT_STATUSES = TRANSITIONS[suggestion.status] ?? [];

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-lg">
        <p className="font-medium text-sm">{suggestion.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Joriy holat: <strong>{STATUS_CONFIG[suggestion.status]?.label}</strong>
        </p>
      </div>
      <div className="space-y-1">
        <Label>Yangi holat</Label>
        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Holat tanlang" />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(NEXT_STATUSES) ? NEXT_STATUSES : []).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {newStatus === "rejected" && (
        <div className="space-y-1">
          <Label>Rad etish sababi *</Label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Nima uchun rad etildi?"
            rows={3}
          />
        </div>
      )}
      {newStatus === "completed" && (
        <div className="space-y-1">
          <Label>Natija o'lchovi</Label>
          <Textarea
            value={resultMeasured}
            onChange={(e) => setResultMeasured(e.target.value)}
            placeholder="Natijalari qanday bo'ldi?"
            rows={3}
          />
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
        <Button
          disabled={!newStatus || mutation.isPending || (newStatus === "rejected" && !rejectionReason)}
          onClick={() => mutation.mutate({ status: newStatus, rejectionReason: rejectionReason || undefined, resultMeasured: resultMeasured || undefined })}
        >
          {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KaizenCard({ suggestion, onStatusChange }: { suggestion: KaizenSuggestion; onStatusChange: (s: KaizenSuggestion) => void }) {
  const cfg = STATUS_CONFIG[suggestion.status] ?? STATUS_CONFIG["submitted"];
  const Icon = cfg.icon;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight flex-1">{suggestion.title}</p>
        <button
          onClick={() => onStatusChange(suggestion)}
          className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-0.5 shrink-0"
        >
          Holat
        </button>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.description}</p>
      {suggestion.expectedImpact && (
        <p className="text-xs text-blue-600 line-clamp-1">↗ {suggestion.expectedImpact}</p>
      )}
      {suggestion.rejectionReason && (
        <p className="text-xs text-red-500 line-clamp-1">✕ {suggestion.rejectionReason}</p>
      )}
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{new Date(suggestion.createdAt).toLocaleDateString("uz-UZ")}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KaizenPage() {
  const { toast } = useToast();
  const [showSubmit, setShowSubmit] = useState(false);
  const [statusTarget, setStatusTarget] = useState<KaizenSuggestion | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data, isLoading, refetch } = useQuery<{ suggestions: KaizenSuggestion[]; total: number }>({
    queryKey: ["/api/kaizen/suggestions", filterStatus !== "all" ? { status: filterStatus } : {}],
  });

  const { data: stats } = useQuery<{ stats: Record<string, number>; total: number }>({
    queryKey: ["/api/kaizen/stats"],
  });

  const suggestions = data?.suggestions ?? [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/kaizen/suggestions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/kaizen/stats"] });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Kaizen — Doimiy Takomillashtirish</h1>
            <p className="text-sm text-muted-foreground">Xodimlar g'oyalarini topshiring va kuzating</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" /> Yangilash
          </Button>
          <Button size="sm" onClick={() => setShowSubmit(true)}>
            <Plus className="w-4 h-4 mr-1" /> G'oya topshirish
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Array.isArray(KANBAN_COLUMNS) ? KANBAN_COLUMNS : []).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <Card key={s} className="p-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.stats[s] ?? 0}</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">Filter:</span>
        {(["all", ...KANBAN_COLUMNS]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterStatus === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {s === "all" ? "Barchasi" : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`k-${i}`} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : filterStatus === "all" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
          {(Array.isArray(KANBAN_COLUMNS) ? KANBAN_COLUMNS : []).map((col) => {
            const colItems = (Array.isArray(suggestions) ? suggestions : []).filter((s) => s.status === col);
            const cfg = STATUS_CONFIG[col];
            return (
              <div key={col} className="min-w-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-muted-foreground">{colItems.length}</span>
                </div>
                <div className="space-y-3">
                  {colItems.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                      G'oyalar yo'q
                    </div>
                  ) : (
                    (Array.isArray(colItems) ? colItems : []).map((s) => (
                      <KaizenCard key={s.id} suggestion={s} onStatusChange={setStatusTarget} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Hozircha g'oyalar yo'q</p>
            </div>
          ) : (
            (Array.isArray(suggestions) ? suggestions : []).map((s) => (
              <KaizenCard key={s.id} suggestion={s} onStatusChange={setStatusTarget} />
            ))
          )}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" /> Yangi G'oya Topshirish
            </DialogTitle>
          </DialogHeader>
          <SubmitForm
            onClose={() => setShowSubmit(false)}
            onSuccess={handleRefresh}
          />
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Holat o'zgartirish</DialogTitle>
          </DialogHeader>
          {statusTarget && (
            <StatusDialog
              suggestion={statusTarget}
              onClose={() => setStatusTarget(null)}
              onSuccess={handleRefresh}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
