/**
 * @module FeedbackTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface FeedbackResponse {
  id: string;
  newEmployeeId: string;
  feedbackType: string;
  scheduledDate: string;
  completedDate?: string | null;
  rating?: number | null;
  satisfactionLevel?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  suggestions?: string | null;
  employeeFeedback?: string | null;
  mentorFeedback?: string | null;
  status: string;
  actionItems?: unknown;
  conductedBy?: string | null;
  employeeName: string;
}

interface NewEmployeeResponse {
  id: string;
  employeeName: string;
}

interface UpdateMutationPayload {
  id: string;
  data: Record<string, unknown>;
}

interface FeedbackTabProps {
  feedbacks: FeedbackResponse[];
  employees: NewEmployeeResponse[];
}

const feedbackFormSchema = z.object({
  newEmployeeId: z.string().min(1, "Xodimni tanlang"),
  feedbackType: z.string().default("week1"),
  scheduledDate: z.string().min(1, "Sanani kiriting"),
  completedDate: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).nullable().optional(),
  satisfactionLevel: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  suggestions: z.string().optional(),
  employeeFeedback: z.string().optional(),
  mentorFeedback: z.string().optional(),
  status: z.string().default("scheduled"),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export function FeedbackTab({ feedbacks, employees }: FeedbackTabProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackResponse | null>(null);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      newEmployeeId: "", feedbackType: "week1", scheduledDate: "",
      completedDate: "", rating: null, satisfactionLevel: "none",
      strengths: "", weaknesses: "", suggestions: "",
      employeeFeedback: "", mentorFeedback: "", status: "scheduled",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FeedbackFormValues) => apiRequest("POST", "/api/adaptation/feedback", { ...data, actionItems: null, conductedBy: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/feedback"] });
      setIsDialogOpen(false);
      setEditingFeedback(null);
      form.reset();
      toast({ title: "Feedback qo'shildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Feedback qo'shishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FeedbackFormValues }) => apiRequest("PUT", `/api/adaptation/feedback/${id}`, { ...data, actionItems: null, conductedBy: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/feedback"] });
      setIsDialogOpen(false);
      setEditingFeedback(null);
      form.reset();
      toast({ title: "Feedback yangilandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Feedbackni yangilashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const onSubmit = (values: FeedbackFormValues) => {
    if (editingFeedback?.id) {
      updateMutation.mutate({ id: editingFeedback.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEditFeedback = (fb: FeedbackResponse) => {
    setEditingFeedback(fb);
    form.reset({
      newEmployeeId: fb.newEmployeeId,
      feedbackType: fb.feedbackType,
      scheduledDate: fb.scheduledDate,
      completedDate: fb.completedDate ?? "",
      rating: fb.rating ?? null,
      satisfactionLevel: fb.satisfactionLevel ?? "none",
      strengths: fb.strengths ?? "",
      weaknesses: fb.weaknesses ?? "",
      suggestions: fb.suggestions ?? "",
      employeeFeedback: fb.employeeFeedback ?? "",
      mentorFeedback: fb.mentorFeedback ?? "",
      status: fb.status,
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t("feedbacklar")}</CardTitle>
            <CardDescription>1 hafta, 1 oy, 3 oy suhbatlari</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingFeedback(null); form.reset(); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingFeedback(null); form.reset(); }} data-testid="button-add-feedback">
                <Plus className="w-4 h-4 mr-2" />
                {t("feedbackQoshish")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold"> {editingFeedback?.id ? "Feedbackni tahrirlash" : "Yangi feedback"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>{t("xodim1")}</Label>
                  <Controller control={form.control} name="newEmployeeId" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-employee" className="h-9"><SelectValue placeholder={t("xodimniTanlang")} /></SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(employees) ? employees : []).map((emp: NewEmployeeResponse) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.employeeName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  {form.formState.errors.newEmployeeId && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.newEmployeeId.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("type")}</Label>
                    <Controller control={form.control} name="feedbackType" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-feedback-type" className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week1">1 hafta</SelectItem>
                          <SelectItem value="month1">1 oy</SelectItem>
                          <SelectItem value="month3">3 oy</SelectItem>
                          <SelectItem value="final">{t("yakuniy")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div>
                    <Label>{t("status28")}</Label>
                    <Controller control={form.control} name="status" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-status" className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">{t("rejalashtirilgan")}</SelectItem>
                          <SelectItem value="completed">{t("yakunlangan")}</SelectItem>
                          <SelectItem value="cancelled">{t("cancelledDesc")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">{t("rejalashtirilganSana")}</Label>
                    <Input id="scheduledDate" type="date" {...form.register("scheduledDate")} data-testid="input-scheduled-date" />
                    {form.formState.errors.scheduledDate && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.scheduledDate.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="completedDate">{t("yakunlanganSana")}</Label>
                    <Input id="completedDate" type="date" {...form.register("completedDate")} data-testid="input-completed-date" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rating">Ball (1-5)</Label>
                    <Input id="rating" type="number" min="1" max="5" {...form.register("rating", { valueAsNumber: true })} data-testid="input-rating" />
                  </div>
                  <div>
                    <Label>{t("qoniqishDarajasi")}</Label>
                    <Controller control={form.control} name="satisfactionLevel" render={({ field }) => (
                      <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-satisfaction" className="h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-</SelectItem>
                          <SelectItem value="very_low">{t("judaPast")}</SelectItem>
                          <SelectItem value="low">{t("low")}</SelectItem>
                          <SelectItem value="medium">{t("medium")}</SelectItem>
                          <SelectItem value="high">{t("high")}</SelectItem>
                          <SelectItem value="very_high">{t("judaYuqori")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="strengths">{t("kuchliTomonlar1")}</Label>
                  <Textarea id="strengths" {...form.register("strengths")} rows={3} data-testid="input-strengths" />
                </div>
                <div>
                  <Label htmlFor="weaknesses">{t("zaifTomonlar")}</Label>
                  <Textarea id="weaknesses" {...form.register("weaknesses")} rows={3} data-testid="input-weaknesses" />
                </div>
                <div>
                  <Label htmlFor="suggestions">{t("takliflar")}</Label>
                  <Textarea id="suggestions" {...form.register("suggestions")} rows={3} data-testid="input-suggestions" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-feedback">
                    {editingFeedback?.id ? "Yangilash" : "Qo'shish"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>{t("xodim1")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("rejalashtirilgan")}</TableHead>
              <TableHead>{t("ball")}</TableHead>
              <TableHead>{t("status28")}</TableHead>
              <TableHead>{t("Amallar")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">{t("feedbacklarYoq")}</TableCell>
              </TableRow>
            )}
            {(Array.isArray(feedbacks) ? feedbacks : []).map((fb: FeedbackResponse) => (
              <TableRow key={fb.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{fb.employeeName}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {fb.feedbackType === "week1" ? "1 hafta" : fb.feedbackType === "month1" ? "1 oy" : fb.feedbackType === "month3" ? "3 oy" : "Yakuniy"}
                  </Badge>
                </TableCell>
                <TableCell>{fb.scheduledDate}</TableCell>
                <TableCell>{fb.rating ? `${fb.rating}/5` : "-"}</TableCell>
                <TableCell>
                  <Badge variant={fb.status === "completed" ? "default" : fb.status === "scheduled" ? "secondary" : "destructive"}>
                    {fb.status === "scheduled" ? "Rejalashtirilgan" : fb.status === "completed" ? "Yakunlangan" : "Bekor qilingan"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditFeedback(fb)}
                    data-testid={`button-edit-feedback-${fb.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}
