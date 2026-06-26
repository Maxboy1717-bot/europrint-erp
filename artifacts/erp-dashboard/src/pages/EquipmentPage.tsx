/**
 * @module EquipmentPage
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
import { Plus, Wrench, Settings2, StopCircle } from "lucide-react";
import { EPStatusPill, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { Textarea } from "@/components/ui/textarea";

interface Equipment {
  id: number;
  inventoryNumber: string;
  name: string;
  type: string;
  location: string;
  status: string;
  lastMaintenanceDate?: string;
  purchaseDate?: string;
}

interface MaintenanceOrder {
  id: string;
  equipmentName: string;
  issueDescription: string;
  status: string;
  priority: string;
  createdAt?: string;
}

export default function EquipmentPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("active");

  const [isStopOpen, setIsStopOpen] = useState(false);
  const [stopEquipment, setStopEquipment] = useState<Equipment | null>(null);
  const [issueDesc, setIssueDesc] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("high");

  const [invNumber, setInvNumber] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/mro/equipment"],
  });

  const { data: maintenanceOrders = [] } = useQuery<MaintenanceOrder[]>({
    queryKey: ["/api/mro"],
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/mro/equipment", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mro/equipment"] });
      toast({ title: t("jihozMuvaffaqiyatliQoshildi") });
      resetForm();
    },
    onError: () => {
      toast({ title: t("xatolikYuzBerdi"), variant: "destructive" });
    },
  });

  const stopMachineMutation = useMutation({
    mutationFn: (payload: { equipmentId: string; equipmentName: string; issueDescription: string; priority: string }) =>
      apiRequest("POST", "/api/mro/stop-machine", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mro"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mro/equipment"] });
      toast({ title: t("jihozToxtatildiTexnikXizmat") });
      setIsStopOpen(false);
      setStopEquipment(null);
      setIssueDesc("");
      setPriority("high");
    },
    onError: () => toast({ title: t("xatolikYuzBerdi"), variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/mro/equipment/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mro/equipment"] });
      toast({ title: t("holatYangilandi") });
      setIsStatusOpen(false);
      setSelectedId(null);
    },
    onError: () => {
      toast({ title: t("xatolikYuzBerdi"), variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsAddOpen(false);
    setInvNumber("");
    setName("");
    setType("");
    setLocation("");
    setPurchaseDate("");
  };

  const handleSave = () => {
    if (!invNumber.trim() || !name.trim()) {
      toast({ title: t("inventarRaqamiVaNomniKiriting"), variant: "destructive" });
      return;
    }
    createMutation.mutate({ inventoryNumber: invNumber, name, type, location, purchaseDate });
  };

  const openStatusDialog = (item: Equipment) => {
    setSelectedId(item.id);
    setNewStatus(item.status);
    setIsStatusOpen(true);
  };

  const openStopDialog = (item: Equipment) => {
    setStopEquipment(item);
    setIssueDesc("");
    setPriority("high");
    setIsStopOpen(true);
  };

  const handleStopMachine = () => {
    if (!stopEquipment) return;
    if (issueDesc.length < 10) {
      toast({ title: t("muammoTavsifiniKamida10"), variant: "destructive" });
      return;
    }
    stopMachineMutation.mutate({
      equipmentId: crypto.randomUUID(),
      equipmentName: stopEquipment.name,
      issueDescription: issueDesc,
      priority,
    });
  };

  const handleStatusSave = () => {
    if (selectedId === null) return;
    statusMutation.mutate({ id: selectedId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <EPStatusPill tone="success">{t("active")}</EPStatusPill>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-800">{t("tamirda")}</Badge>;
      case "retired":
        return <Badge className="bg-gray-100 text-gray-600">{t("yechibOlingan")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const list = Array.isArray(equipment) ? equipment : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 space-y-6">
      <EPPageHeader
        icon={<Wrench className="h-5 w-5" />}
        title={t("jihozlar")}
        actions={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("yangiJihoz")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("jihozlarTopilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventar1")}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("joylashuvi")}</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                  <TableHead>{t("oxirgiTa")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm font-medium">{item.inventoryNumber}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.type || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.location || "—"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.lastMaintenanceDate
                        ? new Date(item.lastMaintenanceDate).toLocaleDateString("uz-UZ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusDialog(item)}
                          className="whitespace-nowrap"
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                          {t("holatOzgartirish")}
                        </Button>
                        {item.status === "active" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openStopDialog(item)}
                            className="whitespace-nowrap"
                          >
                            <StopCircle className="h-3.5 w-3.5 mr-1.5" />
                            {t("toxtatishAmali")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      {/* Add equipment dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiJihozQoshish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("inventarRaqami")}</Label>
                <Input value={invNumber} onChange={(e) => setInvNumber(e.target.value)} placeholder="INV-001" />
              </div>
              <div>
                <Label>{t("xaridSanasi")}</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>{t("name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("jihozNomi")} />
            </div>
            <div>
              <Label>{t("type")}</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} placeholder={t("masalanPrinterFrezer")} />
            </div>
            <div>
              <Label>{t("joylashuvi")}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("masalanSexh1ZalB")} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>{t("cancel")}</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>{t("Saqlash")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maintenance orders list */}
      {Array.isArray(maintenanceOrders) && maintenanceOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-base font-semibold mb-3">{t("texnikXizmatBuyurtmalari")}</h2>
            <div className="space-y-2">
              {maintenanceOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{order.equipmentName}</p>
                    <p className="text-xs text-muted-foreground">{order.issueDescription}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className="text-xs">{order.priority}</Badge>
                    <EPStatusPill tone={order.status === "completed" ? "success" : order.status === "in_progress" ? "info" : "warning"}>
                      {order.status}
                    </EPStatusPill>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stop machine dialog */}
      <Dialog open={isStopOpen} onOpenChange={setIsStopOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("jihozniToxtatishDialog")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{t("jihozLabel")}:</span> {stopEquipment?.name}
            </div>
            <div>
              <Label>{t("muammoTavsifiLabel")} <span className="text-destructive">*</span></Label>
              <Textarea
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder={t("muammoniBatafsilTavsiflang")}
                rows={3}
              />
            </div>
            <div>
              <Label>{t("ustuvorlikLabel")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("darajaPast")}</SelectItem>
                  <SelectItem value="medium">{t("darajaOrta")}</SelectItem>
                  <SelectItem value="high">{t("darajaYuqori")}</SelectItem>
                  <SelectItem value="critical">{t("darajaKritik")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsStopOpen(false)}>{t("bekorQilish")}</Button>
              <Button variant="destructive" onClick={handleStopMachine} disabled={stopMachineMutation.isPending}>
                <StopCircle className="h-4 w-4 mr-2" />
                {t("toxtatishAmali")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change status dialog */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("holatniOzgartirish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("yangiHolat1")}</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="maintenance">{t("tamirda")}</SelectItem>
                  <SelectItem value="retired">{t("yechibOlingan")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsStatusOpen(false)}>{t("cancel")}</Button>
              <Button onClick={handleStatusSave} disabled={statusMutation.isPending}>{t("Saqlash")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
