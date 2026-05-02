import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, UserCheck, BookOpen, Calendar, Percent } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n";
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
import { ErrorState } from "@/components/ui/error-state";

interface MentorshipRecord {
  id: string;
  mentorId: string;
  menteeId: string;
  courseId: string;
  deadline: string;
  bonusPercentage: number;
  status: string;
  notes?: string;
  mentorName?: string;
  mentorEmployeeId?: string;
  menteeName?: string;
  menteeEmployeeId?: string;
  courseTitle?: string;
}

interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
}

interface Course {
  id: string;
  title: string;
}

const mentorshipFormSchema = z.object({
  mentorId: z.string().min(1, "Mentor talab qilinadi"),
  menteeId: z.string().min(1, "Mentee talab qilinadi"),
  courseId: z.string().min(1, "Kurs talab qilinadi"),
  deadline: z.string().min(1, "Muddat talab qilinadi"),
  bonusPercentage: z.number().min(0).max(100, "Bonus 0-100% oralig'ida bo'lishi kerak"),
  status: z.string().default("active"),
  notes: z.string().optional(),
});

type MentorshipFormValues = z.infer<typeof mentorshipFormSchema>;

export default function Mentorship() {
  const { t } = useTranslation('lms');
  const { t: tCommon } = useTranslation('common');
  const { t: tHr } = useTranslation('hr');
  const { toast } = useToast();
  const [isMentorshipDialogOpen, setIsMentorshipDialogOpen] = useState(false);
  const [deleteMentorshipId, setDeleteMentorshipId] = useState<string | null>(null);

  const { data: mentorships, isLoading: loadingMentorships, isError, refetch} = useQuery<MentorshipRecord[]>({
    queryKey: ["/api/mentorships"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const mentorshipForm = useForm<MentorshipFormValues>({
    resolver: zodResolver(mentorshipFormSchema),
    defaultValues: {
      mentorId: "",
      menteeId: "",
      courseId: "",
      deadline: "",
      bonusPercentage: 5,
      status: "active",
      notes: "",
    },
  });

  const createMentorshipMutation = useMutation({
    mutationFn: (data: MentorshipFormValues) => apiRequest("POST", "/api/mentorships", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorships"] });
      setIsMentorshipDialogOpen(false);
      mentorshipForm.reset();
      toast({ title: tCommon('createdSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const updateMentorshipMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/mentorships/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorships"] });
      toast({ title: tCommon('updatedSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const deleteMentorshipMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mentorships/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorships"] });
      toast({ title: tCommon('deletedSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const onMentorshipSubmit = (data: MentorshipFormValues) => {
    createMentorshipMutation.mutate(data);
  };

  const handleDeleteMentorship = (id: string) => {
    setDeleteMentorshipId(id);
  };

  const confirmDeleteMentorship = () => {
    if (deleteMentorshipId) {
      deleteMentorshipMutation.mutate(deleteMentorshipId);
      setDeleteMentorshipId(null);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateMentorshipMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: tCommon('active'), variant: "default" },
      completed: { label: tCommon('completed'), variant: "secondary" },
      paused: { label: tCommon('pending'), variant: "outline" },
    };
    return statuses[status] || statuses.active;
  };

  const activeMentorships = mentorships?.filter((m) => m.status === "active") || [];
  const completedMentorships = mentorships?.filter((m) => m.status === "completed") || [];
  const uniqueMentors = new Set(mentorships?.map((m) => m.mentorId)).size || 0;
  const uniqueMentees = new Set(mentorships?.map((m) => m.menteeId)).size || 0;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            LMS <span className="font-bold text-primary">Mentorlik</span>
          </h1>
          <p className="text-on-surface-variant mt-2">{t('mentors')}</p>
        </div>
        <Dialog open={isMentorshipDialogOpen} onOpenChange={setIsMentorshipDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-create-mentorship"
              className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              {tCommon('create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-surface-container-lowest border-outline-variant" data-testid="dialog-create-mentorship">
            <DialogHeader>
              <DialogTitle className="text-on-surface">{tCommon('create')}</DialogTitle>
              <DialogDescription className="text-on-surface-variant">{t('mentors')}</DialogDescription>
            </DialogHeader>
            <Form {...mentorshipForm}>
              <form onSubmit={mentorshipForm.handleSubmit(onMentorshipSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={mentorshipForm.control}
                    name="mentorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface">{t('mentor')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-mentor" className="bg-surface-container-low border-outline-variant">
                              <SelectValue placeholder={t('mentor')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-container-lowest border-outline-variant">
                            {employees?.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.fullName} ({emp.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={mentorshipForm.control}
                    name="menteeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface">Mentee</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-mentee" className="bg-surface-container-low border-outline-variant">
                              <SelectValue placeholder="Mentee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-container-lowest border-outline-variant">
                            {employees?.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.fullName} ({emp.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={mentorshipForm.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface">{t('course')} ({t('mandatory')})</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-course" className="bg-surface-container-low border-outline-variant">
                            <SelectValue placeholder={t('course')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-container-lowest border-outline-variant">
                          {courses?.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={mentorshipForm.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface">{t('deadline')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            min={new Date().toISOString().split('T')[0]}
                            max="2099-12-31"
                            data-testid="input-deadline" 
                            className="bg-surface-container-low border-outline-variant"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={mentorshipForm.control}
                    name="bonusPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface">{tHr('bonus')} (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            placeholder="5"
                            data-testid="input-bonus"
                            className="bg-surface-container-low border-outline-variant"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={mentorshipForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface">{tCommon('status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status" className="bg-surface-container-low border-outline-variant">
                            <SelectValue placeholder={tCommon('status')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-container-lowest border-outline-variant">
                          <SelectItem value="active">{tCommon('active')}</SelectItem>
                          <SelectItem value="paused">{tCommon('pending')}</SelectItem>
                          <SelectItem value="completed">{tCommon('completed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mentorshipForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface">{tCommon('note')} ({tCommon('optional')})</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={tCommon('note')} data-testid="input-notes" className="bg-surface-container-low border-outline-variant" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsMentorshipDialogOpen(false);
                      mentorshipForm.reset();
                    }}
                    data-testid="button-cancel"
                    className="bg-surface-container text-on-surface hover:bg-surface-container-high border-none rounded-lg"
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMentorshipMutation.isPending} 
                    data-testid="button-submit"
                    className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
                  >
                    {tCommon('create')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-total-mentorships">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{tCommon('total')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{mentorships?.length || 0}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-active-mentorships">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{tCommon('active')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{activeMentorships.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-unique-mentors">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t('mentors')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{uniqueMentors}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-unique-mentees">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t('students')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{uniqueMentees}</p>
        </div>
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant shadow-none">
        <CardHeader>
          <CardTitle className="text-on-surface">{tCommon('all')}</CardTitle>
          <CardDescription className="text-on-surface-variant">{t('mentors')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMentorships ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
              </div>
              {([1, 2, 3, 4, 5]).map((i) => (
                <div key={`k-${i}`} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : !mentorships?.length ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title={tCommon('noData')}
              description={tCommon('noResults')}
              actionLabel={tCommon('create')}
              onAction={() => setIsMentorshipDialogOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">{t('mentor')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mentee</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('course')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('deadline')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tHr('bonus')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('status')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right rounded-r-lg">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mentorships?.map((mentorship) => {
                  return (
                    <TableRow key={mentorship.id} data-testid={`row-mentorship-${mentorship.id}`} className="border-none hover:bg-surface-container-low transition-colors">
                      <TableCell data-testid={`text-mentor-${mentorship.id}`} className="px-6">
                        <div>
                          <div className="font-medium text-on-surface">{mentorship.mentorName || tCommon('noData')}</div>
                          <div className="text-sm text-on-surface-variant">{mentorship.mentorEmployeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-mentee-${mentorship.id}`} className="px-6">
                        <div>
                          <div className="font-medium text-on-surface">{mentorship.menteeName || tCommon('noData')}</div>
                          <div className="text-sm text-on-surface-variant">{mentorship.menteeEmployeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-course-${mentorship.id}`} className="px-6 text-on-surface">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-on-surface-variant" />
                          <span className="text-sm">{mentorship.courseTitle || tCommon('noData')}</span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-deadline-${mentorship.id}`} className="px-6 text-on-surface">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-on-surface-variant" />
                          <span className="text-sm">
                            {mentorship.deadline ? format(new Date(mentorship.deadline), "dd.MM.yyyy") : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-bonus-${mentorship.id}`} className="px-6">
                        <Badge variant="outline" className="border-outline-variant text-on-surface">
                          <Percent className="h-3 w-3 mr-1" />
                          {mentorship.bonusPercentage || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6">
                        <Select
                          value={mentorship.status}
                          onValueChange={(value) => handleStatusChange(mentorship.id, value)}
                        >
                          <SelectTrigger className="w-36 bg-surface-container-low border-outline-variant" data-testid={`select-status-${mentorship.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-container-lowest border-outline-variant">
                            <SelectItem value="active">{tCommon('active')}</SelectItem>
                            <SelectItem value="paused">{tCommon('pending')}</SelectItem>
                            <SelectItem value="completed">{tCommon('completed')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMentorship(mentorship.id)}
                          data-testid={`button-delete-${mentorship.id}`}
                          className="hover:bg-surface-container-high text-on-surface"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteMentorshipId} onOpenChange={() => setDeleteMentorshipId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMentorship} data-testid="button-confirm-delete">
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
