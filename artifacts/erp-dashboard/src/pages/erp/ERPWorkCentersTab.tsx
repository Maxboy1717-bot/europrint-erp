/**
 * @module ERPWorkCentersTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { WorkCenter, InsertWorkCenter } from "@shared/schema";
import { insertWorkCenterSchema } from "@shared/schema";

export function ERPWorkCentersTab() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [editingWorkCenter, setEditingWorkCenter] = useState<WorkCenter | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: workCenters = [], isLoading } = useQuery<WorkCenter[]>({
    queryKey: ["/api/erp/work-centers"],
  });

  const form = useForm<InsertWorkCenter>({
    resolver: zodResolver(insertWorkCenterSchema),
    defaultValues: { code: "", name: "", type: "machine", capacity: undefined, isActive: true },
  });

  const save = useMutation({
    mutationFn: async (data: InsertWorkCenter) => {
      if (editingWorkCenter) {
        await apiRequest("PUT", `/api/erp/work-centers/${editingWorkCenter.id}`, data);
      } else {
        await apiRequest("POST", "/api/erp/work-centers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/work-centers"] });
      toast({ description: editingWorkCenter ? t('workCenterUpdated') : t('workCenterAdded') });
      setOpenDialog(false);
      form.reset();
      setEditingWorkCenter(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/erp/work-centers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/work-centers"] });
      toast({ description: t('workCenterDeleted') });
    },
  });

  const handleEdit = (center: WorkCenter) => {
    setEditingWorkCenter(center);
    form.reset({
      code: center.code,
      name: center.name,
      type: center.type as "line" | "machine" | "workshop",
      capacity: center.capacity || undefined,
      isActive: center.isActive,
    });
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setEditingWorkCenter(null);
    form.reset();
    setOpenDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('workCenters')}</CardTitle>
              <CardDescription>{t('workCentersDesc')}</CardDescription>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} data-testid="button-add-work-center">
                  <Plus className="h-4 w-4 mr-2" />
                  {tCommon('add')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] p-6">
                <DialogHeader>
                  <DialogTitle className="text-[18px] font-semibold">{editingWorkCenter ? t('editWorkCenter') : t('newWorkCenter')}</DialogTitle>
                  <DialogDescription>{t('enterWorkCenterData')}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => save.mutate(data))} className="space-y-4">
                    <FormField control={form.control} name="code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('code')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} placeholder="WC001" data-testid="input-work-center-code" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('name')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} placeholder={t("asosiyLiniya")} data-testid="input-work-center-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('type')} <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-work-center-type" className="h-9">
                              <SelectValue placeholder={t('selectType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="line">{t('line')}</SelectItem>
                            <SelectItem value="machine">{t('machine')}</SelectItem>
                            <SelectItem value="workshop">{t('workshop')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="capacity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('capacityPerHour')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="1000"
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-work-center-capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit" disabled={save.isPending} data-testid="button-save-work-center">
                        {save.isPending ? t('saving') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('code')}</TableHead>
                  <TableHead>{tCommon('name')}</TableHead>
                  <TableHead>{tCommon('type')}</TableHead>
                  <TableHead>{t('capacity')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {([1, 2, 3, 4, 5]).map((i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell><Skeleton className="h-4 w-16 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          ) : workCenters.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">{t('noWorkCentersFound')}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('code')}</TableHead>
                  <TableHead>{tCommon('name')}</TableHead>
                  <TableHead>{tCommon('type')}</TableHead>
                  <TableHead>{t('capacity')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(workCenters) ? workCenters : []).map((center) => (
                  <TableRow key={center.id} data-testid={`row-work-center-${center.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{center.code}</TableCell>
                    <TableCell>{center.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {center.type === "line" ? t('line') : center.type === "machine" ? t('machine') : t('workshop')}
                      </Badge>
                    </TableCell>
                    <TableCell>{center.capacity || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={center.isActive ? "default" : "secondary"}>
                        {center.isActive ? tCommon('active') : tCommon('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(center)} data-testid={`button-edit-work-center-${center.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(center.id)} data-testid={`button-delete-work-center-${center.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteWorkCenter')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-work-center">{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) { remove.mutate(deleteId); setDeleteId(null); } }}
              data-testid="button-confirm-delete-work-center"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
