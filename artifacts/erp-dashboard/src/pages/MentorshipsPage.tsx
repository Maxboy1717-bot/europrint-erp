/**
 * @module MentorshipsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { EPErrorState } from "@/components/ep";

interface Mentorship {
  id: string | number;
  mentor_id?: string | number;
  mentorId?: string | number;
  mentor_name?: string;
  mentorName?: string;
  mentee_id?: string | number;
  menteeId?: string | number;
  mentee_name?: string;
  menteeName?: string;
  status?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  goal?: string;
  progress?: number;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active:    { label: "Faol",       variant: "default"     },
  completed: { label: "Tugallandi", variant: "secondary"   },
  paused:    { label: "To'xtatildi", variant: "outline"    },
  cancelled: { label: "Bekor",      variant: "destructive" },
};

const QUERY_KEY = ["/api/mentorships"];

export default function MentorshipsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate]     = useState(false);
  const [deleteId, setDeleteId]         = useState<string | number | null>(null);
  const [form, setForm] = useState({ mentor_id: "", mentee_id: "", goal: "", start_date: "" });

  const { data: rawData, isLoading, isError, refetch } = useQuery<
    Mentorship[] | { data?: Mentorship[] }
  >({
    queryKey: [...QUERY_KEY, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await apiRequest("GET", `/api/mentorships?${params}`);
      return res.json();
    },
  });

  const mentorships: Mentorship[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: Mentorship[] })?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      const res = await apiRequest("POST", "/api/mentorships", dto);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Mentorlik yaratildi" });
      setShowCreate(false);
      setForm({ mentor_id: "", mentee_id: "", goal: "", start_date: "" });
    },
    onError: () => toast({ title: "Xatolik", description: "Yaratishda muammo", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await apiRequest("DELETE", `/api/mentorships/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Mentorlik o'chirildi" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Xatolik", description: "O'chirishda muammo", variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="hr"
      title="Mentorliklar"
      icon={<Users className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-mentorship">
          <Plus className="h-4 w-4 mr-2" />
          Yangi mentorlik
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {["all", "active", "paused", "completed", "cancelled"].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter(s)}
              data-testid={`filter-status-${s}`}
            >
              {s === "all" ? "Barchasi" : (STATUS_MAP[s]?.label ?? s)}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : mentorships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Mentorliklar topilmadi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {mentorships.map(m => {
              const mentorName = m.mentor_name ?? m.mentorName ?? `Mentor ${m.mentor_id ?? m.mentorId ?? ""}`;
              const menteeName = m.mentee_name ?? m.menteeName ?? `Mentee ${m.mentee_id ?? m.menteeId ?? ""}`;
              const status     = m.status ?? "active";
              const sc         = STATUS_MAP[status] ?? STATUS_MAP.active;
              const start      = m.start_date ?? m.startDate;
              const end        = m.end_date   ?? m.endDate;
              return (
                <Card key={m.id} className="hover:shadow-md transition-shadow" data-testid={`card-mentorship-${m.id}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{mentorName} → {menteeName}</p>
                        <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {start && <span>Boshlangan: {new Date(start).toLocaleDateString("uz-UZ")}</span>}
                        {end   && <span>Tugash: {new Date(end).toLocaleDateString("uz-UZ")}</span>}
                        {m.progress !== undefined && <span>Jarayon: {m.progress}%</span>}
                        {m.goal && <span className="italic">Maqsad: {m.goal}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => setDeleteId(m.id)}
                      data-testid={`button-delete-mentorship-${m.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Yangi mentorlik</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mentor ID *</Label>
                <Input
                  value={form.mentor_id}
                  onChange={e => setForm(f => ({ ...f, mentor_id: e.target.value }))}
                  placeholder="Mentor ID"
                  data-testid="input-mentorship-mentor"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mentee ID *</Label>
                <Input
                  value={form.mentee_id}
                  onChange={e => setForm(f => ({ ...f, mentee_id: e.target.value }))}
                  placeholder="Mentee ID"
                  data-testid="input-mentorship-mentee"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Maqsad</Label>
              <Input
                value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                placeholder="Mentorlik maqsadi..."
                data-testid="input-mentorship-goal"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Boshlanish sanasi</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                data-testid="input-mentorship-start"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Bekor</Button>
            <Button
              onClick={() => { if (form.mentor_id && form.mentee_id) createMutation.mutate(form); }}
              disabled={!form.mentor_id || !form.mentee_id || createMutation.isPending}
              data-testid="button-confirm-create-mentorship"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mentorlikni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu mentorlik yozuvini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
