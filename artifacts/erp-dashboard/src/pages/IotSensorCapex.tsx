/**
 * @module IotSensorCapex
 * @description Sensor qurilmalar CAPEX ro'yxati (Batch 5 Item 2). sensor_devices jadvali
 *   ustidan real CRUD: ro'yxat + yangi qurilma yaratish + install_status (kerak/rejalashtirilgan/
 *   o'rnatilgan) ni yangilash. install_status = kapital-xarajat o'qi, online/offline `status` dan alohida.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { HardDrive, Plus } from "lucide-react";

interface SensorDevice {
  id: number;
  device_code: string;
  name: string;
  name_ru?: string | null;
  device_type: string;
  connection_type?: string;
  ip_address?: string | null;
  port?: number | null;
  location?: string | null;
  is_active: boolean;
  status: string;
  install_status: string;
  created_at?: string;
}

const INSTALL_STATUS = [
  { value: "needed", label: tLabel("common.kerak", "Kerak"), tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "planned", label: tLabel("common.rejalashtirilgan", "Rejalashtirilgan"), tone: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "installed", label: tLabel("common.ornatilgan", "O'rnatilgan"), tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
];
const DEVICE_TYPE = ["inductive", "optical", "encoder", "plc_digital"];
const CONNECTION_TYPE = ["http", "mqtt", "websocket"];

const API = "/api/iot/sensor-devices";
const emptyForm = {
  deviceCode: "", name: "", nameRu: "", deviceType: "inductive",
  connectionType: "http", installStatus: "needed", location: "", ipAddress: "", port: "",
};

export default function IotSensorCapex() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: raw, isLoading, isError, error, refetch } = useQuery<{ items?: SensorDevice[]; total?: number }>({
    queryKey: [API, filter],
    queryFn: async () => {
      const qs = filter === "all" ? "" : `?installStatus=${filter}`;
      return await apiRequest("GET", `${API}${qs}`);
    },
  });

  const items: SensorDevice[] = Array.isArray(raw?.items) ? raw!.items : [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [API] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        deviceCode: form.deviceCode.trim(),
        name: form.name.trim(),
        deviceType: form.deviceType,
        connectionType: form.connectionType,
        installStatus: form.installStatus,
      };
      if (form.nameRu.trim()) payload.nameRu = form.nameRu.trim();
      if (form.location.trim()) payload.location = form.location.trim();
      if (form.ipAddress.trim()) payload.ipAddress = form.ipAddress.trim();
      if (form.port.trim()) payload.port = Number(form.port);
      return apiRequest("POST", API, payload);
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm({ ...emptyForm });
      toast({ title: tLabel("common.qurilmaQoshildi", "Qurilma qo'shildi") });
    },
    onError: (e: unknown) => toast({
      title: "Xatolik",
      description: e instanceof Error ? e.message : tLabel("common.qurilmaQoshilmadi", "Qurilma qo'shilmadi"),
      variant: "destructive",
    }),
  });

  const statusMutation = useMutation({
    mutationFn: async (v: { id: number; installStatus: string }) =>
      apiRequest("PATCH", `${API}/${v.id}`, { installStatus: v.installStatus }),
    onSuccess: () => { invalidate(); toast({ title: tLabel("common.holatYangilandi", "Holat yangilandi") }); },
    onError: () => toast({ title: "Xatolik", description: tLabel("common.holatYangilanmadi", "Holat yangilanmadi"), variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch} error={error} />;

  const canSubmit = form.deviceCode.trim().length > 0 && form.name.trim().length >= 2;
  const counts = INSTALL_STATUS.map(s => ({ ...s, n: items.filter(i => i.install_status === s.value).length }));

  return (
    <ModulePage
      module="iot"
      title="Sensor CAPEX"
      subtitle="Sensor apparati: kerak / rejalashtirilgan / o'rnatilgan"
      icon={<HardDrive className="h-5 w-5" />}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-device"><Plus className="h-4 w-4 mr-1" /> {tLabel("common.yangiQurilma", "Yangi qurilma")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{tLabel("common.yangiSensorQurilmaCapex", "Yangi sensor qurilma (CAPEX)")}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Qurilma kodi *</Label>
                  <Input data-testid="input-device-code" value={form.deviceCode}
                    onChange={e => setForm(f => ({ ...f, deviceCode: e.target.value }))} placeholder="SENS-001" />
                </div>
                <div>
                  <Label>{tLabel("common.nomiRequired", "Nomi *")}</Label>
                  <Input data-testid="input-name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Liniya-1 induktiv" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{tLabel("common.turi", "Turi")}</Label>
                  <Select value={form.deviceType} onValueChange={v => setForm(f => ({ ...f, deviceType: v }))}>
                    <SelectTrigger data-testid="select-device-type"><SelectValue /></SelectTrigger>
                    <SelectContent>{DEVICE_TYPE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ulanish</Label>
                  <Select value={form.connectionType} onValueChange={v => setForm(f => ({ ...f, connectionType: v }))}>
                    <SelectTrigger data-testid="select-connection-type"><SelectValue /></SelectTrigger>
                    <SelectContent>{CONNECTION_TYPE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CAPEX holati</Label>
                  <Select value={form.installStatus} onValueChange={v => setForm(f => ({ ...f, installStatus: v }))}>
                    <SelectTrigger data-testid="select-install-status"><SelectValue /></SelectTrigger>
                    <SelectContent>{INSTALL_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Joylashuv</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Sex-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{tLabel("common.ipManzil", "IP manzil")}</Label>
                  <Input value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))} placeholder="192.168.1.10" />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value.replace(/\D/g, "") }))} placeholder="502" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
              <Button data-testid="button-submit-device" disabled={!canSubmit || createMutation.isPending}
                onClick={() => createMutation.mutate()}>Saqlash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            Hammasi ({items.length})
          </Button>
          {counts.map(c => (
            <Button key={c.value} size="sm" variant={filter === c.value ? "default" : "outline"} onClick={() => setFilter(c.value)}>
              {c.label} ({c.n})
            </Button>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HardDrive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{tLabel("common.qurilmaTopilmadiQoshing", "Qurilma topilmadi. Yangi qurilma bilan qo'shing.")}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>{tLabel("common.nomi", "Nomi")}</TableHead>
                    <TableHead>{tLabel("common.turi", "Turi")}</TableHead>
                    <TableHead>Joylashuv</TableHead>
                    <TableHead>Ulanish</TableHead>
                    <TableHead>CAPEX holati</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(d => {
                    const meta = INSTALL_STATUS.find(s => s.value === d.install_status);
                    return (
                      <TableRow key={d.id} data-testid={`row-device-${d.id}`}>
                        <TableCell className="font-mono text-xs">{d.device_code}</TableCell>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-muted-foreground">{d.device_type}</TableCell>
                        <TableCell className="text-muted-foreground">{d.location ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{d.connection_type ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={meta?.tone}>{meta?.label ?? d.install_status}</Badge>
                            <Select value={d.install_status}
                              onValueChange={v => statusMutation.mutate({ id: d.id, installStatus: v })}>
                              <SelectTrigger data-testid={`select-status-${d.id}`} className="h-7 w-[150px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {INSTALL_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ModulePage>
  );
}
