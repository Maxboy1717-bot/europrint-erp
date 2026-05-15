/**
 * @module ApprovalWorkflowPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModulePage } from "@/components/ui/module-page";
import { ClipboardCheck, Plus, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Workflow, WorkflowForm, EMPTY_FORM } from "./ApprovalWorkflowPageTypes";
import { WorkflowList } from "./ApprovalWorkflowPageSections";
import { CreateWorkflowDialog, ActionWorkflowDialog } from "./ApprovalWorkflowPageDialogs";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function ApprovalWorkflowPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [showCreate, setShowCreate] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ id: string; type: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [form, setForm] = useState<WorkflowForm>(EMPTY_FORM);

  const endpoint = tab === "history" ? "/api/approval-workflow/history" : "/api/approval-workflow/pending";
  const { data: rawData, isLoading, isError, error, refetch } = useQuery<Workflow[] | { data?: Workflow[] }>({
    queryKey: ["/api/approval-workflow", tab],
    queryFn: async () => {
      return await apiRequest("GET", endpoint);
    },
  });

  const workflows: Workflow[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: Workflow[] })?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: WorkflowForm) => {
      return await apiRequest("POST", "/api/approval-workflow/submit", {
        ...dto,
        amount: dto.amount ? parseFloat(dto.amount) : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
      toast({ title: "Tasdiqlash so'rovi yuborildi" });
      setShowCreate(false);
      setForm(EMPTY_FORM);
    },
    onError: () => {
      toast({ title: "Xatolik", description: "So'rov yuborishda xatolik", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return await apiRequest("POST", `/api/approval-workflow/approve/${id}`, { notes: reason || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
      toast({ title: "Tasdiqlandi" });
      setActionDialog(null);
      setReason("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Tasdiqlashda xatolik", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("POST", `/api/approval-workflow/reject/${id}`, { rejectionReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
      toast({ title: "Rad etildi" });
      setActionDialog(null);
      setReason("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Rad etishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const filtered = workflows.filter(w => {
    const text = `${w.documentType ?? w.document_type ?? ""} ${w.documentNumber ?? w.document_number ?? ""} ${w.requestedBy ?? w.requested_by ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const handleAction = () => {
    if (!actionDialog) return;
    if (actionDialog.type === "approve") {
      approveMutation.mutate({ id: actionDialog.id });
    } else {
      if (!reason.trim()) { toast({ title: "Sabab kiriting", variant: "destructive" }); return; }
      rejectMutation.mutate({ id: actionDialog.id, reason });
    }
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <ModulePage
      module="finance"
      title={t("tasdiqlashJarayoni")}
      icon={<ClipboardCheck className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-workflow">
          <Plus className="h-4 w-4 mr-2" />
          {t("sorovYuborish")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("hujjatQidirish")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-workflow"
            />
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">{t("Kutilmoqda")}</TabsTrigger>
            <TabsTrigger value="history">{t("tarix")}</TabsTrigger>
          </TabsList>

          {["pending", "history"].map(t => (
            <TabsContent key={t} value={t} className="mt-4">
              <WorkflowList
                isLoading={isLoading}
                filtered={filtered}
                tab={t}
                onApprove={id => { setActionDialog({ id, type: "approve" }); setReason(""); }}
                onReject={id => { setActionDialog({ id, type: "reject" }); setReason(""); }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <CreateWorkflowDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        form={form}
        onFormChange={setForm}
        onSubmit={() => {
          if (form.documentType.trim() && form.documentId.trim() && form.requestedBy.trim()) {
            createMutation.mutate(form);
          }
        }}
        isPending={createMutation.isPending}
      />

      <ActionWorkflowDialog
        actionDialog={actionDialog}
        reason={reason}
        onReasonChange={setReason}
        onClose={() => { setActionDialog(null); setReason(""); }}
        onConfirm={handleAction}
        isPending={isPending}
      />
    </ModulePage>
  );
}
