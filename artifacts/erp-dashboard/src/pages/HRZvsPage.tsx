/**
 * @module HRZvsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ModulePage } from "@/components/ui/module-page";
import { TrendingUp, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ZvsRequest, ZvsFormState, ActionDialogState } from "./HRZvsPageTypes";
import {
  ZvsFilterBar, ZvsSkeletonList, ZvsEmptyState, ZvsCardList,
} from "./HRZvsPageSections";
import { CreateZvsDialog, ActionZvsDialog } from "./HRZvsPageDialogs";
import { EPErrorState } from "@/components/ep";

const EMPTY_FORM: ZvsFormState = {
  purpose: "", amount: "", submitter_name: "", priority: "normal", week_date: "",
};

export default function HRZvsPage() {
  const { toast } = useToast();
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate]     = useState(false);
  const [actionDialog, setActionDialog] = useState<ActionDialogState | null>(null);
  const [comment, setComment]           = useState("");
  const [form, setForm]                 = useState<ZvsFormState>(EMPTY_FORM);

  const { data: rawData, isLoading, isError, refetch } = useQuery<ZvsRequest[] | { data?: ZvsRequest[]; items?: ZvsRequest[] }>({
    queryKey: ["/api/hr/zvs", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await apiRequest("GET", `/api/hr/zvs${params}`);
      return res.json();
    },
  });

  const items: ZvsRequest[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: ZvsRequest[] })?.data
      ?? (rawData as { items?: ZvsRequest[] })?.items
      ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: ZvsFormState) => {
      const res = await apiRequest("POST", "/api/hr/zvs", {
        ...dto,
        amount: parseFloat(dto.amount),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zvs"] });
      toast({ title: "ZVS arizasi yaratildi" });
      setShowCreate(false);
      setForm(EMPTY_FORM);
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Ariza yaratishda xatolik", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string | number; comment: string }) => {
      const res = await apiRequest("PATCH", `/api/hr/zvs/${id}/approve`, { comment: comment || null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zvs"] });
      toast({ title: "ZVS tasdiqlandi" });
      setActionDialog(null);
      setComment("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Tasdiqlashda xatolik", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string | number; comment: string }) => {
      const res = await apiRequest("PATCH", `/api/hr/zvs/${id}/reject`, { comment: comment || null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zvs"] });
      toast({ title: "ZVS rad etildi" });
      setActionDialog(null);
      setComment("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Rad etishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch} />;

  const filtered = (Array.isArray(items) ? items : []).filter((r) => {
    const text = `${r.purpose} ${r.submitter_name ?? r.submitterName ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const handleAction = () => {
    if (!actionDialog) return;
    if (actionDialog.type === "approve") {
      approveMutation.mutate({ id: actionDialog.id, comment });
    } else {
      rejectMutation.mutate({ id: actionDialog.id, comment });
    }
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <ModulePage
      module="hr"
      title="ZVS — Rejalashtirilmagan Xarajatlar"
      icon={<TrendingUp className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-zvs">
          <Plus className="h-4 w-4 mr-2" />
          Ariza yaratish
        </Button>
      }
    >
      <div className="space-y-4">
        <ZvsFilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {isLoading ? (
          <ZvsSkeletonList />
        ) : filtered.length === 0 ? (
          <ZvsEmptyState hasSearch={!!search} />
        ) : (
          <ZvsCardList
            items={filtered}
            onApprove={(id) => { setActionDialog({ id, type: "approve" }); setComment(""); }}
            onReject={(id)  => { setActionDialog({ id, type: "reject"  }); setComment(""); }}
          />
        )}
      </div>

      <CreateZvsDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        form={form}
        onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={() => { if (form.purpose.trim() && form.amount) createMutation.mutate(form); }}
        isPending={createMutation.isPending}
      />

      <ActionZvsDialog
        actionDialog={actionDialog}
        comment={comment}
        onCommentChange={setComment}
        onClose={() => { setActionDialog(null); setComment(""); }}
        onConfirm={handleAction}
        isPending={isPending}
      />
    </ModulePage>
  );
}
