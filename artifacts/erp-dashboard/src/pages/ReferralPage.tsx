/**
 * @module ReferralPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

import { Referral, BoomerangAlumni, AddForm, EditForm } from "./ReferralPageTypes";
import { StatsGrid, MyReferralsTab, AllReferralsTab, BoomerangTab } from "./ReferralPageSections";
import { AddReferralDialog, EditReferralDialog } from "./ReferralPageDialogs";

export default function ReferralPage() {
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? user?.id ?? 0;
  const { toast } = useToast();
  const qc = useQueryClient();

  const [addOpen, setAddOpen]       = useState(false);
  const [editTarget, setEditTarget] = useState<Referral | null>(null);

  const [form, setForm] = useState<AddForm>({
    candidate_full_name: "",
    candidate_phone: "",
    position_title: "",
  });

  const [editForm, setEditForm] = useState<EditForm>({
    status: "",
    bonus_type: "",
    bonus_amount: "",
    bonus_paid: false,
    hr_notes: "",
  });

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { data: resp, isLoading } = useQuery<{ referrals?: Referral[]; stats?: Record<string, unknown> }>({
    queryKey: ["/api/hr/referrals"],
    queryFn: () => apiRequest("GET", "/api/hr/referrals"),
  });

  const { data: boomerang } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/hr/referrals/boomerang"],
    queryFn: () => apiRequest("GET", "/api/hr/referrals/boomerang"),
  });

  const referrals: Referral[] = resp?.referrals || [];
  const stats                 = resp?.stats || {};
  const alumni                = (Array.isArray(boomerang?.alumni) ? boomerang.alumni : []) as BoomerangAlumni[];
  const myReferrals           = (Array.isArray(referrals) ? referrals : []).filter(r => r.referrer_id === currentUserId);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/hr/referrals", body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Tavsiya yuborildi!" });
      qc.invalidateQueries({ queryKey: ["/api/hr/referrals"] });
      setAddOpen(false);
      setForm({ candidate_full_name: "", candidate_phone: "", position_title: "" });
    },
    onError: () => toast({ title: "Xato", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/hr/referrals/${id}`, body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Yangilandi!" });
      qc.invalidateQueries({ queryKey: ["/api/hr/referrals"] });
      setEditTarget(null);
    },
    onError: () => toast({ title: "Xato", variant: "destructive" }),
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleEditOpen(r: Referral) {
    setEditTarget(r);
    setEditForm({
      status:       r.status,
      bonus_type:   r.bonus_type || "",
      bonus_amount: String(r.bonus_amount ?? ""),
      bonus_paid:   r.bonus_paid,
      hr_notes:     r.hr_notes || "",
    });
  }

  function handleEditSubmit() {
    if (editTarget) {
      updateMut.mutate({ id: editTarget.id, body: editForm as unknown as Record<string, unknown> });
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-[var(--ep-green)]" />
          <h1 className="font-semibold text-base">Referral Tizimi</h1>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-3.5 w-3.5 mr-1" />Do'st tavsiya qilish
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        <StatsGrid stats={stats} />

        <Tabs defaultValue="my">
          <TabsList>
            <TabsTrigger value="my">Mening tavsiyalarim</TabsTrigger>
            <TabsTrigger value="all">Barcha tavsiyalar (HR)</TabsTrigger>
            <TabsTrigger value="boomerang">🔄 Boomerang Hire</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-4">
            <MyReferralsTab
              referrals={myReferrals}
              isLoading={isLoading}
              onAddOpen={() => setAddOpen(true)}
            />
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <AllReferralsTab
              referrals={referrals}
              isLoading={isLoading}
              onEdit={handleEditOpen}
            />
          </TabsContent>

          <TabsContent value="boomerang" className="mt-4">
            <BoomerangTab alumni={alumni} />
          </TabsContent>
        </Tabs>
      </div>

      <AddReferralDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        form={form}
        onFormChange={setForm}
        isPending={createMut.isPending}
        onSubmit={() => createMut.mutate({ ...form, referrer_id: currentUserId })}
      />

      <EditReferralDialog
        editTarget={editTarget}
        onClose={() => setEditTarget(null)}
        editForm={editForm}
        onEditFormChange={setEditForm}
        isPending={updateMut.isPending}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
