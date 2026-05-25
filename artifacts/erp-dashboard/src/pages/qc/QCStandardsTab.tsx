/**
 * @module QCStandardsTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUndoDelete } from "@/components/undo-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/lib/i18n";
import { EPStatusPill, EPLoader } from "@/components/ep";

interface QcStandard {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  type: string;
  category?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

const standardSchema = z.object({
  code: z.string().min(1, "Kod majburiy"),
  name: z.string().min(1, "Nom majburiy"),
  nameRu: z.string().optional(),
  type: z.string().min(1, "Turi majburiy"),
  category: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

const STANDARD_TYPES = [
  { value: "iso", label: "ISO" },
  { value: "gost", label: "GOST" },
  { value: "uzst", label: "O'zDSt" },
  { value: "internal", label: "Ichki standart" }
];

const CATEGORY_OPTIONS = [
  { value: "physical", label: "Fizik xususiyatlar" },
  { value: "mechanical", label: "Mexanik mustahkamlik" },
  { value: "printability", label: "Chop etish sifati" },
  { value: "chemical", label: "Kimyoviy ko'rsatkichlar" },
  { value: "environmental", label: "Muhit chidamliligi" },
  { value: "logistics", label: "Logistika testlari" },
  { value: "visual", label: "Vizual sifat" },
];

export function QCStandardsTab() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { showUndoToast } = useUndoDelete();
  const { t: tCommon } = useTranslation('common');
  const [filterType, setFilterType] = useState<string>("");
  const [standardDialogOpen, setStandardDialogOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<QcStandard | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: standardsData, isLoading: standardsLoading } = useQuery<QcStandard[]>({
    queryKey: ["/api/qc/standards", filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      const url = `/api/qc/standards${params.toString() ? `?${params.toString()}` : ""}`;
      return await apiRequest<QcStandard[]>('GET', url);
    }
  });

  const standardForm = useForm<z.infer<typeof standardSchema>>({
    resolver: zodResolver(standardSchema),
    defaultValues: { code: "", name: "", nameRu: "", type: "iso", category: "", description: "", isActive: true }
  });

  const createStandardMutation = useMutation({
    mutationFn: async (data: z.infer<typeof standardSchema>) =>
      apiRequest<QcStandard>("POST", "/api/qc/standards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/standards"] });
      setStandardDialogOpen(false);
      standardForm.reset();
      toast({ title: tCommon('success'), description: tCommon('createdSuccessfully') });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const updateStandardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof standardSchema> }) =>
      apiRequest<QcStandard>("PATCH", `/api/qc/standards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/standards"] });
      setStandardDialogOpen(false);
      setEditingStandard(null);
      standardForm.reset();
      toast({ title: tCommon('success'), description: tCommon('updatedSuccessfully') });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const deleteStandardMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/qc/standards/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/standards"] });
      showUndoToast("qc_standards", id, id, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/qc/standards"] });
      });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const handleEditStandard = (standard: QcStandard) => {
    setEditingStandard(standard);
    standardForm.reset({
      code: standard.code, name: standard.name, nameRu: standard.nameRu || "",
      type: standard.type, category: standard.category || "",
      description: standard.description || "", isActive: standard.isActive
    });
    setStandardDialogOpen(true);
  };

  const handleStandardSubmit = (data: z.infer<typeof standardSchema>) => {
    if (editingStandard) {
      updateStandardMutation.mutate({ id: editingStandard.id, data });
    } else {
      createStandardMutation.mutate(data);
    }
  };

  const standards = standardsData || [];

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {t("sifatNormalari")}
            </CardTitle>
            <CardDescription>{t("isoGostVaIchkiStandartlar")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-9" data-testid="filter-type">
                <SelectValue placeholder={tCommon('type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                {(Array.isArray(STANDARD_TYPES) ? STANDARD_TYPES : []).map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={standardDialogOpen} onOpenChange={(open) => {
              setStandardDialogOpen(open);
              if (!open) { setEditingStandard(null); standardForm.reset(); }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-standard">
                  <Plus className="w-4 h-4 mr-2" />
                  {tCommon('add')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-[18px] font-semibold">{editingStandard ? tCommon('edit') : tCommon('create')}</DialogTitle>
                </DialogHeader>
                <Form {...standardForm}>
                  <form onSubmit={standardForm.handleSubmit(handleStandardSubmit)} className="space-y-4">
                    <FormField control={standardForm.control} name="code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('code')}</FormLabel>
                        <FormControl><Input {...field} placeholder="ISO-9001" data-testid="input-standard-code" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={standardForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('name')} (UZ)</FormLabel>
                        <FormControl><Input {...field} placeholder={tCommon('name')} data-testid="input-standard-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={standardForm.control} name="nameRu" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('name')} (RU)</FormLabel>
                        <FormControl><Input {...field} placeholder={t("untitled")} data-testid="input-standard-name-ru" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={standardForm.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('type')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-standard-type" className="h-9"><SelectValue placeholder={tCommon('select')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(STANDARD_TYPES) ? STANDARD_TYPES : []).map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={standardForm.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('category')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-standard-category" className="h-9"><SelectValue placeholder={tCommon('select')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(CATEGORY_OPTIONS) ? CATEGORY_OPTIONS : []).map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={standardForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('description')}</FormLabel>
                        <FormControl><Input {...field} placeholder={tCommon('description')} data-testid="input-standard-description" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={standardForm.control} name="isActive" render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-standard-active" />
                        </FormControl>
                        <FormLabel className="!mt-0">{tCommon('active')}</FormLabel>
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createStandardMutation.isPending || updateStandardMutation.isPending}
                        data-testid="button-save-standard"
                      >
                        {(createStandardMutation.isPending || updateStandardMutation.isPending) && (
                          <EPLoader className="w-4 h-4 mr-2" />
                        )}
                        {tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {standardsLoading ? (
          <div className="flex items-center justify-center py-8">
            <EPLoader className="w-6 h-6" />
          </div>
        ) : standards.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon('noData')}</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('code')}</TableHead>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead>{tCommon('type')}</TableHead>
                <TableHead>{tCommon('category')}</TableHead>
                <TableHead>{tCommon('active')}</TableHead>
                <TableHead className="text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(standards) ? standards : []).map(standard => (
                <TableRow key={standard.id} data-testid={`row-standard-${standard.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono">{standard.code}</TableCell>
                  <TableCell>
                    <div>{standard.name}</div>
                    {standard.nameRu && <div className="text-xs text-muted-foreground">{standard.nameRu}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{standard.type.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>{standard.category || "-"}</TableCell>
                  <TableCell>
                    {standard.isActive ? (
                      <Badge variant="success">{tCommon('active')}</Badge>
                    ) : (
                      <EPStatusPill tone="neutral">{tCommon('inactive')}</EPStatusPill>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={tCommon('edit')}
                          onClick={() => handleEditStandard(standard)}
                          data-testid={`button-edit-standard-${standard.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tCommon('edit')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={tCommon('delete')}
                          onClick={() => setConfirmDeleteId(standard.id)}
                          data-testid={`button-delete-standard-${standard.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tCommon('delete')}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>

    <ConfirmDialog
      open={confirmDeleteId !== null}
      onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      title={t("standartniOchirish")}
      description={t("ushbuSifatStandartiniOchirishniTasdiqlaysizmi")}
      confirmText="O'chirish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={() => { if (confirmDeleteId !== null) deleteStandardMutation.mutate(confirmDeleteId); }}
    />
    </>
  );
}
