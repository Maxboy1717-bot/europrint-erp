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
import type { WelcomeEvent } from "@shared/schema";

interface UserItem {
  id: string;
  fullName: string;
}

interface WelcomeEventsTabProps {
  events: WelcomeEvent[];
  users: UserItem[];
}

const welcomeEventFormSchema = z.object({
  title: z.string().min(1, "Sarlavhani kiriting"),
  titleRu: z.string().min(1, "Rus tilidagi sarlavhani kiriting"),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
  eventDate: z.string().min(1, "Tadbir sanasini kiriting"),
  eventTime: z.string().optional(),
  location: z.string().optional(),
  status: z.string().default("planned"),
  notes: z.string().optional(),
});

type WelcomeEventFormValues = z.infer<typeof welcomeEventFormSchema>;

export function WelcomeEventsTab({ events, users: _users }: WelcomeEventsTabProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WelcomeEvent | null>(null);

  const form = useForm<WelcomeEventFormValues>({
    resolver: zodResolver(welcomeEventFormSchema),
    defaultValues: {
      title: "", titleRu: "", description: "", descriptionRu: "",
      eventDate: "", eventTime: "", location: "", status: "planned", notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: WelcomeEventFormValues) => apiRequest("POST", "/api/adaptation/welcome-events", { ...data, participants: null, agenda: null, organizerId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/welcome-events"] });
      setIsDialogOpen(false);
      setEditingEvent(null);
      form.reset();
      toast({ title: "Tadbir yaratildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Tadbir yaratishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WelcomeEventFormValues }) => apiRequest("PATCH", `/api/adaptation/welcome-events/${id}`, { ...data, participants: null, agenda: null, organizerId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adaptation/welcome-events"] });
      setIsDialogOpen(false);
      setEditingEvent(null);
      form.reset();
      toast({ title: "Tadbir yangilandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Tadbirni yangilashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const onSubmit = (values: WelcomeEventFormValues) => {
    if (editingEvent?.id) {
      updateMutation.mutate({ id: String(editingEvent.id), data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEditEvent = (event: WelcomeEvent) => {
    setEditingEvent(event);
    form.reset({
      title: event.title,
      titleRu: event.titleRu ?? "",
      description: event.description ?? "",
      descriptionRu: event.descriptionRu ?? "",
      eventDate: event.eventDate,
      eventTime: event.eventTime ?? "",
      location: event.location ?? "",
      status: event.status,
      notes: event.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Welcome Day tadbirlari</CardTitle>
            <CardDescription>Yangi xodimlarni qabul qilish tadbirlari</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingEvent(null); form.reset(); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingEvent(null); form.reset(); }} data-testid="button-add-event">
                <Plus className="w-4 h-4 mr-2" />
                Tadbir qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent?.id ? "Tadbirni tahrirlash" : "Yangi tadbir"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Nomi (UZ)</Label>
                    <Input id="title" {...form.register("title")} data-testid="input-title" />
                    {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="titleRu">Nomi (RU)</Label>
                    <Input id="titleRu" {...form.register("titleRu")} data-testid="input-title-ru" />
                    {form.formState.errors.titleRu && <p className="text-sm text-destructive mt-1">{form.formState.errors.titleRu.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description">Tavsif (UZ)</Label>
                    <Textarea id="description" {...form.register("description")} rows={3} data-testid="input-description" />
                  </div>
                  <div>
                    <Label htmlFor="descriptionRu">Tavsif (RU)</Label>
                    <Textarea id="descriptionRu" {...form.register("descriptionRu")} rows={3} data-testid="input-description-ru" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="eventDate">Sana</Label>
                    <Input id="eventDate" type="date" {...form.register("eventDate")} data-testid="input-event-date" />
                    {form.formState.errors.eventDate && <p className="text-sm text-destructive mt-1">{form.formState.errors.eventDate.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="eventTime">Vaqt</Label>
                    <Input id="eventTime" type="time" {...form.register("eventTime")} data-testid="input-event-time" />
                  </div>
                  <div>
                    <Label>Holat</Label>
                    <Controller control={form.control} name="status" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Rejalashtirilgan</SelectItem>
                          <SelectItem value="in_progress">Ketmoqda</SelectItem>
                          <SelectItem value="completed">Yakunlangan</SelectItem>
                          <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Joylashuv</Label>
                  <Input id="location" {...form.register("location")} placeholder="Masalan: Konferensiya zali, 3-qavat" data-testid="input-location" />
                </div>
                <div>
                  <Label htmlFor="notes">Izohlar</Label>
                  <Textarea id="notes" {...form.register("notes")} rows={4} data-testid="input-notes" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-event">
                    {editingEvent?.id ? "Yangilash" : "Yaratish"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tadbir nomi</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Vaqt</TableHead>
              <TableHead>Joylashuv</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">Tadbirlar yo'q</TableCell>
              </TableRow>
            )}
            {(Array.isArray(events) ? events : []).map((event: WelcomeEvent) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{event.eventDate}</TableCell>
                <TableCell>{event.eventTime || "-"}</TableCell>
                <TableCell>{event.location || "-"}</TableCell>
                <TableCell>
                  <Badge variant={event.status === "completed" ? "default" : event.status === "in_progress" ? "secondary" : event.status === "planned" ? "outline" : "destructive"}>
                    {event.status === "planned" ? "Rejalashtirilgan" : event.status === "in_progress" ? "Ketmoqda" : event.status === "completed" ? "Yakunlangan" : "Bekor qilingan"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditEvent(event)}
                    data-testid={`button-edit-event-${event.id}`}
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
