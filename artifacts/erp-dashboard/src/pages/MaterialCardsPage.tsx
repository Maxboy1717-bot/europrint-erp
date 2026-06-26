/**
 * @module MaterialCardsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Package } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill, EPPageHeader } from "@/components/ep";
interface Material {
  id: number;
  materialCode: string;
  name: string;
  unit: string;
  category?: string;
  currentStock: number;
  minStock: number;
  status: string;
}

export default function MaterialCardsPage() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("");
  const [minStock, setMinStock] = useState("");

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/warehouse/materials"],
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/warehouse/materials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/materials"] });
      toast({ title: "Material muvaffaqiyatli qo'shildi" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setCode("");
    setName("");
    setUnit("kg");
    setCategory("");
    setMinStock("");
  };

  const handleSave = () => {
    if (!code.trim() || !name.trim()) {
      toast({ title: "Kod va nomni kiriting", variant: "destructive" });
      return;
    }
    createMutation.mutate({ materialCode: code, name, unit, category, minStock: Number(minStock) || 0 });
  };

  const list = (Array.isArray(materials) ? materials : []).filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name?.toLowerCase().includes(q) || m.materialCode?.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string, current: number, min: number) => {
    const low = current <= min;
    if (status === "inactive") return <Badge className="bg-gray-100 text-gray-600">{t("inactive")}</Badge>;
    if (low) return <EPStatusPill tone="danger">{t("kamQoldi")}</EPStatusPill>;
    return <EPStatusPill tone="success">{t("active")}</EPStatusPill>;
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 space-y-6">
      <EPPageHeader
        title={t('materialKartalar')}
        subtitle={`${list.length} ta material`}
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("yangiMaterial")}
          </Button>
        }
      />

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("Qidirish...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("materiallarTopilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("olchov1")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead className="text-right">{t("currentBalance")}</TableHead>
                  <TableHead className="text-right">{t("minQoldiq")}</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm">{m.materialCode}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{m.category || "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={m.currentStock <= m.minStock ? "text-[var(--ep-red)]" : ""}>
                        {m.currentStock?.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.minStock?.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(m.status, m.currentStock, m.minStock)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiMaterialQoshish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('materialKodi')}</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAT-001" />
              </div>
              <div>
                <Label>{t("olchovBirligi")}</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="pcs">dona</SelectItem>
                    <SelectItem value="m">metr</SelectItem>
                    <SelectItem value="L">litr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t("name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("materialNomi")} />
            </div>
            <div>
              <Label>{t("category")}</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("masalanQogoz")} />
            </div>
            <div>
              <Label>{t("minimalQoldiq")}</Label>
              <Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>{t("cancel")}</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>{t("Saqlash")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
