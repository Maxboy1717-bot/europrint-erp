import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Laptop, Smartphone, Shirt, Package, Monitor, Plus, CheckCircle, RotateCcw,
  FileSignature, AlertTriangle, Clock, ClipboardList
} from "lucide-react";

const DEVICE_TYPES = [
  { value: "phone", label: "Telefon", icon: Smartphone },
  { value: "laptop", label: "Noutbuk", icon: Laptop },
  { value: "tablet", label: "Planshet", icon: Monitor },
  { value: "uniform", label: "Forma kiyim", icon: Shirt },
  { value: "equipment", label: "Jihozlar", icon: Package },
  { value: "other", label: "Boshqa", icon: Package },
];

const CONDITIONS = [
  { value: "new", label: "Yangi" },
  { value: "good", label: "Yaxshi" },
  { value: "fair", label: "O'rtacha" },
  { value: "damaged", label: "Shikastlangan" },
];

const CONDITION_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  good: "bg-green-100 text-green-800",
  fair: "bg-yellow-100 text-yellow-800",
  damaged: "bg-red-100 text-red-800",
};

function DeviceIcon({ type }: { type: string }) {
  const found = DEVICE_TYPES.find(d => d.value === type);
  if (!found) return <Package className="h-4 w-4" />;
  const Icon = found.icon;
  return <Icon className="h-4 w-4" />;
}

interface CorporateInventoryItem {
  id: number;
  userId: string;
  deviceName: string;
  deviceType: string;
  deviceTypeLabel: string;
  serialNumber: string;
  brand: string;
  condition: string;
  conditionLabel: string;
  issuedDate: string;
  returnedDate?: string | null;
  notes: string;
  employeeSignedAt?: string | null;
  returnChecked: boolean;
  createdAt: string;
}

interface CorporateInventoryTabProps {
  employeeId: string;
  isHr: boolean;
}

export function CorporateInventoryTab({ employeeId, isHr }: CorporateInventoryTabProps) {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({
    deviceName: "",
    deviceType: "laptop",
    serialNumber: "",
    brand: "",
    condition: "good",
    issuedDate: "",
    notes: "",
  });

  const { data: items, isLoading } = useQuery<CorporateInventoryItem[]>({
    queryKey: ["/api/employees", employeeId, "corporate-inventory"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/corporate-inventory`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!employeeId,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", `/api/employees/${employeeId}/corporate-inventory`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "corporate-inventory"] });
      setAddDialogOpen(false);
      setForm({ deviceName: "", deviceType: "laptop", serialNumber: "", brand: "", condition: "good", issuedDate: "", notes: "" });
      toast({ title: "Inventar qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const signMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("PATCH", `/api/employees/${employeeId}/corporate-inventory/${itemId}/sign`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "corporate-inventory"] });
      toast({ title: "Imzo tasdiqlandi" });
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("PATCH", `/api/employees/${employeeId}/corporate-inventory/${itemId}/return`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "corporate-inventory"] });
      toast({ title: "Qaytarildi deb belgilandi" });
    },
  });

  const activeItems = items?.filter(i => !i.returnedDate) || [];
  const returnedItems = items?.filter(i => i.returnedDate) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Faol inventar</p>
          <p className="text-3xl font-bold text-on-surface mt-1">{activeItems.length}</p>
          <ClipboardList className="h-4 w-4 text-primary mt-1" />
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Imzosiz</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {(Array.isArray(activeItems) ? activeItems : []).filter(i => !i.employeeSignedAt).length}
          </p>
          <FileSignature className="h-4 w-4 text-amber-500 mt-1" />
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Qaytarilgan</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{returnedItems.length}</p>
          <RotateCcw className="h-4 w-4 text-green-500 mt-1" />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Korporativ inventar
            </CardTitle>
            <CardDescription>Xodimga berilgan qurilmalar va jihozlar</CardDescription>
          </div>
          {isHr && (
            <Button size="sm" onClick={() => setAddDialogOpen(true)} data-testid="button-add-inventory">
              <Plus className="h-4 w-4 mr-2" />
              Qo'shish
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-16 w-full" />)}
            </div>
          ) : activeItems.length === 0 ? (
            <p className="text-center text-on-surface-variant py-8">Inventar yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Qurilma</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Holati</TableHead>
                  <TableHead>Berilgan sana</TableHead>
                  <TableHead>Imzo</TableHead>
                  {isHr && <TableHead>Amallar</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(activeItems) ? activeItems : []).map(item => (
                  <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DeviceIcon type={item.deviceType} />
                        <div>
                          <p className="font-medium text-sm">{item.deviceName}</p>
                          {item.brand && <p className="text-xs text-on-surface-variant">{item.brand}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.deviceTypeLabel || item.deviceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-on-surface-variant">{item.serialNumber || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-none ${CONDITION_COLORS[item.condition] || "bg-surface-container text-on-surface-variant"}`}>
                        {item.conditionLabel || item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.issuedDate}</TableCell>
                    <TableCell>
                      {item.employeeSignedAt ? (
                        <Badge className="bg-green-100 text-green-800 border-none text-xs gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Imzolangan
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-800 border-none text-xs gap-1">
                            <Clock className="h-3 w-3" />
                            Kutilmoqda
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => signMutation.mutate(item.id)}
                            disabled={signMutation.isPending}
                            data-testid={`button-sign-${item.id}`}
                          >
                            Imzolash
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    {isHr && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-orange-600 hover:text-orange-700"
                          onClick={() => returnMutation.mutate(item.id)}
                          disabled={returnMutation.isPending}
                          data-testid={`button-return-${item.id}`}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Qaytarildi
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {returnedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-on-surface-variant">
              <RotateCcw className="h-4 w-4" />
              Qaytarilgan inventar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Qurilma</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Berilgan</TableHead>
                  <TableHead>Qaytarilgan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(returnedItems) ? returnedItems : []).map(item => (
                  <TableRow key={item.id} className="opacity-60">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DeviceIcon type={item.deviceType} />
                        <span className="text-sm line-through">{item.deviceName}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{item.deviceTypeLabel || item.deviceType}</Badge></TableCell>
                    <TableCell className="text-sm">{item.issuedDate}</TableCell>
                    <TableCell className="text-sm text-green-600">{item.returnedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi inventar qo'shish</DialogTitle>
            <DialogDescription>Xodimga beriladigan qurilma yoki jihoz</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Qurilma nomi</Label>
                <Input
                  value={form.deviceName}
                  onChange={e => setForm(f => ({ ...f, deviceName: e.target.value }))}
                  placeholder="MacBook Pro 14 inch"
                  data-testid="input-device-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Turi</Label>
                <Select value={form.deviceType} onValueChange={v => setForm(f => ({ ...f, deviceType: v }))}>
                  <SelectTrigger data-testid="select-device-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(DEVICE_TYPES) ? DEVICE_TYPES : []).map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Holati</Label>
                <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger data-testid="select-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(CONDITIONS) ? CONDITIONS : []).map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brend</Label>
                <Input
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  placeholder="Apple, Samsung..."
                />
              </div>
              <div className="space-y-2">
                <Label>Serial raqam</Label>
                <Input
                  value={form.serialNumber}
                  onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))}
                  placeholder="SN-001..."
                  data-testid="input-serial-number"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Berilgan sana</Label>
                <Input
                  type="date"
                  value={form.issuedDate}
                  onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))}
                  data-testid="input-issued-date"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Izoh</Label>
                <Input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={() => addMutation.mutate(form)}
              disabled={addMutation.isPending || !form.deviceName || !form.issuedDate}
              data-testid="button-save-inventory"
            >
              {addMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
