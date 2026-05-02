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
import { Calendar, Plus, Edit, Trash2, MapPin, Clock, Building2, Briefcase } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/error-state";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface CalendarEvent {
  id: string;
  title: string;
  titleRu: string;
  description?: string;
  descriptionRu?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  eventType: string;
  maxParticipants?: number;
  targetDepartments?: string[];
  targetPositions?: string[];
}

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

const eventFormSchema = z.object({
  title: z.string().min(1, "Sarlavha talab qilinadi"),
  titleRu: z.string().min(1, "Sarlavha (RU) talab qilinadi"),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
  startDate: z.string().min(1, "Boshlanish sanasi talab qilinadi"),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  eventType: z.string().min(1, "Tadbir turi talab qilinadi"),
  maxParticipants: z.number().optional(),
  targetDepartments: z.array(z.string()).optional(),
  targetPositions: z.array(z.string()).optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function EventsCalendar() {
  const { toast } = useToast();
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  const { data: events, isLoading: loadingEvents, isError, refetch} = useQuery({
    queryKey: ["/api/calendar-events"],
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["/api/calendar-events/upcoming"],
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: positions } = useQuery({
    queryKey: ["/api/positions"],
  });

  const eventForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      titleRu: "",
      description: "",
      descriptionRu: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      location: "",
      eventType: "training",
      maxParticipants: undefined,
      targetDepartments: [],
      targetPositions: [],
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data: EventFormValues) => apiRequest("POST", "/api/calendar-events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events/upcoming"] });
      setIsEventDialogOpen(false);
      setSelectedDepartments([]);
      setSelectedPositions([]);
      eventForm.reset();
      toast({ title: "Tadbir muvaffaqiyatli yaratildi va xodimlar xabardor qilindi" });
    },
    onError: () => {
      toast({ title: "Tadbir yaratishda xatolik", variant: "destructive" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventFormValues> }) =>
      apiRequest("PATCH", `/api/calendar-events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events/upcoming"] });
      setEditingEvent(null);
      setIsEventDialogOpen(false);
      setSelectedDepartments([]);
      setSelectedPositions([]);
      eventForm.reset();
      toast({ title: "Tadbir muvaffaqiyatli yangilandi" });
    },
    onError: () => {
      toast({ title: "Tadbir yangilashda xatolik", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/calendar-events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events/upcoming"] });
      toast({ title: "Tadbir muvaffaqiyatli o'chirildi" });
    },
    onError: () => {
      toast({ title: "Tadbir o'chirishda xatolik", variant: "destructive" });
    },
  });

  const onEventSubmit = (data: EventFormValues) => {
    const formData: EventFormValues = {
      ...data,
      targetDepartments: selectedDepartments,
      targetPositions: selectedPositions,
    };
    
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDepartments(event.targetDepartments || []);
    setSelectedPositions(event.targetPositions || []);
    eventForm.reset({
      title: event.title,
      titleRu: event.titleRu,
      description: event.description || "",
      descriptionRu: event.descriptionRu || "",
      startDate: event.startDate ? new Date(event.startDate).toISOString().split("T")[0] : "",
      startTime: event.startTime || "",
      endDate: event.endDate ? new Date(event.endDate).toISOString().split("T")[0] : "",
      endTime: event.endTime || "",
      location: event.location || "",
      eventType: event.eventType,
      maxParticipants: event.maxParticipants || undefined,
    });
    setIsEventDialogOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    deleteEventMutation.mutate(id);
  };

  const getEventTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: BadgeVariant }> = {
      training: { label: "Trening", variant: "default" },
      meeting: { label: "Yig'ilish", variant: "secondary" },
      webinar: { label: "Vebinar", variant: "outline" },
      conference: { label: "Konferensiya", variant: "default" },
      other: { label: "Boshqa", variant: "secondary" },
    };
    return types[type] || types.other;
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tadbirlar Kalendari</h1>
          <p className="text-muted-foreground">O'quv tadbirlari va yig'ilishlarni boshqarish</p>
        </div>
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event">
              <Plus className="mr-2 h-4 w-4" />
              Tadbir yaratish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Tadbirni tahrirlash" : "Tadbir yaratish"}</DialogTitle>
              <DialogDescription>
                {editingEvent ? "Tadbir ma'lumotlarini yangilang" : "Yangi kalendar tadbiri yarating"}
              </DialogDescription>
            </DialogHeader>
            <Form {...eventForm}>
              <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={eventForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha (O'zbekcha)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="O'quv mashg'uloti" data-testid="input-event-title-uz" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="titleRu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha (Русский)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Учебное занятие" data-testid="input-event-title-ru" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={eventForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tavsif (O'zbekcha)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Tadbir tavsifi..." data-testid="input-event-desc-uz" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="descriptionRu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tavsif (Русский)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Описание мероприятия..." data-testid="input-event-desc-ru" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={eventForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boshlanish sanasi</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            min={new Date().toISOString().split('T')[0]}
                            max="2099-12-31"
                            data-testid="input-start-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boshlanish vaqti (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-start-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={eventForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tugash sanasi (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            min={eventForm.watch('startDate') || new Date().toISOString().split('T')[0]}
                            max="2099-12-31"
                            data-testid="input-end-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tugash vaqti (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={eventForm.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turi</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="training" data-testid="input-event-type" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={eventForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manzil (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="A xona" data-testid="input-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maksimal ishtirokchilar (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                            data-testid="input-max-participants"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4" />
                      Maqsadli bo'limlar (ixtiyoriy)
                    </label>
                    <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                      {(departments as Department[] | undefined)?.map((dept: Department) => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={selectedDepartments.includes(dept.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDepartments([...selectedDepartments, dept.id]);
                              } else {
                                setSelectedDepartments((Array.isArray(selectedDepartments) ? selectedDepartments : []).filter(id => id !== dept.id));
                              }
                            }}
                          />
                          <label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer">
                            {dept.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4" />
                      Maqsadli lavozimlar (ixtiyoriy)
                    </label>
                    <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                      {(positions as Position[] | undefined)?.map((pos: Position) => (
                        <div key={pos.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`pos-${pos.id}`}
                            checked={selectedPositions.includes(pos.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPositions([...selectedPositions, pos.id]);
                              } else {
                                setSelectedPositions((Array.isArray(selectedPositions) ? selectedPositions : []).filter(id => id !== pos.id));
                              }
                            }}
                          />
                          <label htmlFor={`pos-${pos.id}`} className="text-sm cursor-pointer">
                            {pos.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEventDialogOpen(false);
                      setEditingEvent(null);
                      setSelectedDepartments([]);
                      setSelectedPositions([]);
                      eventForm.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={createEventMutation.isPending || updateEventMutation.isPending} data-testid="button-submit">
                    {editingEvent ? "Yangilash" : "Yaratish va xabarnoma yuborish"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami tadbirlar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(events as CalendarEvent[] | undefined)?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelgusi tadbirlar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(upcomingEvents as CalendarEvent[] | undefined)?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treninglar</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(events as CalendarEvent[] | undefined)?.filter((e: CalendarEvent) => e.eventType === "training").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yig'ilishlar</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(events as CalendarEvent[] | undefined)?.filter((e: CalendarEvent) => e.eventType === "meeting").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kelgusi tadbirlar</CardTitle>
            <CardDescription>Rejalashtirilgan tadbirlar</CardDescription>
          </CardHeader>
          <CardContent>
            {!(upcomingEvents as CalendarEvent[] | undefined)?.length ? (
              <div className="text-center py-8 text-muted-foreground">Kelgusi tadbirlar yo'q</div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(upcomingEvents) ? (upcomingEvents as CalendarEvent[]) : []).slice(0, 5).map((event: CalendarEvent) => {
                  const eventType = getEventTypeBadge(event.eventType);
                  return (
                    <div
                      key={event.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover-elevate"
                      data-testid={`card-event-${event.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold" data-testid={`text-event-title-${event.id}`}>
                            {event.title}
                          </h4>
                          <Badge variant={eventType.variant}>{eventType.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1" data-testid={`text-event-desc-${event.id}`}>
                          {event.description || "Tavsif yo'q"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {event.startDate ? format(new Date(event.startDate), "dd.MM.yyyy") : "—"}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEvent(event)}
                          data-testid={`button-edit-${event.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Tadbirni o'chirishni tasdiqlaysizmi?"
                          description="Tadbir va unga bog'liq barcha ma'lumotlar o'chiriladi."
                          onConfirm={() => handleDeleteEvent(event.id)}
                          isPending={deleteEventMutation.isPending}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Barcha tadbirlar</CardTitle>
            <CardDescription>To'liq tadbirlar ro'yxati</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
            ) : !(events as CalendarEvent[] | undefined)?.length ? (
              <div className="text-center py-8 text-muted-foreground">Hozircha tadbirlar yo'q</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sarlavha</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Harakatlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(events) ? (events as CalendarEvent[]) : []).slice(0, 10).map((event: CalendarEvent) => {
                    const eventType = getEventTypeBadge(event.eventType);
                    return (
                      <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                        <TableCell data-testid={`text-event-title-${event.id}`}>{event.title}</TableCell>
                        <TableCell>
                          <Badge variant={eventType.variant}>{eventType.label}</Badge>
                        </TableCell>
                        <TableCell data-testid={`text-event-date-${event.id}`}>
                          {event.startDate ? format(new Date(event.startDate), "dd.MM") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditEvent(event)}
                              data-testid={`button-edit-${event.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DeleteConfirmDialog
                              title="Tadbirni o'chirishni tasdiqlaysizmi?"
                              description="Tadbir va unga bog'liq barcha ma'lumotlar o'chiriladi."
                              onConfirm={() => handleDeleteEvent(event.id)}
                              isPending={deleteEventMutation.isPending}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
