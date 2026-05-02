import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, BookOpen, X, CheckSquare, Flag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdaptationProgram } from "@shared/schema";

interface TaskItem {
  title: string;
  description: string;
  day: number;
}

interface CheckpointItem {
  day: number;
  title: string;
  description: string;
}

interface ProgramFormState {
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  duration: number;
  durationType: string;
  departmentId: string;
  positionId: string;
  mentorRequired: boolean;
  status: string;
  tasks: TaskItem[];
  checkpoints: CheckpointItem[];
}

const DEFAULT_FORM: ProgramFormState = {
  title: "",
  titleRu: "",
  description: "",
  descriptionRu: "",
  duration: 1,
  durationType: "day",
  departmentId: "all",
  positionId: "all",
  mentorRequired: true,
  status: "active",
  tasks: [],
  checkpoints: [],
};

interface DepartmentItem {
  id: string;
  name: string;
}

interface PositionItem {
  id: string;
  name: string;
}

interface UpdateMutationPayload {
  id: string;
  data: Record<string, unknown>;
}

const PROGRAM_TEMPLATES = {
  "1-day": {
    title: "1 kunlik kirish dasturi",
    titleRu: "Программа введения на 1 день",
    duration: 1,
    durationType: "day" as const,
    description: "Birinchi ish kunidagi asosiy tanishtirish va yo'l-yo'riq",
    descriptionRu: "Основное знакомство и ориентация в первый рабочий день",
    tasks: [
      { title: "Kompaniya bilan tanishish", description: "Kompaniya tarixi, missiya, qadriyatlar", day: 1 },
      { title: "Ish joyi bilan tanishish", description: "Texnika, kirish kartalari, dasturlar", day: 1 },
      { title: "Jamoa bilan tanishish", description: "Bo'lim a'zolari bilan suhbat", day: 1 },
      { title: "Mentor bilan uchrashish", description: "Birinchi yo'l-yo'riqlar olish", day: 1 },
    ],
    checkpoints: [
      { day: 1, title: "Kirish kuni yakunlash", description: "Asosiy tushunchalar va resurslar olindi" },
    ],
  },
  "1-week": {
    title: "1 haftalik adaptatsiya dasturi",
    titleRu: "Программа адаптации на 1 неделю",
    duration: 1,
    durationType: "week" as const,
    description: "Asosiy jarayonlar va vazifalar bilan tanishish",
    descriptionRu: "Знакомство с основными процессами и задачами",
    tasks: [
      { title: "Kompaniya bilan tanishish", description: "Tarixi, missiya, qadriyatlar", day: 1 },
      { title: "Bo'lim bilan tanishish", description: "Jamoalar, jarayonlar, maqsadlar", day: 2 },
      { title: "Vazifalar bilan tanishish", description: "Asosiy mas'uliyatlar", day: 3 },
      { title: "Trening va o'quv materiallar", description: "Kerakli ko'nikmalar o'rganish", day: 4 },
      { title: "Birinchi vazifalarni bajarish", description: "Mentor nazorati ostida", day: 5 },
    ],
    checkpoints: [
      { day: 7, title: "1-hafta baholash", description: "Asosiy ko'nikmalar va umumiy tushunchalar" },
    ],
  },
  "1-month": {
    title: "1 oylik adaptatsiya dasturi",
    titleRu: "Программа адаптации на 1 месяц",
    duration: 1,
    durationType: "month" as const,
    description: "To'liq jarayonlarga kirishish va mustaqil ishlash",
    descriptionRu: "Полное погружение в процессы и самостоятельная работа",
    tasks: [
      { title: "1-hafta: Kirish va tanishish", description: "Kompaniya, jamoa, jarayonlar", day: 1 },
      { title: "2-hafta: O'quv va trening", description: "Kerakli ko'nikmalarni o'zlashtirish", day: 8 },
      { title: "3-hafta: Amaliy vazifalar", description: "Mentor yordami bilan", day: 15 },
      { title: "4-hafta: Mustaqil ishlash", description: "O'z mas'uliyatlari bo'yicha", day: 22 },
    ],
    checkpoints: [
      { day: 7, title: "1-hafta", description: "Asosiy tushunchalar" },
      { day: 14, title: "2-hafta", description: "O'quv natijalar" },
      { day: 21, title: "3-hafta", description: "Amaliy ko'nikmalar" },
      { day: 30, title: "1-oy", description: "To'liq baholash va feedback" },
    ],
  },
  "3-month": {
    title: "3 oylik to'liq adaptatsiya dasturi",
    titleRu: "Полная программа адаптации на 3 месяца",
    duration: 3,
    durationType: "month" as const,
    description: "Keng qamrovli adaptatsiya va professional rivojlanish",
    descriptionRu: "Комплексная адаптация и профессиональное развитие",
    tasks: [
      { title: "1-oy: Asosiy adaptatsiya", description: "Jarayonlar, ko'nikmalar, madaniyat", day: 1 },
      { title: "2-oy: Chuqur o'zlashtirish", description: "Murakkab vazifalar, loyihalar", day: 31 },
      { title: "3-oy: To'liq integratsiya", description: "Mustaqil ishlash, jamoa bilan hamkorlik", day: 61 },
    ],
    checkpoints: [
      { day: 7, title: "1-hafta", description: "Kirish" },
      { day: 30, title: "1-oy", description: "Asosiy adaptatsiya" },
      { day: 60, title: "2-oy", description: "Chuqur o'zlashtirish" },
      { day: 90, title: "3-oy", description: "Yakuniy baholash" },
    ],
  },
};

