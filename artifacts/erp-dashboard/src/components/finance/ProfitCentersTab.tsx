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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Plus, Pencil } from "lucide-react";
import type { ProfitCenter, User } from "@shared/schema";

const profitCenterFormSchema = z.object({
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  nameRu: z.string().optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ProfitCenterFormValues = z.infer<typeof profitCenterFormSchema>;

export function ProfitCentersTab() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProfitCenter | null>(null);

  const { data: profitCenters = [], isLoading } = useQuery<ProfitCenter[]>({
    queryKey: ["/api/fi/profit-centers"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<ProfitCenterFormValues>({
    resolver: zodResolver(profitCenterFormSchema),
    defaultValues: {
      code: "", name: "", nameRu: "", description: "", managerId: "", isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProfitCenterFormValues) => apiRequest("POST", "/api/fi/profit-centers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/profit-centers"] });
      toast({ title: "Muvaffaqiyatli", description: "Foyda markazi yaratildi" });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Yaratishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProfitCenterFormValues> }) =>
      apiRequest("PATCH", `/api/fi/profit-centers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/profit-centers"] });
      toast({ title: "Muvaffaqiyatli", description: "Foyda markazi yangilandi" });
      setEditingItem(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Yangilashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/fi/profit-centers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/profit-centers"] });
      toast({ title: "Muvaffaqiyatli", description: "Foyda markazi o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "O'chirishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProfitCenterFormValues) => {
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data });
    else createMutation.mutate(data);
  };

  const openEditDialog = (item: ProfitCenter) => {
    setEditingItem(item);
    form.reset({
      code: item.code, name: item.name, nameRu: item.nameRu || "",
      description: item.description || "", managerId: item.managerId || "", isActive: item.isActive,
    });
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const getUserName = (id: string | null) => {
    if (!id) return "-";
    return (Array.isArray(users) ? users : []).find((u) => u.id === id)?.fullName || "-";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant" data-testid="text-profit-centers-title">
          Foyda Markazlari
        </h3>
        <Dialog open={isAddOpen || !!editingItem} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-profit-center" className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
              <Plus className="mr-2 h-4 w-4" />
              Yangi qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-surface-container-lowest border-none rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-on-surface">{editingItem ? "Tahrirlash" : "Yangi foyda markazi"}</DialogTitle>
              <DialogDescription className="text-on-surface-variant">
                Foyda markazi ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-on-surface-variant">Kod</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="PC001" data-testid="input-profit-center-code" className="bg-surface border-outline-variant text-on-surface" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-on-surface-variant">Nomi (UZ)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Asosiy sotish" data-testid="input-profit-center-name" className="bg-surface border-outline-variant text-on-surface" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nameRu" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-on-surface-variant">Nomi (RU)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Основные продажи" data-testid="input-profit-center-name-ru" className="bg-surface border-outline-variant text-on-surface" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-on-surface-variant">Tavsif</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Foyda markazi haqida..." data-testid="input-profit-center-description" className="bg-surface border-outline-variant text-on-surface" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="managerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-on-surface-variant">Rahbar</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-profit-center-manager" className="bg-surface border-outline-variant text-on-surface">
                          <SelectValue placeholder="Rahbarni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-surface-container-lowest border-none">
                        {(Array.isArray(users) ? users : []).map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog} className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none">
                    Bekor qilish
                  </Button>
                  <Button type="submit" data-testid="button-save-profit-center" className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
                    {editingItem ? "Saqlash" : "Yaratish"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-surface-container-lowest border-none rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kod</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Nomi</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tavsif</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Rahbar</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holati</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-on-surface-variant">Yuklanmoqda...</TableCell>
                </TableRow>
              ) : profitCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-on-surface-variant">Foyda markazlari topilmadi</TableCell>
                </TableRow>
              ) : (
                (Array.isArray(profitCenters) ? profitCenters : []).map((item) => (
                  <TableRow key={item.id} data-testid={`row-profit-center-${item.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                    <TableCell className="py-3 px-6 font-mono text-on-surface">{item.code}</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.nameRu && <div className="text-[11px] text-on-surface-variant">{item.nameRu}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-on-surface max-w-[200px] truncate">{item.description || "-"}</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">{getUserName(item.managerId)}</TableCell>
                    <TableCell className="py-3 px-6">
                      <Badge className={item.isActive ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                        {item.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}
                          data-testid={`button-edit-profit-center-${item.id}`}
                          className="hover:bg-surface-container-high text-on-surface">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Foyda markazini o'chirishni tasdiqlaysizmi?"
                          description="Foyda markazi va unga bog'liq barcha ma'lumotlar o'chiriladi."
                          onConfirm={() => deleteMutation.mutate(item.id)}
                          isPending={deleteMutation.isPending}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
