import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, Building2, Phone, Mail, CreditCard } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  nameRu: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  currency: string | null;
  isActive: boolean;
  createdAt: string;
}

const vendorFormSchema = z.object({
  vendorCode: z.string().min(1, "Vendor kodi kerak"),
  name: z.string().min(1, "Nomi kerak"),
  nameRu: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Noto'g'ri email formati").optional().or(z.literal("")),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  currency: z.string().default("UZS"),
  isActive: z.boolean().default(true),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

export default function MMVendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();

  const { data: vendors = [], isLoading, isError, refetch} = useQuery<Vendor[]>({
    queryKey: ["/api/mm/vendors"],
  });

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendorCode: "",
      name: "",
      nameRu: "",
      address: "",
      phone: "",
      email: "",
      taxId: "",
      paymentTerms: "",
      currency: "UZS",
      isActive: true,
    },
  });

  const editForm = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendorCode: "",
      name: "",
      nameRu: "",
      address: "",
      phone: "",
      email: "",
      taxId: "",
      paymentTerms: "",
      currency: "UZS",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      return apiRequest("POST", "/api/mm/vendors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendors"] });
      toast({
        title: "Muvaffaqiyatli",
        description: "Yetkazuvchi yaratildi",
      });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Yetkazuvchi yaratishda xatolik",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VendorFormData }) => {
      return apiRequest("PATCH", `/api/mm/vendors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendors"] });
      toast({
        title: "Muvaffaqiyatli",
        description: "Yetkazuvchi yangilandi",
      });
      setEditDialogOpen(false);
      setSelectedVendor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Yetkazuvchi yangilashda xatolik",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/mm/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendors"] });
      toast({
        title: "Muvaffaqiyatli",
        description: "Yetkazuvchi o'chirildi",
      });
      setDeleteDialogOpen(false);
      setSelectedVendor(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Yetkazuvchi o'chirishda xatolik",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: VendorFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    editForm.reset({
      vendorCode: vendor.vendorCode,
      name: vendor.name,
      nameRu: vendor.nameRu || "",
      address: vendor.address || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      taxId: vendor.taxId || "",
      paymentTerms: vendor.paymentTerms || "",
      currency: vendor.currency || "UZS",
      isActive: vendor.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = (data: VendorFormData) => {
    if (selectedVendor) {
      updateMutation.mutate({ id: selectedVendor.id, data });
    }
  };

  const handleDeleteClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedVendor) {
      deleteMutation.mutate(selectedVendor.id);
    }
  };

  const filteredVendors = (Array.isArray(vendors) ? vendors : []).filter((vendor) => {
    const query = searchQuery.toLowerCase();
    return (
      vendor.vendorCode?.toLowerCase().includes(query) ||
      vendor.name?.toLowerCase().includes(query) ||
      vendor.nameRu?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: vendors.length,
    active: (Array.isArray(vendors) ? vendors : []).filter((v) => v.isActive).length,
    inactive: (Array.isArray(vendors) ? vendors : []).filter((v) => !v.isActive).length,
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yetkazuvchilar"
        boldWord="Ro'yxati"
        subtitle="Barcha yetkazuvchilar ro'yxati"
        data-testid="text-mm-vendors-title"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="text-total-vendors">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Jami yetkazuvchilar</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{stats.total}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="text-active-vendors">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Faol</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{stats.active}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">Faol yetkazuvchilar</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="text-inactive-vendors">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Nofaol</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{stats.inactive}</p>
          <p className="text-xs text-on-surface-variant mt-2 font-medium">Nofaol yetkazuvchilar</p>
        </div>
      </div>

      <Card className="bg-surface-container-lowest border-none rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Yetkazuvchilar ro'yxati</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <Input
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-surface border-outline-variant text-on-surface"
                data-testid="input-search-vendors"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {([...Array(5)]).map((_, i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant" data-testid="text-no-vendors">
              {searchQuery ? "Qidiruv bo'yicha hech narsa topilmadi" : "Yetkazuvchilar mavjud emas"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kod</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Nomi</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Telefon</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Email</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">To'lov shartlari</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(filteredVendors) ? filteredVendors : []).map((vendor) => (
                  <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                    <TableCell className="py-3 px-6 font-medium text-on-surface" data-testid={`text-vendor-code-${vendor.id}`}>
                      {vendor.vendorCode}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-on-surface" data-testid={`text-vendor-name-${vendor.id}`}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-on-surface-variant" />
                        {vendor.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-on-surface" data-testid={`text-vendor-phone-${vendor.id}`}>
                      {vendor.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-on-surface-variant" />
                          {vendor.phone}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-on-surface" data-testid={`text-vendor-email-${vendor.id}`}>
                      {vendor.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-on-surface-variant" />
                          {vendor.email}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-on-surface" data-testid={`text-vendor-payment-terms-${vendor.id}`}>
                      {vendor.paymentTerms || <span className="text-on-surface-variant">-</span>}
                    </TableCell>
                    <TableCell className="py-3 px-6" data-testid={`badge-vendor-status-${vendor.id}`}>
                      <Badge className={vendor.isActive ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                        {vendor.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(vendor)}
                          data-testid={`button-edit-vendor-${vendor.id}`}
                          className="hover:bg-surface-container-high text-on-surface"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteClick(vendor)}
                          data-testid={`button-delete-vendor-${vendor.id}`}
                          className="hover:bg-red-50 text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yetkazuvchini tahrirlash</DialogTitle>
            <DialogDescription>
              Yetkazuvchi ma'lumotlarini o'zgartiring
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="vendorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor kodi *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="V001" data-testid="input-edit-vendor-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomi *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Yetkazuvchi nomi" data-testid="input-edit-vendor-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="nameRu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomi (Ruscha)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Название поставщика" data-testid="input-edit-vendor-name-ru" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manzil</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Manzil" data-testid="input-edit-vendor-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+998 90 123 45 67" data-testid="input-edit-vendor-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@example.com" data-testid="input-edit-vendor-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soliq ID (INN)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123456789" data-testid="input-edit-vendor-tax-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To'lov shartlari</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-payment-terms">
                            <SelectValue placeholder="Tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PREPAID">Oldindan to'lov</SelectItem>
                          <SelectItem value="NET15">NET15</SelectItem>
                          <SelectItem value="NET30">NET30</SelectItem>
                          <SelectItem value="NET60">NET60</SelectItem>
                          <SelectItem value="NET90">NET90</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valyuta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "UZS"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-currency">
                            <SelectValue placeholder="Valyuta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UZS">UZS</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="RUB">RUB</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Holat</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                  {updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yetkazuvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham "{selectedVendor?.name}" yetkazuvchisini o'chirmoqchimisiz? 
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "O'chirilmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
