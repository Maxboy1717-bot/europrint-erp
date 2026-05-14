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
import { Plus, Wrench, Settings2 } from "lucide-react";
import { EPStatusPill } from "@/components/ep";

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

export default function EquipmentPage() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("active");

  const [invNumber, setInvNumber] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/mro/equipment"],
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/mro/equipment", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mro/equipment"] });
      toast({ title: "Jihoz muvaffaqiyatli qo'shildi" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/mro/equipment/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mro/equipment"] });
      toast({ title: "Holat yangilandi" });
      setIsStatusOpen(false);
      setSelectedId(null);
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
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
      toast({ title: "Inventar raqami va nomni kiriting", variant: "destructive" });
      return;
    }
    createMutation.mutate({ inventoryNumber: invNumber, name, type, location, purchaseDate });
  };

  const openStatusDialog = (item: Equipment) => {
    setSelectedId(item.id);
    setNewStatus(item.status);
    setIsStatusOpen(true);
  };

  const handleStatusSave = () => {
    if (selectedId === null) return;
    statusMutation.mutate({ id: selectedId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <EPStatusPill tone="success">Faol</EPStatusPill>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-800">Ta'mirda</Badge>;
      case "retired":
        return <Badge className="bg-gray-100 text-gray-600">Yechib olingan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const list = Array.isArray(equipment) ? equipment : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jihozlar</h1>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yangi jihoz
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Jihozlar topilmadi</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inventar №</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Joylashuvi</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Oxirgi TA</TableHead>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStatusDialog(item)}
                        className="whitespace-nowrap"
                      >
                        <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                        Holat o'zgartirish
                      </Button>
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
            <DialogTitle className="text-[18px] font-semibold">Yangi jihoz qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Inventar raqami</Label>
                <Input value={invNumber} onChange={(e) => setInvNumber(e.target.value)} placeholder="INV-001" />
              </div>
              <div>
                <Label>Xarid sanasi</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Nomi</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jihoz nomi" />
            </div>
            <div>
              <Label>Turi</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Masalan: Printer, Frezer" />
            </div>
            <div>
              <Label>Joylashuvi</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Masalan: Sexh 1, Zal B" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Bekor qilish</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>Saqlash</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change status dialog */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Holatni o'zgartirish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Yangi holat</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="maintenance">Ta'mirda</SelectItem>
                  <SelectItem value="retired">Yechib olingan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsStatusOpen(false)}>Bekor qilish</Button>
              <Button onClick={handleStatusSave} disabled={statusMutation.isPending}>Saqlash</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
