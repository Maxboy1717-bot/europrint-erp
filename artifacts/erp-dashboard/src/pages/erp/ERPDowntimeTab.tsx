/**
 * @module ERPDowntimeTab
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DowntimeLog, InsertDowntimeLog, WorkCenter } from "@shared/schema";
import { insertDowntimeLogSchema } from "@shared/schema";

import { tLabel } from '@/lib/i18n/tLabel';
type DowntimeLogWithJoins = DowntimeLog & { workCenterName?: string };

export function ERPDowntimeTab() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [editingLog, setEditingLog] = useState<DowntimeLog | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: downtimeLogs = [], isLoading } = useQuery<DowntimeLogWithJoins[]>({
    queryKey: ["/api/erp/downtime-logs"],
  });

  const { data: workCenters = [] } = useQuery<WorkCenter[]>({
    queryKey: ["/api/pp/work-centers"],
  });

  const form = useForm<InsertDowntimeLog>({
    resolver: zodResolver(insertDowntimeLogSchema),
    defaultValues: {
      workCenterId: undefined,
      downtimeDate: new Date().toISOString().split('T')[0],
      shift: undefined, startTime: "", endTime: "",
      durationMinutes: undefined, reason: "",
      category: "breakdown", reportedBy: undefined, notes: "",
    },
  });

  const save = useMutation({
    mutationFn: async (data: InsertDowntimeLog) => {
      if (editingLog) {
        await apiRequest("PUT", `/api/erp/downtime-logs/${editingLog.id}`, data);
      } else {
        await apiRequest("POST", "/api/erp/downtime-logs", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/downtime-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/dashboard-stats"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "/api/erp/work-centers" &&
          query.queryKey[2] === "stats"
      });
      toast({ description: editingLog ? t('downtimeUpdated') : t('downtimeRecorded') });
      setOpenDialog(false);
      setEditingLog(null);
      form.reset();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/erp/downtime-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/downtime-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/dashboard-stats"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "/api/erp/work-centers" &&
          query.queryKey[2] === "stats"
      });
      toast({ description: t('downtimeDeleted') });
    },
  });

  const handleEdit = (log: DowntimeLog) => {
    setEditingLog(log);
    form.reset({
      workCenterId: log.workCenterId || undefined,
      downtimeDate: log.downtimeDate,
      shift: log.shift || undefined,
      startTime: log.startTime,
      endTime: log.endTime || "",
      durationMinutes: log.durationMinutes || undefined,
      reason: log.reason,
      category: log.category as "breakdown" | "maintenance" | "changeover" | "material_shortage" | "other",
      reportedBy: log.reportedBy || undefined,
      notes: log.notes || "",
    });
    setOpenDialog(true);
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-1">
        <div>
          <CardTitle>{t('downtimeLog')}</CardTitle>
          <CardDescription>{t('downtimeLogDesc')}</CardDescription>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLog(null); form.reset(); }} data-testid="button-add-downtime">
              <Plus className="h-4 w-4 mr-2" />
              {t('addDowntime')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{editingLog ? t('editDowntime') : t('newDowntime')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => save.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="workCenterId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('workCenter')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-downtime-work-center" className="h-9">
                            <SelectValue placeholder={tCommon('select')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                            <SelectItem key={wc.id} value={wc.id}>{wc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="downtimeDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('date')}</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-downtime-date" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="shift" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shift')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-downtime-shift" className="h-9">
                            <SelectValue placeholder={tCommon('select')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-smena">{tLabel('erp.ERPDowntimeTab.1Smena', "1-smena")}</SelectItem>
                          <SelectItem value="2-smena">{tLabel('erp.ERPDowntimeTab.2Smena', "2-smena")}</SelectItem>
                          <SelectItem value="3-smena">{tLabel('erp.ERPDowntimeTab.3Smena', "3-smena")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('startTime')}</FormLabel>
                      <FormControl><Input type="time" {...field} data-testid="input-downtime-start-time" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('endTime')}</FormLabel>
                      <FormControl><Input type="time" {...field} value={field.value ?? ""} data-testid="input-downtime-end-time" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('durationMinutes')}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} data-testid="input-downtime-duration" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('category')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-downtime-category" className="h-9">
                            <SelectValue placeholder={tCommon('select')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="breakdown">{t('breakdownCategory')}</SelectItem>
                          <SelectItem value="maintenance">{t('maintenanceCategory')}</SelectItem>
                          <SelectItem value="changeover">{t('changeoverCategory')}</SelectItem>
                          <SelectItem value="material_shortage">{t('materialShortageCategory')}</SelectItem>
                          <SelectItem value="other">{t('otherCategory')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="reason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reason')}</FormLabel>
                    <FormControl><Textarea {...field} placeholder={t('enterReason')} data-testid="input-downtime-reason" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field: { value, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>{tCommon('note')}</FormLabel>
                    <FormControl><Textarea {...fieldProps} value={value ?? ""} placeholder={t('additionalInfo')} data-testid="input-downtime-notes" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={save.isPending} data-testid="button-save-downtime">
                    {save.isPending ? t('saving') : tCommon('save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{tCommon('date')}</TableHead>
                <TableHead>{t('workCenter')}</TableHead>
                <TableHead>{t('shift')}</TableHead>
                <TableHead>{tCommon('time')}</TableHead>
                <TableHead>{t('duration')}</TableHead>
                <TableHead>{tCommon('category')}</TableHead>
                <TableHead>{t('reason')}</TableHead>
                <TableHead className="text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {([1, 2, 3, 4, 5]).map((i) => (
                <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell><Skeleton className="h-4 w-20 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 rounded-lg" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        ) : downtimeLogs.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{t('noDataYet')}</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{tCommon('date')}</TableHead>
                <TableHead>{t('workCenter')}</TableHead>
                <TableHead>{t('shift')}</TableHead>
                <TableHead>{tCommon('time')}</TableHead>
                <TableHead>{t('duration')}</TableHead>
                <TableHead>{tCommon('category')}</TableHead>
                <TableHead>{t('reason')}</TableHead>
                <TableHead className="text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(downtimeLogs) ? downtimeLogs : []).map((log) => (
                <TableRow key={log.id} data-testid={`row-downtime-${log.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{log.downtimeDate}</TableCell>
                  <TableCell>{log.workCenterName || "—"}</TableCell>
                  <TableCell>{log.shift || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {log.startTime && log.endTime ? `${log.startTime} - ${log.endTime}` : log.startTime || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {log.durationMinutes || 0} {t('min')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      log.category === "breakdown" ? "destructive" :
                      log.category === "maintenance" ? "default" : "secondary"
                    }>
                      {log.category === "breakdown" ? t('breakdown') :
                       log.category === "maintenance" ? t('maintenance') :
                       log.category === "changeover" ? t('changeover') :
                       log.category === "material_shortage" ? t('materialShortage') : t('other')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.reason}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(log)} data-testid={`button-edit-downtime-${log.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteId(log.id)} data-testid={`button-delete-downtime-${log.id}`}>
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

    <ConfirmDialog
      open={confirmDeleteId !== null}
      onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      title={t("nosozlikYozuviniOchirish")}
      description={t("ushbuNosozlikYozuviniOchirishniTasdiqlaysizmi")}
      confirmText="O'chirish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={() => { if (confirmDeleteId) remove.mutate(confirmDeleteId); }}
    />
    </>
  );
}
