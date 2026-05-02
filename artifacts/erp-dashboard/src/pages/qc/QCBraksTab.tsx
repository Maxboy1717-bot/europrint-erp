import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TriangleAlert, Plus, Search, ClipboardList } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQCBrakCostImpact, useQCInspections, useQCInspectionById } from "@/hooks/use-qc";

interface Brak {
  id: string;
  brakDate: string;
  stage: string;
  quantity: number;
  reason: string;
  description: string;
  costImpact: number;
  isReworkable: boolean;
  papkaOrderId?: string | number;
}

export function QCBraksTab() {
  const { toast } = useToast();
  const [brakDialogOpen, setBrakDialogOpen] = useState(false);
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);

  const { data: braksData, isLoading: braksLoading } = useQuery<Brak[]>({
    queryKey: ["/api/qc/braks"],
  });

  const { data: costImpact, isLoading: costImpactLoading } = useQCBrakCostImpact(activeOrderId);
  const { data: inspections = [], isLoading: inspectionsLoading } = useQCInspections();
  const { data: inspectionDetail, isLoading: detailLoading } = useQCInspectionById(selectedInspectionId);

  const createBrakMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/qc/braks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/braks"] });
      setBrakDialogOpen(false);
      toast({ title: "Brak qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TriangleAlert className="w-5 h-5" />
                Brak boshqaruvi
              </CardTitle>
              <CardDescription>Ishlab chiqarishdagi nuqsonli mahsulotlar</CardDescription>
            </div>
            <Button onClick={() => setBrakDialogOpen(true)} data-testid="button-add-brak">
              <Plus className="w-4 h-4 mr-2" />
              Brak qayd etish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {braksLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : !braksData?.length ? (
            <div className="text-center py-8 text-muted-foreground">Braklar yo'q</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Bosqich</TableHead>
                  <TableHead>Miqdor</TableHead>
                  <TableHead>Sabab</TableHead>
                  <TableHead>Qayta ishlash</TableHead>
                  <TableHead>Xarajat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(braksData) ? braksData : []).map(b => (
                  <TableRow key={b.id} data-testid={`row-brak-${b.id}`}>
                    <TableCell>{b.brakDate}</TableCell>
                    <TableCell><Badge variant="outline">{b.stage}</Badge></TableCell>
                    <TableCell className="font-medium">{b.quantity} dona</TableCell>
                    <TableCell>{b.reason}</TableCell>
                    <TableCell>
                      <Badge variant={b.isReworkable ? "default" : "secondary"}>
                        {b.isReworkable ? "Mumkin" : "Yo'q"}
                      </Badge>
                    </TableCell>
                    <TableCell>{b.costImpact ? `${Number(b.costImpact).toLocaleString()} so'm` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4" />
            Buyurtma bo'yicha xarajat ta'siri
          </CardTitle>
          <CardDescription>Papka buyurtma ID bo'yicha brak xarajatlarini hisoblash</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Papka buyurtma ID kiriting..."
              value={orderIdSearch}
              onChange={e => setOrderIdSearch(e.target.value)}
              data-testid="input-order-id-search"
            />
            <Button
              variant="outline"
              onClick={() => setActiveOrderId(orderIdSearch.trim() || null)}
              disabled={!orderIdSearch.trim()}
              data-testid="button-search-cost-impact"
            >
              {costImpactLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          {activeOrderId && costImpact && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Jami braklar</p>
                <p className="text-xl font-bold">{costImpact.totalBraks}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Jami miqdor</p>
                <p className="text-xl font-bold">{costImpact.totalQuantity.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Xarajat ta'siri</p>
                <p className="text-xl font-bold text-red-600">
                  {costImpact.totalCostImpact > 0 ? `${costImpact.totalCostImpact.toLocaleString()} so'm` : "—"}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Qayta ishlanadi</p>
                <p className="text-xl font-bold text-green-600">{costImpact.reworkable}</p>
              </div>
            </div>
          )}
          {activeOrderId && !costImpactLoading && !costImpact && (
            <p className="text-sm text-muted-foreground text-center py-4">Bu buyurtma uchun brak topilmadi</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Inspeksiyalar
          </CardTitle>
          <CardDescription>QC inspeksiyalari ro'yxati va tafsilotlari</CardDescription>
        </CardHeader>
        <CardContent>
          {inspectionsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !inspections.length ? (
            <p className="text-center text-sm text-muted-foreground py-4">Inspeksiyalar yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Namuna</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.slice(0, 10).map(insp => (
                  <TableRow
                    key={insp.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedInspectionId(insp.id === selectedInspectionId ? null : insp.id)}
                    data-testid={`row-inspection-${insp.id}`}
                  >
                    <TableCell className="font-mono text-xs">{String(insp.id).slice(0, 8)}…</TableCell>
                    <TableCell>
                      <Badge variant={insp.status === "passed" ? "default" : insp.status === "failed" ? "destructive" : "secondary"}>
                        {insp.status ?? "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>{insp.sampleSize ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{insp.createdAt ? new Date(insp.createdAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      {selectedInspectionId === insp.id && (
                        <Badge variant="outline" className="text-xs">Tanlangan</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {selectedInspectionId && (
            <div className="mt-4 rounded-lg border p-4 bg-muted/30">
              {detailLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>
              ) : inspectionDetail ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Inspeksiya #{String(selectedInspectionId).slice(0, 8)}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(inspectionDetail as Record<string, unknown>)
                      .filter(([k]) => !['id', '__typename'].includes(k))
                      .slice(0, 8)
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-1">
                          <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{String(v ?? '—')}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Tafsilotlar yuklanmoqda…</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={brakDialogOpen} onOpenChange={setBrakDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Brak Qayd etish</DialogTitle>
            <DialogDescription>Nuqsonli mahsulotni qayd eting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sana *</label>
                <Input id="brak-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} data-testid="input-brak-date" />
              </div>
              <div>
                <label className="text-sm font-medium">Miqdor *</label>
                <Input id="brak-qty" type="number" placeholder="0" defaultValue="0" data-testid="input-brak-qty" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Bosqich *</label>
                <Select onValueChange={(v) => { const el = document.getElementById("brak-stage-h") as HTMLInputElement; if(el) el.value = v; }}>
                  <SelectTrigger data-testid="select-brak-stage">
                    <SelectValue placeholder="Bosqich" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Kiruvchi material</SelectItem>
                    <SelectItem value="production">Ishlab chiqarish</SelectItem>
                    <SelectItem value="final">Yakuniy nazorat</SelectItem>
                    <SelectItem value="warehouse">Ombor</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" id="brak-stage-h" defaultValue="production" />
              </div>
              <div>
                <label className="text-sm font-medium">Sabab *</label>
                <Select onValueChange={(v) => { const el = document.getElementById("brak-reason-h") as HTMLInputElement; if(el) el.value = v; }}>
                  <SelectTrigger data-testid="select-brak-reason">
                    <SelectValue placeholder="Sabab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="misprint">Noto'g'ri bosma</SelectItem>
                    <SelectItem value="size">O'lcham xato</SelectItem>
                    <SelectItem value="damage">Shikast</SelectItem>
                    <SelectItem value="moisture">Namlik</SelectItem>
                    <SelectItem value="equipment">Uskuna nosozligi</SelectItem>
                    <SelectItem value="operator_error">Operator xatosi</SelectItem>
                    <SelectItem value="material">Material sifati</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" id="brak-reason-h" defaultValue="misprint" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tavsif</label>
              <Input id="brak-desc" placeholder="Qo'shimcha ma'lumot" data-testid="input-brak-desc" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBrakDialogOpen(false)}>Bekor</Button>
              <Button
                data-testid="button-submit-brak"
                disabled={createBrakMutation.isPending}
                onClick={() => {
                  const brakDate = (document.getElementById("brak-date") as HTMLInputElement)?.value;
                  const quantity = parseInt((document.getElementById("brak-qty") as HTMLInputElement)?.value || "0");
                  const stage = (document.getElementById("brak-stage-h") as HTMLInputElement)?.value || "production";
                  const reason = (document.getElementById("brak-reason-h") as HTMLInputElement)?.value || "misprint";
                  const description = (document.getElementById("brak-desc") as HTMLInputElement)?.value;
                  if (!brakDate || !quantity) {
                    toast({ title: "Sana va miqdor kiritilishi shart", variant: "destructive" });
                    return;
                  }
                  createBrakMutation.mutate({ brakDate, quantity, stage, reason, description });
                }}
              >
                {createBrakMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Saqlash
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
