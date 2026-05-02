import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";
import type { AdaptationProgram } from "@shared/schema";

interface NewEmployeeResponse {
  id: string;
  userId: string;
  programId?: string | null;
  mentorId?: string | null;
  startDate: string;
  endDate?: string | null;
  status: string;
  progress: number;
  currentPhase?: string | null;
  notes?: string | null;
  tasksCompleted?: unknown;
  employeeName: string;
  employeeDepartment?: string;
  employeePosition?: string;
  programTitle?: string;
  mentorName?: string;
}

interface UserItem {
  id: string;
  fullName: string;
  phone?: string;
}

interface NewEmployeesTabProps {
  employees: NewEmployeeResponse[];
  programs: AdaptationProgram[];
  users: UserItem[];
}

const newEmployeeFormSchema = z.object({
  userId: z.string().min(1, "Xodimni tanlang"),
  programId: z.string().optional(),
  mentorId: z.string().optional(),
  startDate: z.string().min(1, "Boshlanish sanasini kiriting"),
  endDate: z.string().optional(),
  status: z.enum(["in_progress", "completed", "extended", "failed"]).default("in_progress"),
  progress: z.coerce.number().min(0).max(100).default(0),
  currentPhase: z.string().optional(),
  notes: z.string().optional(),
});

type NewEmployeeFormValues = z.infer<typeof newEmployeeFormSchema>;

export function NewEmployeesTab({ employees, programs, users }: NewEmployeesTabProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<NewEmployeeResponse | null>(null);

  const form = useForm<NewEmployeeFormValues>({
    resolver: zodResolver(newEmployeeFormSchema),
    defaultValues: {
      userId: "", programId: "", mentorId: "", startDate: "",
      endDate: "", status: "in_progress", progress: 0, currentPhase: "", notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewEmployeeFormValues) => apiRequest("POST", "/api/adaptation/new-employees", { ...data, tasksCompleted: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/new-employees"] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      form.reset();
      toast({ title: "Yangi xodim qo'shildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Xodim qo'shishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NewEmployeeFormValues }) => apiRequest("PATCH", `/api/adaptation/new-employees/${id}`, { ...data, tasksCompleted: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/new-employees"] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      form.reset();
      toast({ title: "Ma'lumot yangilandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Ma'lumotni yangilashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const onSubmit = (values: NewEmployeeFormValues) => {
    if (editingEmployee?.id) {
      updateMutation.mutate({ id: editingEmployee.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEditEmployee = (emp: NewEmployeeResponse) => {
    setEditingEmployee(emp);
    form.reset({
      userId: emp.userId,
      programId: emp.programId ?? "",
      mentorId: emp.mentorId ?? "",
      startDate: emp.startDate,
      endDate: emp.endDate ?? "",
      status: emp.status,
      progress: emp.progress,
      currentPhase: emp.currentPhase ?? "",
      notes: emp.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Yangi xodimlar</CardTitle>
            <CardDescription>Adaptatsiya jarayonidagi xodimlar</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingEmployee(null); form.reset(); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingEmployee(null); form.reset(); }} data-testid="button-add-employee">
                <Plus className="w-4 h-4 mr-2" />
                Xodim qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee?.id ? "Ma'lumotni tahrirlash" : "Yangi xodim qo'shish"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Xodim</Label>
                  <Controller control={form.control} name="userId" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-user"><SelectValue placeholder="Xodimni tanlang" /></SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(users) ? users : []).map((user: UserItem) => (
                          <SelectItem key={user.id} value={user.id}>{user.fullName} - {user.phone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  {form.formState.errors.userId && <p className="text-sm text-destructive mt-1">{form.formState.errors.userId.message}</p>}
                </div>
                <div>
                  <Label>Dastur (ixtiyoriy)</Label>
                  <Controller control={form.control} name="programId" render={({ field }) => (
                    <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-program"><SelectValue placeholder="Dasturni tanlang" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Dastur tanlanmagan</SelectItem>
                        {(Array.isArray(programs) ? programs : []).map((prog: AdaptationProgram) => (
                          <SelectItem key={prog.id} value={prog.id}>{prog.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label>Mentor (ixtiyoriy)</Label>
                  <Controller control={form.control} name="mentorId" render={({ field }) => (
                    <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-mentor"><SelectValue placeholder="Mentorni tanlang" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Mentor tanlanmagan</SelectItem>
                        {(Array.isArray(users) ? users : []).map((user: UserItem) => (
                          <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Boshlanish sanasi</Label>
                    <Input id="startDate" type="date" {...form.register("startDate")} data-testid="input-start-date" />
                    {form.formState.errors.startDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.startDate.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="endDate">Tugash sanasi (ixtiyoriy)</Label>
                    <Input id="endDate" type="date" {...form.register("endDate")} data-testid="input-end-date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Holat</Label>
                    <Controller control={form.control} name="status" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">Jarayonda</SelectItem>
                          <SelectItem value="completed">Yakunlangan</SelectItem>
                          <SelectItem value="extended">Uzaytirilgan</SelectItem>
                          <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="progress">Jarayon (%)</Label>
                    <Input id="progress" type="number" min="0" max="100" {...form.register("progress", { valueAsNumber: true })} data-testid="input-progress" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-employee">
                    {editingEmployee?.id ? "Yangilash" : "Qo'shish"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Xodim</TableHead>
              <TableHead>Bo'lim / Lavozim</TableHead>
              <TableHead>Dastur</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Boshlanish</TableHead>
              <TableHead>Jarayon</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Yangi xodimlar yo'q
                </TableCell>
              </TableRow>
            )}
            {(Array.isArray(employees) ? employees : []).map((emp: NewEmployeeResponse) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.employeeName}</TableCell>
                <TableCell>
                  {emp.employeeDepartment && <div className="text-sm">{emp.employeeDepartment}</div>}
                  {emp.employeePosition && <div className="text-xs text-muted-foreground">{emp.employeePosition}</div>}
                </TableCell>
                <TableCell>
                  {emp.programTitle ? <Badge variant="outline">{emp.programTitle}</Badge> : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>{emp.mentorName || "-"}</TableCell>
                <TableCell>{emp.startDate}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${emp.progress}%` }} />
                    </div>
                    <span className="text-xs">{emp.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={emp.status === "completed" ? "default" : emp.status === "in_progress" ? "secondary" : "destructive"}>
                    {emp.status === "in_progress" ? "Jarayonda" : emp.status === "completed" ? "Yakunlangan" : emp.status === "extended" ? "Uzaytirilgan" : "Muvaffaqiyatsiz"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditEmployee(emp)}
                    data-testid={`button-edit-employee-${emp.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
