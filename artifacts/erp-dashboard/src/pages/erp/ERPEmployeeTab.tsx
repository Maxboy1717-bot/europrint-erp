import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EmployeeWorkCenter, InsertEmployeeWorkCenter, WorkCenter } from "@shared/schema";
import { insertEmployeeWorkCenterSchema } from "@shared/schema";

type EmployeeWorkCenterWithJoins = EmployeeWorkCenter & {
  employeeId?: string;
  employeeName?: string;
  workCenterName?: string;
  workCenterCode?: string;
};

type Employee = { id: string; fullName: string; position?: string; username?: string; telegramUsername?: string };

export function ERPEmployeeTab() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [editingAssignment, setEditingAssignment] = useState<EmployeeWorkCenter | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: assignments = [], isLoading } = useQuery<EmployeeWorkCenterWithJoins[]>({
    queryKey: ["/api/erp/employee-work-centers"],
  });

  const { data: workCenters = [] } = useQuery<WorkCenter[]>({
    queryKey: ["/api/erp/work-centers"],
  });

  const { data: employeesResponse } = useQuery<{ data: Employee[] }>({
    queryKey: ["/api/employees"],
  });
  const employees = employeesResponse?.data || [];

  const form = useForm<InsertEmployeeWorkCenter>({
    resolver: zodResolver(insertEmployeeWorkCenterSchema),
    defaultValues: { userId: undefined, workCenterId: undefined, isPrimary: false },
  });

  const save = useMutation({
    mutationFn: async ({ data, id }: { data: InsertEmployeeWorkCenter; id?: string }) => {
      if (id) {
        await apiRequest("PATCH", `/api/erp/employee-work-centers/${id}`, data);
      } else {
        await apiRequest("POST", "/api/erp/employee-work-centers", data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/employee-work-centers"] });
      toast({ description: variables.id ? t('assignmentUpdated') : t('assignmentAdded') });
      setOpenDialog(false);
      setEditingAssignment(null);
      form.reset();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/erp/employee-work-centers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/employee-work-centers"] });
      toast({ description: t('assignmentDeleted') });
    },
  });

  const handleEdit = (assignment: EmployeeWorkCenter) => {
    setEditingAssignment(assignment);
    form.reset({
      userId: assignment.userId,
      workCenterId: assignment.workCenterId,
      isPrimary: assignment.isPrimary,
    });
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setEditingAssignment(null);
    setOpenDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('employeeAssignments')}</CardTitle>
              <CardDescription>{t('assignEmployees')}</CardDescription>
            </div>
            <Button onClick={handleAdd} data-testid="button-add-assignment">
              <Plus className="h-4 w-4 mr-2" />
              {t('newAssignment')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employeeId')}</TableHead>
                  <TableHead>{t('employee')}</TableHead>
                  <TableHead>{t('workCenter')}</TableHead>
                  <TableHead>{t('primary')}</TableHead>
                  <TableHead>{tCommon('date')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {([1, 2, 3, 4, 5]).map((i) => (
                  <TableRow key={`k-${i}`}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employeeId')}</TableHead>
                  <TableHead>{t('employee')}</TableHead>
                  <TableHead>{t('workCenter')}</TableHead>
                  <TableHead>{t('primary')}</TableHead>
                  <TableHead>{tCommon('date')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(assignments) ? assignments : []).map((assignment) => (
                  <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                    <TableCell className="font-medium">{assignment.employeeId || "—"}</TableCell>
                    <TableCell>{assignment.employeeName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{assignment.workCenterName}</span>
                        <span className="text-xs text-muted-foreground">{assignment.workCenterCode}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.isPrimary ? (
                        <Badge variant="default">{t('primary')}</Badge>
                      ) : (
                        <Badge variant="outline">{t('additional')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString('uz-UZ') : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(assignment)} data-testid={`button-edit-assignment-${assignment.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteId(assignment.id)} data-testid={`button-delete-assignment-${assignment.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? t('editAssignment') : t('newAssignment')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => save.mutate({ data, id: editingAssignment?.id }))} className="space-y-4">
              <FormField control={form.control} name="userId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('employee')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-assignment-employee">
                        <SelectValue placeholder={t('selectEmployee')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(employees) ? employees : []).map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName || emp.username} ({emp.telegramUsername || emp.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="workCenterId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workCenter')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-assignment-work-center">
                        <SelectValue placeholder={t('selectWorkCenter')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                        <SelectItem key={wc.id} value={wc.id}>{wc.name} ({wc.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isPrimary" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('primaryWorkCenter')}</FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">{t('isPrimaryQuestion')}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-assignment-primary" />
                  </FormControl>
                </FormItem>
              )} />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => { setOpenDialog(false); form.reset(); }} data-testid="button-cancel-assignment">
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={save.isPending} data-testid="button-save-assignment">
                  {save.isPending ? t('saving') : tCommon('save')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Tayinlashni o'chirish"
        description="Ushbu xodim tayinlashini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId) remove.mutate(confirmDeleteId); }}
      />
    </>
  );
}
