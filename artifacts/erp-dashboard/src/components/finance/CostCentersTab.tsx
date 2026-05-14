/**
 * @module CostCentersTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Plus, Pencil } from "lucide-react";
import type { CostCenter, Department, User } from "@shared/schema";
import { EPErrorState } from "@/components/ep";

const costCenterFormSchema = z.object({
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  nameRu: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CostCenterFormValues = z.infer<typeof costCenterFormSchema>;

export function CostCentersTab() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostCenter | null>(null);

  const { data: costCenters = [], isLoading, isError, refetch } = useQuery<CostCenter[]>({
    queryKey: ["/api/fi/cost-centers"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<CostCenterFormValues>({
    resolver: zodResolver(costCenterFormSchema),
    defaultValues: {
      code: "", name: "", nameRu: "", departmentId: "", managerId: "", isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CostCenterFormValues) => apiRequest("POST", "/api/fi/cost-centers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/cost-centers"] });
      toast({ title: "Muvaffaqiyatli", description: "Xarajat markazi yaratildi" });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Yaratishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CostCenterFormValues> }) =>
      apiRequest("PATCH", `/api/fi/cost-centers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/cost-centers"] });
      toast({ title: "Muvaffaqiyatli", description: "Xarajat markazi yangilandi" });
      setEditingItem(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Yangilashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/fi/cost-centers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/cost-centers"] });
      toast({ title: "Muvaffaqiyatli", description: "Xarajat markazi o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "O'chirishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const onSubmit = (data: CostCenterFormValues) => {
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data });
    else createMutation.mutate(data);
  };

  const openEditDialog = (item: CostCenter) => {
    setEditingItem(item);
    form.reset({
      code: item.code, name: item.name, nameRu: item.nameRu || "",
      departmentId: item.departmentId || "", managerId: item.managerId || "", isActive: item.isActive,
    });
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const getDepartmentName = (id: string | null) => {
    if (!id) return "-";
    return (Array.isArray(departments) ? departments : []).find((d) => d.id === id)?.name || "-";
  };

  const getUserName = (id: string | null) => {
    if (!id) return "-";
    return (Array.isArray(users) ? users : []).find((u) => u.id === id)?.fullName || "-";
  };

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="text-cost-centers-title">
          Xarajat Markazlari
        </h3>
        <Dialog open={isAddOpen || !!editingItem} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-cost-center" className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
              <Plus className="mr-2 h-4 w-4" />
              Yangi qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border-none rounded-xl p-6">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingItem ? "Tahrirlash" : "Yangi xarajat markazi"}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Xarajat markazi ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Kod</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CC001" data-testid="input-cost-center-code" className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Nomi (UZ)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ishlab chiqarish" data-testid="input-cost-center-name" className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nameRu" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Nomi (RU)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Производство" data-testid="input-cost-center-name-ru" className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="departmentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Bo'lim</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cost-center-department" className="bg-background border-border text-foreground h-9">
                          <SelectValue placeholder="Bo'limni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-none">
                        {(Array.isArray(departments) ? departments : []).map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="managerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Rahbar</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cost-center-manager" className="bg-background border-border text-foreground h-9">
                          <SelectValue placeholder="Rahbarni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-none">
                        {(Array.isArray(users) ? users : []).map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog} className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none">
                    Bekor qilish
                  </Button>
                  <Button type="submit" data-testid="button-save-cost-center" className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
                    {editingItem ? "Saqlash" : "Yaratish"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-none rounded-xl">
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Kod</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Nomi</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Bo'lim</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Rahbar</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Holati</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell>
                </TableRow>
              ) : costCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">Xarajat markazlari topilmadi</TableCell>
                </TableRow>
              ) : (
                (Array.isArray(costCenters) ? costCenters : []).map((item) => (
                  <TableRow key={item.id} data-testid={`row-cost-center-${item.id}`} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 font-mono text-foreground">{item.code}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.nameRu && <div className="text-[11px] text-muted-foreground">{item.nameRu}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{getDepartmentName(item.departmentId)}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{getUserName(item.managerId)}</TableCell>
                    <TableCell className="py-3 px-6">
                      <Badge className={item.isActive ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                        {item.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}
                          data-testid={`button-edit-cost-center-${item.id}`}
                          className="hover:bg-muted text-foreground">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Xarajat markazini o'chirishni tasdiqlaysizmi?"
                          description="Xarajat markazi va unga bog'liq barcha ma'lumotlar o'chiriladi."
                          onConfirm={() => deleteMutation.mutate(item.id)}
                          isPending={deleteMutation.isPending}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
