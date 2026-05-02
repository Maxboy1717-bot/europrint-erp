import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Target, Edit, Trash2, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorState } from "@/components/ui/error-state";
import type { Skill, Employee, EmployeeSkillRecord, SkillFormValues, EmployeeSkillFormValues } from "./skills-matrix/types";
import { skillFormSchema, employeeSkillFormSchema, getLevelBadge } from "./skills-matrix/types";
import { SkillDialog } from "./skills-matrix/SkillDialog";
import { EmployeeSkillDialog } from "./skills-matrix/EmployeeSkillDialog";

export default function SkillsMatrix() {
  const { toast } = useToast();
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isEmployeeSkillDialogOpen, setIsEmployeeSkillDialogOpen] = useState(false);
  const [confirmDeleteSkillId, setConfirmDeleteSkillId] = useState<string | null>(null);
  const [confirmDeleteEmpSkillId, setConfirmDeleteEmpSkillId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const { data: skills, isLoading: loadingSkills, isError, refetch } = useQuery({ queryKey: ["/api/hr/skills"] });
  const { data: employees } = useQuery({ queryKey: ["/api/hr/employees"] });
  const { data: employeeSkills, isLoading: loadingEmployeeSkills } = useQuery({ queryKey: ["/api/hr/employee-skills"] });

  const skillForm = useForm<SkillFormValues>({ resolver: zodResolver(skillFormSchema), defaultValues: { code: "", name: "", nameRu: "", category: "", description: "", descriptionRu: "" } });
  const employeeSkillForm = useForm<EmployeeSkillFormValues>({ resolver: zodResolver(employeeSkillFormSchema), defaultValues: { userId: "", skillId: "", level: 3, notes: "" } });

  const createSkillMutation = useMutation({
    mutationFn: (data: SkillFormValues) => apiRequest("POST", "/api/hr/skills", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/skills"] }); setIsSkillDialogOpen(false); skillForm.reset(); toast({ title: "Ko'nikma muvaffaqiyatli yaratildi" }); },
    onError: () => { toast({ title: "Ko'nikma yaratishda xatolik", variant: "destructive" }); },
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SkillFormValues> }) => apiRequest("PATCH", `/api/hr/skills/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/skills"] }); setEditingSkill(null); setIsSkillDialogOpen(false); skillForm.reset(); toast({ title: "Ko'nikma muvaffaqiyatli yangilandi" }); },
    onError: () => { toast({ title: "Ko'nikma yangilashda xatolik", variant: "destructive" }); },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/hr/skills/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/skills"] }); toast({ title: "Ko'nikma muvaffaqiyatli o'chirildi" }); },
    onError: () => { toast({ title: "Ko'nikma o'chirishda xatolik", variant: "destructive" }); },
  });

  const createEmployeeSkillMutation = useMutation({
    mutationFn: (data: EmployeeSkillFormValues) => apiRequest("POST", "/api/hr/employee-skills", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/employee-skills"] }); setIsEmployeeSkillDialogOpen(false); employeeSkillForm.reset(); toast({ title: "Xodim ko'nikmasi muvaffaqiyatli qo'shildi" }); },
    onError: () => { toast({ title: "Xodim ko'nikmasi qo'shishda xatolik", variant: "destructive" }); },
  });

  const deleteEmployeeSkillMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/hr/employee-skills/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/employee-skills"] }); toast({ title: "Xodim ko'nikmasi muvaffaqiyatli o'chirildi" }); },
    onError: () => { toast({ title: "Xodim ko'nikmasi o'chirishda xatolik", variant: "destructive" }); },
  });

  const onSkillSubmit = (data: SkillFormValues) => { editingSkill ? updateSkillMutation.mutate({ id: editingSkill.id, data }) : createSkillMutation.mutate(data); };
  const onEmployeeSkillSubmit = (data: EmployeeSkillFormValues) => { createEmployeeSkillMutation.mutate(data); };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    skillForm.reset({ code: skill.code, name: skill.name, nameRu: skill.nameRu, category: skill.category, description: skill.description || "", descriptionRu: skill.descriptionRu || "" });
    setIsSkillDialogOpen(true);
  };

  const handleDeleteSkill = (id: string) => { setConfirmDeleteSkillId(id); };
  const handleDeleteEmployeeSkill = (id: string) => { setConfirmDeleteEmpSkillId(id); };

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ko'nikmalar Matritsasi</h1>
          <p className="text-muted-foreground">Ko'nikmalar va xodimlar kompetensiyalarini boshqarish</p>
        </div>
        <div className="flex gap-2">
          <EmployeeSkillDialog open={isEmployeeSkillDialogOpen} onOpenChange={setIsEmployeeSkillDialogOpen} form={employeeSkillForm} employees={employees as Employee[] | undefined} skills={skills as Skill[] | undefined} onSubmit={onEmployeeSkillSubmit} isPending={createEmployeeSkillMutation.isPending} onCancel={() => { setIsEmployeeSkillDialogOpen(false); employeeSkillForm.reset(); }} />
          <SkillDialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen} form={skillForm} editingSkill={editingSkill} onSubmit={onSkillSubmit} isPending={createSkillMutation.isPending || updateSkillMutation.isPending} onCancel={() => { setIsSkillDialogOpen(false); setEditingSkill(null); skillForm.reset(); }} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Jami ko'nikmalar</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{(skills as Skill[] | undefined)?.length || 0}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ko'nikmali xodimlar</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{new Set((employeeSkills as EmployeeSkillRecord[] | undefined)?.map((es: EmployeeSkillRecord) => es.userId)).size || 0}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Jami belgilangan</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{(employeeSkills as EmployeeSkillRecord[] | undefined)?.length || 0}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ko'nikmalar</CardTitle><CardDescription>Tizimda mavjud ko'nikmalar</CardDescription></CardHeader>
          <CardContent>
            {loadingSkills ? (
              <div className="space-y-4">{([1,2,3,4,5]).map(i => <div key={`k-${i}`} className="flex items-center gap-4 py-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-40" /><Skeleton className="h-6 w-24" /><Skeleton className="h-8 w-16 ml-auto" /></div>)}</div>
            ) : !(skills as Skill[] | undefined)?.length ? (
              <EmptyState icon={<Target className="h-8 w-8" />} title="Ko'nikmalar topilmadi" description="Hozircha hech qanday ko'nikma mavjud emas." actionLabel="Ko'nikma yaratish" onAction={() => setIsSkillDialogOpen(true)} />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Nom</TableHead><TableHead>Kategoriya</TableHead><TableHead className="text-right">Harakatlar</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(skills as Skill[]).map((skill: Skill) => (
                    <TableRow key={skill.id} data-testid={`row-skill-${skill.id}`}>
                      <TableCell className="font-mono text-sm" data-testid={`text-skill-code-${skill.id}`}>{skill.code}</TableCell>
                      <TableCell data-testid={`text-skill-name-${skill.id}`}>{skill.name}</TableCell>
                      <TableCell><Badge variant="outline" data-testid={`badge-skill-category-${skill.id}`}>{skill.category}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditSkill(skill)} data-testid={`button-edit-${skill.id}`}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSkill(skill.id)} data-testid={`button-delete-${skill.id}`}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Xodim ko'nikmalari</CardTitle><CardDescription>Belgilangan ko'nikmalar va darajalar</CardDescription></CardHeader>
          <CardContent>
            {loadingEmployeeSkills ? (
              <div className="space-y-4">{([1,2,3,4,5]).map(i => <div key={`k-${i}`} className="flex items-center gap-4 py-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-6 w-28" /><Skeleton className="h-6 w-20" /><Skeleton className="h-8 w-8 ml-auto" /></div>)}</div>
            ) : !(employeeSkills as EmployeeSkillRecord[] | undefined)?.length ? (
              <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="Xodim ko'nikmalari topilmadi" description="Hozircha hech qanday xodimga ko'nikma belgilanmagan." actionLabel="Ko'nikma belgilash" onAction={() => setIsEmployeeSkillDialogOpen(true)} />
            ) : (
              <div className="space-y-3">
                {(employeeSkills as EmployeeSkillRecord[]).slice(0, 10).map((es: EmployeeSkillRecord) => {
                  const employee = (employees as Employee[] | undefined)?.find((e: Employee) => e.id === es.userId);
                  const skill = (skills as Skill[] | undefined)?.find((s: Skill) => s.id === es.skillId);
                  const levelInfo = getLevelBadge(es.level);
                  return (
                    <div key={es.id} className="flex items-center justify-between py-2 border-b" data-testid={`row-employee-skill-${es.id}`}>
                      <div>
                        <p className="font-medium text-sm">{employee?.fullName || es.userId}</p>
                        <p className="text-xs text-muted-foreground">{skill?.name || es.skillId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={levelInfo.variant}>{levelInfo.label}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployeeSkill(es.id)} data-testid={`button-delete-es-${es.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        open={confirmDeleteSkillId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteSkillId(null); }}
        title="Ko'nikmani o'chirish"
        description="Ushbu ko'nikmani o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteSkillId !== null) deleteSkillMutation.mutate(confirmDeleteSkillId); }}
      />
      <ConfirmDialog
        open={confirmDeleteEmpSkillId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteEmpSkillId(null); }}
        title="Xodim ko'nikmasini o'chirish"
        description="Ushbu xodim ko'nikmasini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteEmpSkillId !== null) deleteEmployeeSkillMutation.mutate(confirmDeleteEmpSkillId); }}
      />
    </div>
  );
}
