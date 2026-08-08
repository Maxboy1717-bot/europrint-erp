/**
 * @module WmsGoodsIssuePage
 * @description WMS goods issue: list + create. Route: /wms/goods-issue
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PackageMinus, Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface WmsGoodsIssue {
  id: number;
  material_id: number;
  warehouse_id: number;
  quantity: string | number;
  pp_id?: number | null;
  status: string;
  notes?: string | null;
  issued_by?: number | null;
  issued_at?: string | null;
  created_at?: string | null;
}

interface MaterialCard {
  id: number;
  xom_ashyo: string;
  kod?: string | null;
}

interface Warehouse {
  id: number;
  name: string;
  code?: string | null;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    issued: "bg-[var(--ep-green)]/15 text-[var(--ep-green)]",
    pending: "bg-[var(--ep-yellow)]/15 text-[var(--ep-yellow)]",
    cancelled: "bg-[var(--ep-red)]/15 text-[var(--ep-red)]",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

export default function WmsGoodsIssuePage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [materialId, setMaterialId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [amount, setAmount] = useState("");
  const [ppId, setPpId] = useState("");

  const { data: listData, isLoading } = useQuery<{ data: WmsGoodsIssue[] }>({
    queryKey: ["/api/wms/goods-issue"],
  });
  const issues = Array.isArray(listData?.data) ? listData.data : [];

  const { data: materials = [] } = useQuery<MaterialCard[]>({
    queryKey: ["/api/material-cards"],
    select: (d) => (Array.isArray(d) ? d : Array.isArray((d as { data?: unknown[] }).data) ? (d as { data: MaterialCard[] }).data : []),
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouse/warehouses"],
    select: (d) => (Array.isArray(d) ? d : Array.isArray((d as { data?: unknown[] }).data) ? (d as { data: Warehouse[] }).data : []),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("POST", "/api/wms/goods-issue", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wms/goods-issue"] });
      setIsDialogOpen(false);
      setMaterialId(""); setWarehouseId(""); setAmount(""); setPpId("");
      toast({ title: t("tovarChiqimQoshildi", "Tovar chiqim qo'shildi") });
    },
    onError: () => toast({ title: t("xatolikYuzBerdi", "Xatolik yuz berdi"), variant: "destructive" }),
  });

  const handleCreate = () => {
    const amt = Number(amount);
    if (!materialId || !warehouseId || !amount || isNaN(amt) || amt <= 0) {
      toast({ title: t("majburiyMaydonlarniToldiring", "Majburiy maydonlarni to'ldiring"), variant: "destructive" });
      return;
    }
    createMutation.mutate({
      materialId: Number(materialId),
      warehouseId: Number(warehouseId),
      amount: amt,
      ppId: ppId ? Number(ppId) : undefined,
    });
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageMinus className="h-5 w-5 text-[var(--ep-red)]" />
          <h1 className="text-2xl font-bold">{t("tovarChiqim", "Tovar Chiqim (Goods Issue)")}</h1>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-goods-issue">
          <Plus className="h-4 w-4 mr-2" />
          {t("chiqimQoshish", "Chiqim qo'shish")}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: t("jami", "Jami chiqimlar"), value: issues.length, color: "text-[var(--ep-blue)]" },
          { label: t("chiqarildi", "Chiqarildi"), value: issues.filter(i => i.status === "issued").length, color: "text-[var(--ep-green)]" },
          { label: t("kutilmoqda", "Kutilmoqda"), value: issues.filter(i => i.status === "pending").length, color: "text-[var(--ep-yellow)]" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : issues.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <PackageMinus className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("chiqimlarYoq", "Chiqimlar topilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("id", "ID")}</TableHead>
                    <TableHead>{t("materialId", "Material ID")}</TableHead>
                    <TableHead>{t("omborId", "Ombor ID")}</TableHead>
                    <TableHead>{t("miqdor", "Miqdor")}</TableHead>
                    <TableHead>{t("ppId", "PP ID")}</TableHead>
                    <TableHead>{t("status28", "Status")}</TableHead>
                    <TableHead>{t("sana", "Sana")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map(issue => (
                    <TableRow key={issue.id} data-testid={`row-goods-issue-${issue.id}`}>
                      <TableCell className="font-mono text-sm">{issue.id}</TableCell>
                      <TableCell className="text-sm">
                        {materials.find(m => m.id === issue.material_id)?.xom_ashyo ?? issue.material_id}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {warehouses.find(w => w.id === issue.warehouse_id)?.name ?? issue.warehouse_id}
                      </TableCell>
                      <TableCell className="font-medium">{Number(issue.quantity).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{issue.pp_id ?? "—"}</TableCell>
                      <TableCell>{statusBadge(issue.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {issue.issued_at ? new Date(issue.issued_at).toLocaleDateString("uz-UZ") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {t("yangiChiqim", "Yangi tovar chiqim")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("material", "Material")} *</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger data-testid="select-goods-issue-material">
                  <SelectValue placeholder={t("materialTanlang", "Material tanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(materials) ? materials : []).map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.xom_ashyo} {m.kod ? `(${m.kod})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("ombor", "Ombor")} *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger data-testid="select-goods-issue-warehouse">
                  <SelectValue placeholder={t("omborTanlang", "Ombor tanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(warehouses) ? warehouses : []).map(w => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} {w.code ? `(${w.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("miqdor", "Miqdor")} *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  data-testid="input-goods-issue-amount"
                />
              </div>
              <div>
                <Label>{t("ppId", "PP buyurtma ID")}</Label>
                <Input
                  type="number"
                  value={ppId}
                  onChange={e => setPpId(e.target.value)}
                  placeholder="1"
                  min="1"
                  data-testid="input-goods-issue-ppid"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !materialId || !warehouseId || !amount || Number(amount) <= 0}
                data-testid="button-save-goods-issue"
              >
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
