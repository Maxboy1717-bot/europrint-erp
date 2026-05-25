/**
 * @module WastePage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 as WasteIcon, Plus, Search, AlertTriangle, TrendingDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface WasteRecord {
  id: string | number;
  material_name?: string;
  materialName?: string;
  waste_type?: string;
  wasteType?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  department?: string;
  recorded_by?: string;
  recordedBy?: string;
  recorded_at?: string;
  recordedAt?: string;
  reason?: string;
  status?: string;
}

interface WasteDashboard {
  totalWasteCost?: number;
  totalWasteQty?: number;
  wasteByType?: Array<{ type: string; qty: number; cost: number }>;
  trend?: string;
}

const TYPE_LABELS: Record<string, string> = {
  defect:   "Brak",
  spoilage: "Buzilish",
  excess:   "Ortiqcha",
  process:  "Texnologik",
  other:    "Boshqa",
};

const fmtMoney = (v?: number) => v !== undefined ? `${Number(v).toLocaleString("uz-UZ")} so'm` : "—";

export default function WastePage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    material_name: "", waste_type: "defect", quantity: "", unit: "kg", cost: "", reason: "", department: "",
  });

  const { data: dashRaw, isLoading: loadingDash } = useQuery<WasteDashboard>({
    queryKey: ["/api/waste/dashboard"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/waste/dashboard");
    },
  });

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<WasteRecord[] | { data?: WasteRecord[] }>({
    queryKey: ["/api/waste/records"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/waste/records");
    },
  });

  const records: WasteRecord[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: WasteRecord[] })?.data ?? [];

  const dash = dashRaw ?? {} as WasteDashboard;

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/waste/records", {
        ...dto,
        quantity: dto.quantity ? parseFloat(dto.quantity) : 0,
        cost:     dto.cost     ? parseFloat(dto.cost)     : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waste/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/waste/dashboard"] });
      toast({ title: "Chiqindi yozuvi qo'shildi" });
      setShowCreate(false);
      setForm({ material_name: "", waste_type: "defect", quantity: "", unit: "kg", cost: "", reason: "", department: "" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Yozuv qo'shishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const filtered = records.filter(r => {
    const name = (r.material_name ?? r.materialName ?? "").toLowerCase();
    const dept = (r.department ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || dept.includes(search.toLowerCase());
  });

  return (
    <ModulePage
      module="production"
      title={t("chiqindilar")}
      icon={<WasteIcon className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-waste">
          <Plus className="h-4 w-4 mr-2" />
          {t("chiqindiQoshish")}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Dashboard summary */}
        {!loadingDash && (
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{fmtMoney(dash.totalWasteCost)}</p>
                    <p className="text-xs text-muted-foreground">{t("jamiChiqindiQiymati")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <TrendingDown className="h-4 w-4 text-[var(--ep-yellow)]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{dash.totalWasteQty ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t("jamiMiqdor")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {dash.wasteByType && dash.wasteByType.length > 0 && (
              <Card className="col-span-2 sm:col-span-1">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">{t("turBoyicha1")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {dash.wasteByType.slice(0, 3).map(wt => (
                    <div key={wt.type} className="flex items-center justify-between text-xs">
                      <span>{TYPE_LABELS[wt.type] ?? wt.type}</span>
                      <span className="font-medium">{wt.qty}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("materialYokiBolimQidirish")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-waste"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <WasteIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Qidiruv natijasi topilmadi" : "Chiqindi yozuvlari yo'q"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const name = r.material_name ?? r.materialName ?? "—";
              const type = r.waste_type ?? r.wasteType ?? "other";
              const date = r.recorded_at ?? r.recordedAt;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow" data-testid={`card-waste-${r.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        {r.quantity !== undefined && (
                          <span>{r.quantity} {r.unit ?? ""}</span>
                        )}
                        {r.cost !== undefined && r.cost > 0 && (
                          <span>{fmtMoney(r.cost)}</span>
                        )}
                        {r.department && <span>{r.department}</span>}
                        {date && <span>{new Date(date).toLocaleDateString("uz-UZ")}</span>}
                        {r.reason && <span className="italic">"{r.reason}"</span>}
                      </div>
                    </div>
                    <EPStatusPill tone="neutral" className="text-xs shrink-0">
                      {TYPE_LABELS[type] ?? type}
                    </EPStatusPill>
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
            <DialogTitle className="text-[18px] font-semibold">{t("yangiChiqindiYozuvi")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("materialNomi2")}</Label>
              <Input
                value={form.material_name}
                onChange={e => setForm(f => ({ ...f, material_name: e.target.value }))}
                placeholder={t("materialNomi")}
                data-testid="input-waste-material"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("quantity")}</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="10"
                  data-testid="input-waste-quantity"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("unit")}</Label>
                <Input
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="kg"
                  data-testid="input-waste-unit"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("qiymati")}</Label>
                <Input
                  type="number"
                  value={form.cost}
                  onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                  placeholder="50000"
                  data-testid="input-waste-cost"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("tur")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.waste_type}
                  onChange={e => setForm(f => ({ ...f, waste_type: e.target.value }))}
                  data-testid="select-waste-type"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("bolim1")}</Label>
                <Input
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder={t("bolimNomi")}
                  data-testid="input-waste-department"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("sabab")}</Label>
              <Textarea
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder={t("chiqindiSababi")}
                rows={2}
                data-testid="input-waste-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.material_name.trim()) createMutation.mutate(form); }}
              disabled={!form.material_name.trim() || createMutation.isPending}
              data-testid="button-confirm-create-waste"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
