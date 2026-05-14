/**
 * @module PosRequestsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageSearch, Plus, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EPErrorState } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
interface PosRequest {
  id: string | number;
  request_number?: string;
  requestNumber?: string;
  material_name?: string;
  materialName?: string;
  quantity?: number;
  unit?: string;
  department?: string;
  status?: string;
  priority?: string;
  requested_by?: string;
  requestedBy?: string;
  approved_by?: string;
  approvedBy?: string;
  notes?: string;
  created_at?: string;
  createdAt?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending:   { label: "Kutilmoqda",   variant: "secondary"   },
  approved:  { label: "Tasdiqlandi",  variant: "default"     },
  rejected:  { label: "Rad etildi",   variant: "destructive" },
  issued:    { label: "Berildi",      variant: "outline"     },
  cancelled: { label: "Bekor",        variant: "destructive" },
};

const PRIORITY_MAP: Record<string, string> = {
  low:    "🟢 Past",
  normal: "🟡 O'rtacha",
  high:   "🔴 Yuqori",
  urgent: "🚨 Shoshilinch",
};

const QUERY_KEY = ["/api/pos/requests"];

export default function PosRequestsPage() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const [showCreate, setShowCreate]     = useState(false);
  const [form, setForm] = useState({
    material_name: "", quantity: "", unit: "dona", department: "", priority: "normal", notes: "",
  });

  const { data: rawData, isLoading, isError, refetch } = useQuery<
    PosRequest[] | { data?: PosRequest[] }
  >({
    queryKey: [...QUERY_KEY, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await apiRequest("GET", `/api/pos/requests?${params}`);
      return res.json();
    },
  });

  const requests: PosRequest[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: PosRequest[] })?.data ?? [];

  const filtered = search
    ? requests.filter(r => {
        const name = (r.material_name ?? r.materialName ?? "").toLowerCase();
        const dept = (r.department ?? "").toLowerCase();
        return name.includes(search.toLowerCase()) || dept.includes(search.toLowerCase());
      })
    : requests;

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      const res = await apiRequest("POST", "/api/pos/requests", {
        ...dto,
        quantity: dto.quantity ? parseFloat(dto.quantity) : 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "So'rov yaratildi" });
      setShowCreate(false);
      setForm({ material_name: "", quantity: "", unit: "dona", department: "", priority: "normal", notes: "" });
    },
    onError: () => toast({ title: "Xatolik", description: "Yaratishda muammo", variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="pos"
      title={t("materialSorovlar")}
      icon={<PackageSearch className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-request">
          <Plus className="h-4 w-4 mr-2" />
          {t("sorovYuborish")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('materialQidirish')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-requests"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all", "pending", "approved", "issued", "rejected", "cancelled"].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                className="h-9 text-xs"
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-${s}`}
              >
                {s === "all" ? "Barchasi" : (STATUS_MAP[s]?.label ?? s)}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PackageSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Qidiruv natijasi topilmadi" : "Material so'rovlar yo'q"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const status   = r.status ?? "pending";
              const sc       = STATUS_MAP[status] ?? STATUS_MAP.pending;
              const matName  = r.material_name ?? r.materialName ?? "—";
              const reqNo    = r.request_number ?? r.requestNumber;
              const reqBy    = r.requested_by ?? r.requestedBy;
              const createdAt = r.created_at ?? r.createdAt;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow" data-testid={`card-request-${r.id}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{matName}</p>
                        {reqNo && <span className="font-mono text-xs text-muted-foreground">#{reqNo}</span>}
                        <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {r.quantity !== undefined && (
                          <span>Miqdor: {r.quantity} {r.unit ?? ""}</span>
                        )}
                        {r.department && <span>Bo'lim: {r.department}</span>}
                        {r.priority && <span>{PRIORITY_MAP[r.priority] ?? r.priority}</span>}
                        {reqBy && <span>So'ragan: {reqBy}</span>}
                        {createdAt && <span>{new Date(createdAt).toLocaleDateString("uz-UZ")}</span>}
                      </div>
                      {r.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">{r.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("materialSorovi")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("materialNomi2")}</Label>
              <Input
                value={form.material_name}
                onChange={e => setForm(f => ({ ...f, material_name: e.target.value }))}
                placeholder={t("materialNomi")}
                data-testid="input-request-material"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("quantity")}</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="1"
                  data-testid="input-request-qty"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("unit")}</Label>
                <Input
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="dona"
                  data-testid="input-request-unit"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("priority")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  data-testid="select-request-priority"
                >
                  <option value="low">{t("low")}</option>
                  <option value="normal">{t("average")}</option>
                  <option value="high">{t("high")}</option>
                  <option value="urgent">{t("Shoshilinch")}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("bolim1")}</Label>
              <Input
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder={t("bolimNomi")}
                data-testid="input-request-dept"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Izoh")}</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={t("qoshimchaIzoh")}
                rows={2}
                data-testid="input-request-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.material_name.trim()) createMutation.mutate(form); }}
              disabled={!form.material_name.trim() || createMutation.isPending}
              data-testid="button-confirm-create-request"
            >
              {createMutation.isPending ? "Yuborilmoqda..." : "Yuborish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