interface ProgramsTabProps {
  programs: AdaptationProgram[];
  departments: DepartmentItem[];
  positions: PositionItem[];
}

function TaskEditor({ tasks, onChange }: { tasks: TaskItem[]; onChange: (t: TaskItem[]) => void }) {
  const addTask = () => onChange([...tasks, { title: "", description: "", day: 1 }]);
  const removeTask = (i: number) => onChange((Array.isArray(tasks) ? tasks : []).filter((_, idx) => idx !== i));
  const updateTask = (i: number, field: keyof TaskItem, value: string | number) => {
    const copy = (Array.isArray(tasks) ? tasks : []).map((t, idx) => idx === i ? { ...t, [field]: value } : t);
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <CheckSquare className="w-4 h-4 text-primary" />
          Vazifalar ({tasks.length})
        </Label>
        <Button type="button" size="sm" variant="outline" onClick={addTask} data-testid="button-add-task">
          <Plus className="w-3.5 h-3.5 mr-1" /> Vazifa qo'shish
        </Button>
      </div>
      {tasks.length === 0 && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 text-center">
          Hali vazifalar yo'q. "Vazifa qo'shish" tugmasini bosing.
        </p>
      )}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {(Array.isArray(tasks) ? tasks : []).map((task, i) => (
          <div key={`k-${i}`} className="flex gap-2 items-start bg-muted/30 rounded-lg p-2.5 border border-border/50" data-testid={`task-row-${i}`}>
            <div className="flex-1 grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Input
                  placeholder="Vazifa nomi *"
                  value={task.title}
                  onChange={e => updateTask(i, "title", e.target.value)}
                  className="h-8 text-xs"
                  data-testid={`task-title-${i}`}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Tavsif"
                  value={task.description}
                  onChange={e => updateTask(i, "description", e.target.value)}
                  className="h-8 text-xs"
                  data-testid={`task-desc-${i}`}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Kun"
                  value={task.day}
                  min={1}
                  onChange={e => updateTask(i, "day", parseInt(e.target.value) || 1)}
                  className="h-8 text-xs"
                  data-testid={`task-day-${i}`}
                />
              </div>
            </div>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => removeTask(i)} data-testid={`task-remove-${i}`}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckpointEditor({ checkpoints, onChange }: { checkpoints: CheckpointItem[]; onChange: (c: CheckpointItem[]) => void }) {
  const addCheckpoint = () => onChange([...checkpoints, { day: 7, title: "", description: "" }]);
  const removeCheckpoint = (i: number) => onChange((Array.isArray(checkpoints) ? checkpoints : []).filter((_, idx) => idx !== i));
  const updateCheckpoint = (i: number, field: keyof CheckpointItem, value: string | number) => {
    const copy = (Array.isArray(checkpoints) ? checkpoints : []).map((c, idx) => idx === i ? { ...c, [field]: value } : c);
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Flag className="w-4 h-4 text-primary" />
          Tekshirish nuqtalari ({checkpoints.length})
        </Label>
        <Button type="button" size="sm" variant="outline" onClick={addCheckpoint} data-testid="button-add-checkpoint">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nuqta qo'shish
        </Button>
      </div>
      {checkpoints.length === 0 && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 text-center">
          Hali tekshirish nuqtalari yo'q.
        </p>
      )}
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {(Array.isArray(checkpoints) ? checkpoints : []).map((cp, i) => (
          <div key={`k-${i}`} className="flex gap-2 items-start bg-muted/30 rounded-lg p-2.5 border border-border/50" data-testid={`checkpoint-row-${i}`}>
            <div className="flex-1 grid grid-cols-5 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="Kun"
                  value={cp.day}
                  min={1}
                  onChange={e => updateCheckpoint(i, "day", parseInt(e.target.value) || 1)}
                  className="h-8 text-xs"
                  data-testid={`checkpoint-day-${i}`}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Nomi *"
                  value={cp.title}
                  onChange={e => updateCheckpoint(i, "title", e.target.value)}
                  className="h-8 text-xs"
                  data-testid={`checkpoint-title-${i}`}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Tavsif"
                  value={cp.description}
                  onChange={e => updateCheckpoint(i, "description", e.target.value)}
                  className="h-8 text-xs"
                  data-testid={`checkpoint-desc-${i}`}
                />
              </div>
            </div>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => removeCheckpoint(i)} data-testid={`checkpoint-remove-${i}`}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgramsTab({ programs, departments, positions }: ProgramsTabProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AdaptationProgram | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState<ProgramFormState>(DEFAULT_FORM);

  const setField = <K extends keyof ProgramFormState>(key: K, value: ProgramFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiRequest("POST", "/api/adaptation/programs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/programs"] });
      setIsDialogOpen(false);
      toast({ title: "Dastur muvaffaqiyatli yaratildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Dastur yaratishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: UpdateMutationPayload) => apiRequest("PATCH", `/api/adaptation/programs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/programs"] });
      setIsDialogOpen(false);
      toast({ title: "Dastur muvaffaqiyatli yangilandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Dasturni yangilashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/adaptation/programs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/programs"] });
      setDeleteId(null);
      toast({ title: "Dastur o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Dasturni o'chirishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const openProgramDialog = (program?: AdaptationProgram) => {
    if (program) {
      setForm({
        title: program.title || "",
        titleRu: program.titleRu || "",
        description: program.description || "",
        descriptionRu: program.descriptionRu || "",
        duration: program.duration || 1,
        durationType: program.durationType || "day",
        departmentId: program.departmentId || "all",
        positionId: program.positionId || "all",
        mentorRequired: program.mentorRequired ?? true,
        status: program.status || "active",
        tasks: (Array.isArray(program.tasks) ? program.tasks : []) as TaskItem[],
        checkpoints: (Array.isArray(program.checkpoints) ? program.checkpoints : []) as CheckpointItem[],
      });
      setEditingProgram(program);
    } else {
      setForm(DEFAULT_FORM);
      setEditingProgram(null);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.titleRu.trim()) {
      toast({ title: "Xatolik", description: "Nomi (UZ va RU) majburiy", variant: "destructive" });
      return;
    }
    const invalidTask = form.tasks?.find(t => !t.title.trim());
    if (invalidTask) {
      toast({ title: "Xatolik", description: "Barcha vazifalar nomini kiriting", variant: "destructive" });
      return;
    }
    const invalidCp = form.checkpoints?.find(c => !c.title.trim());
    if (invalidCp) {
      toast({ title: "Xatolik", description: "Barcha tekshirish nuqtalarini to'ldiring", variant: "destructive" });
      return;
    }

    const data = {
      title: form.title,
      titleRu: form.titleRu,
      description: form.description || null,
      descriptionRu: form.descriptionRu || null,
      positionId: form.positionId === "all" ? null : form.positionId,
      departmentId: form.departmentId === "all" ? null : form.departmentId,
      duration: form.duration,
      durationType: form.durationType,
      tasks: form.tasks,
      checkpoints: form.checkpoints,
      mentorRequired: form.mentorRequired,
      status: form.status,
    };

    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleUseTemplate = (templateKey: string) => {
    const template = PROGRAM_TEMPLATES[templateKey as keyof typeof PROGRAM_TEMPLATES];
    setForm({
      title: template.title,
      titleRu: template.titleRu,
      description: template.description,
      descriptionRu: template.descriptionRu,
      duration: template.duration,
      durationType: template.durationType,
      departmentId: "all",
      positionId: "all",
      mentorRequired: true,
      status: "active",
      tasks: template.tasks,
      checkpoints: template.checkpoints,
    });
    setEditingProgram(null);
    setShowTemplates(false);
    setIsDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Adaptatsiya dasturlari</CardTitle>
            <CardDescription>1 kun, 1 hafta, 1 oy, 3 oy rejalar</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-templates">
                  <Star className="w-4 h-4 mr-2" />
                  Shablonlar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tayyor shablonlarni tanlang</DialogTitle>
                  <DialogDescription>
                    Quyidagi shablonlardan birini tanlang va o'zingizga moslashtiring
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto flex-col items-start p-4" onClick={() => handleUseTemplate("1-day")} data-testid="template-1-day">
                    <div className="font-semibold">1 kunlik</div>
                    <div className="text-xs text-muted-foreground">Kirish va tanishish</div>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col items-start p-4" onClick={() => handleUseTemplate("1-week")} data-testid="template-1-week">
                    <div className="font-semibold">1 haftalik</div>
                    <div className="text-xs text-muted-foreground">Asosiy jarayonlar</div>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col items-start p-4" onClick={() => handleUseTemplate("1-month")} data-testid="template-1-month">
                    <div className="font-semibold">1 oylik</div>
                    <div className="text-xs text-muted-foreground">To'liq adaptatsiya</div>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col items-start p-4" onClick={() => handleUseTemplate("3-month")} data-testid="template-3-month">
                    <div className="font-semibold">3 oylik</div>
                    <div className="text-xs text-muted-foreground">Keng qamrovli dastur</div>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-program" onClick={() => openProgramDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yangi dastur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProgram?.id ? "Dasturni tahrirlash" : "Yangi dastur yaratish"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Nomi (UZ) <span className="text-destructive">*</span></Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={e => setField("title", e.target.value)}
                        data-testid="input-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="titleRu">Nomi (RU) <span className="text-destructive">*</span></Label>
                      <Input
                        id="titleRu"
                        value={form.titleRu}
                        onChange={e => setField("titleRu", e.target.value)}
                        data-testid="input-title-ru"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="description">Tavsif (UZ)</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={e => setField("description", e.target.value)}
                        data-testid="input-description"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="descriptionRu">Tavsif (RU)</Label>
                      <Textarea
                        id="descriptionRu"
                        value={form.descriptionRu}
                        onChange={e => setField("descriptionRu", e.target.value)}
                        data-testid="input-description-ru"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="duration">Davomiyligi <span className="text-destructive">*</span></Label>
                      <Input
                        id="duration"
                        type="number"
                        value={form.duration}
                        min={1}
                        onChange={e => setField("duration", parseInt(e.target.value) || 1)}
                        data-testid="input-duration"
                      />
                    </div>
                    <div>
                      <Label>Turi <span className="text-destructive">*</span></Label>
                      <Select value={form.durationType} onValueChange={v => setField("durationType", v)}>
                        <SelectTrigger data-testid="select-duration-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Kun</SelectItem>
                          <SelectItem value="week">Hafta</SelectItem>
                          <SelectItem value="month">Oy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Holat</Label>
                      <Select value={form.status} onValueChange={v => setField("status", v)}>
                        <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Faol</SelectItem>
                          <SelectItem value="archived">Arxivlangan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bo'lim (ixtiyoriy)</Label>
                      <Select value={form.departmentId} onValueChange={v => setField("departmentId", v)}>
                        <SelectTrigger data-testid="select-department"><SelectValue placeholder="Barcha bo'limlar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Barcha bo'limlar</SelectItem>
                          {(Array.isArray(departments) ? departments : []).map((dept: DepartmentItem) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Lavozim (ixtiyoriy)</Label>
                      <Select value={form.positionId} onValueChange={v => setField("positionId", v)}>
                        <SelectTrigger data-testid="select-position"><SelectValue placeholder="Barcha lavozimlar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Barcha lavozimlar</SelectItem>
                          {(Array.isArray(positions) ? positions : []).map((pos: PositionItem) => (
                            <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <TaskEditor tasks={form.tasks} onChange={t => setField("tasks", t)} />
                  </div>

                  <div className="border-t pt-3">
                    <CheckpointEditor checkpoints={form.checkpoints} onChange={c => setField("checkpoints", c)} />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="mentorRequired"
                      checked={form.mentorRequired}
                      onChange={e => setField("mentorRequired", e.target.checked)}
                      className="rounded"
                      data-testid="checkbox-mentor-required"
                    />
                    <Label htmlFor="mentorRequired">Mentor talab qilinadi</Label>
                  </div>
                  <DialogFooter>
                    <Button type="submit" data-testid="button-submit-program" disabled={isPending}>
                      {isPending ? "Saqlanmoqda..." : editingProgram?.id ? "Yangilash" : "Yaratish"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Davomiyligi</TableHead>
              <TableHead>Bo'lim</TableHead>
              <TableHead>Lavozim</TableHead>
              <TableHead>Vazifalar</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={BookOpen}
                    title="Dasturlar topilmadi"
                    description="Hozircha hech qanday adaptatsiya dasturi mavjud emas. Yangi dastur yaratish uchun yuqoridagi tugmani bosing."
                  />
                </TableCell>
              </TableRow>
            )}
            {(Array.isArray(programs) ? programs : []).map((program: AdaptationProgram) => {
              const dept = (Array.isArray(departments) ? departments : []).find((d: DepartmentItem) => d.id === program.departmentId);
              const pos = (Array.isArray(positions) ? positions : []).find((p: PositionItem) => p.id === program.positionId);
              const taskCount = Array.isArray(program.tasks) ? program.tasks.length : 0;
              const cpCount = Array.isArray(program.checkpoints) ? program.checkpoints.length : 0;
              return (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.title}</TableCell>
                  <TableCell>
                    {program.duration}{" "}
                    {program.durationType === "day" ? "kun" : program.durationType === "week" ? "hafta" : "oy"}
                  </TableCell>
                  <TableCell>
                    {dept ? <Badge variant="outline">{dept.name}</Badge> : <span className="text-muted-foreground">Hammasi</span>}
                  </TableCell>
                  <TableCell>
                    {pos ? <Badge variant="outline">{pos.name}</Badge> : <span className="text-muted-foreground">Hammasi</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{taskCount} vazifa</Badge>
                      <Badge variant="outline" className="text-xs">{cpCount} nuqta</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {program.mentorRequired ? <Badge>Kerak</Badge> : <Badge variant="secondary">Kerak emas</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={program.status === "active" ? "default" : "secondary"}>
                      {program.status === "active" ? "Faol" : "Arxivlangan"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openProgramDialog(program)}
                        data-testid={`button-edit-program-${program.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(program.id)}
                        data-testid={`button-delete-program-${program.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dasturni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu dasturni o'chirishni istaysizmi? Bu amal bekor qilinmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
