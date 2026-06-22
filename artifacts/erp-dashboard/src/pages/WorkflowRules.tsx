/**
 * @module WorkflowRules
 * @description Admin config for horizontal cross-department workflow routing
 *   (Vysotskiy-7 GORIZONTAL). Each row = one STEP in an approval chain; a chain
 *   is (request_type, source_department). Lists rules grouped by chain (ordered
 *   steps with resolved dept/function names), a create form, and soft-delete.
 *   BE: GET/POST/PUT/DELETE /api/coordination/workflow-rules (+ GET resolve).
 *   useQuery (skeleton) + useMutation (toast + invalidate); delete via
 *   ConfirmDialog (Qoida 14). EP design tokens only (Qoida 21).
 * @layer Frontend page (Coordination)
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  EPPageHeader,
  EPCard,
  EPStatusPill,
  EPErrorState,
  EPEmptyState,
  EPSkeletonTable,
} from "@/components/ep";

interface RuleRow {
  id: number;
  request_type: string;
  name: string | null;
  step_order: number;
  source_department_id: number | null;
  source_department_name: string | null;
  source_function_id: number | null;
  source_function_name: string | null;
  approver_department_id: number | null;
  approver_department_name: string | null;
  approver_function_id: number | null;
  approver_function_name: string | null;
  is_active: boolean;
}

interface RuleForm {
  request_type: string;
  name: string;
  source_department_id: string;
  source_function_id: string;
  step_order: string;
  approver_department_id: string;
  approver_function_id: string;
}

const EMPTY_FORM: RuleForm = {
  request_type: "",
  name: "",
  source_department_id: "",
  source_function_id: "",
  step_order: "1",
  approver_department_id: "",
  approver_function_id: "",
};

const numOrNull = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function WorkflowRules() {
  const { t } = useTranslation("coordination");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ data: RuleRow[] }>({
    queryKey: ["/api/coordination/workflow-rules"],
    queryFn: () =>
      apiRequest("GET", "/api/coordination/workflow-rules") as Promise<{ data: RuleRow[] }>,
  });

  const rules: RuleRow[] = data?.data && Array.isArray(data.data) ? data.data : [];

  // Group rows into chains: request_type + source_department.
  const chains = useMemo(() => {
    const map = new Map<string, { key: string; request_type: string; source: string; steps: RuleRow[] }>();
    for (const r of rules) {
      const key = `${r.request_type}__${r.source_department_id ?? "—"}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          request_type: r.request_type,
          source: r.source_department_name ?? (r.source_department_id ? `#${r.source_department_id}` : "—"),
          steps: [],
        });
      }
      map.get(key)!.steps.push(r);
    }
    for (const c of map.values()) c.steps.sort((a, b) => a.step_order - b.step_order);
    return Array.from(map.values());
  }, [rules]);

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest("POST", "/api/coordination/workflow-rules", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/coordination/workflow-rules"] });
      toast({ title: t("workflowRules.ruleAdded", "Qoida qo'shildi") });
      setForm(EMPTY_FORM);
    },
    onError: () => toast({ title: t("workflowRules.error", "Xatolik"), description: t("workflowRules.ruleSaveFailed", "Qoida saqlanmadi"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/coordination/workflow-rules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/coordination/workflow-rules"] });
      toast({ title: t("workflowRules.ruleDeleted", "Qoida o'chirildi") });
      setDeleteId(null);
    },
    onError: () => toast({ title: t("workflowRules.error", "Xatolik"), description: t("workflowRules.deleteFailed", "O'chirib bo'lmadi"), variant: "destructive" }),
  });

  const canSubmit = form.request_type.trim().length > 0 && numOrNull(form.step_order) !== null;

  const submit = () => {
    if (!canSubmit) return;
    createMutation.mutate({
      request_type: form.request_type.trim(),
      name: form.name.trim() || null,
      source_department_id: numOrNull(form.source_department_id),
      source_function_id: numOrNull(form.source_function_id),
      step_order: numOrNull(form.step_order) ?? 1,
      approver_department_id: numOrNull(form.approver_department_id),
      approver_function_id: numOrNull(form.approver_function_id),
    });
  };

  return (
    <div className="space-y-6">
      <EPPageHeader
        title={t("workflowRules.title", "Workflow qoidalari")}
        subtitle={t("workflowRules.subtitle", "Gorizontal bo'limlararo tasdiqlash zanjirlari (Vysotskiy-7)")}
        icon={<GitBranch className="h-5 w-5" />}
      />

      <EPCard title={t("workflowRules.newStep", "Yangi qadam qo'shish")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="wr-rt">{t("workflowRules.requestType", "So'rov turi *")}</Label>
            <Input
              id="wr-rt"
              placeholder="advance_request"
              value={form.request_type}
              onChange={(e) => setForm({ ...form, request_type: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-name">{t("workflowRules.name", "Nomi")}</Label>
            <Input
              id="wr-name"
              placeholder={t("workflowRules.namePlaceholder", "Avans ariza")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-step">{t("workflowRules.stepOrder", "Qadam tartibi *")}</Label>
            <Input
              id="wr-step"
              type="number"
              min={1}
              value={form.step_order}
              onChange={(e) => setForm({ ...form, step_order: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-sdep">{t("workflowRules.sourceDeptId", "Manba bo'lim ID")}</Label>
            <Input
              id="wr-sdep"
              type="number"
              value={form.source_department_id}
              onChange={(e) => setForm({ ...form, source_department_id: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-sfn">{t("workflowRules.sourceFnId", "Manba lavozim ID")}</Label>
            <Input
              id="wr-sfn"
              type="number"
              value={form.source_function_id}
              onChange={(e) => setForm({ ...form, source_function_id: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-adep">{t("workflowRules.approverDeptId", "Tasdiqlovchi bo'lim ID")}</Label>
            <Input
              id="wr-adep"
              type="number"
              value={form.approver_department_id}
              onChange={(e) => setForm({ ...form, approver_department_id: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wr-afn">{t("workflowRules.approverFnId", "Tasdiqlovchi lavozim ID")}</Label>
            <Input
              id="wr-afn"
              type="number"
              value={form.approver_function_id}
              onChange={(e) => setForm({ ...form, approver_function_id: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={submit} disabled={!canSubmit || createMutation.isPending} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {t("workflowRules.add", "Qo'shish")}
            </Button>
          </div>
        </div>
      </EPCard>

      {isLoading ? (
        <EPSkeletonTable rows={5} />
      ) : isError ? (
        <EPErrorState onRetry={() => refetch()} />
      ) : chains.length === 0 ? (
        <EPEmptyState icon={GitBranch} title={t("workflowRules.emptyTitle", "Qoidalar yo'q")} description={t("workflowRules.emptyDesc", "Birinchi tasdiqlash zanjiri qadamini qo'shing.")} />
      ) : (
        <div className="space-y-4">
          {chains.map((chain) => (
            <EPCard key={chain.key} title={`${chain.request_type} — ${chain.source}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("workflowRules.colStep", "Qadam")}</TableHead>
                    <TableHead>{t("workflowRules.colApproverDept", "Tasdiqlovchi bo'lim")}</TableHead>
                    <TableHead>{t("workflowRules.colApproverFn", "Tasdiqlovchi lavozim")}</TableHead>
                    <TableHead>{t("workflowRules.colStatus", "Holat")}</TableHead>
                    <TableHead className="text-right">{t("workflowRules.colAction", "Amal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chain.steps.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.step_order}</TableCell>
                      <TableCell>{s.approver_department_name ?? (s.approver_department_id ? `#${s.approver_department_id}` : "—")}</TableCell>
                      <TableCell>{s.approver_function_name ?? (s.approver_function_id ? `#${s.approver_function_id}` : "—")}</TableCell>
                      <TableCell>
                        <EPStatusPill tone={s.is_active ? "success" : "neutral"}>{s.is_active ? t("workflowRules.active", "Faol") : t("workflowRules.inactive", "O'chirilgan")}</EPStatusPill>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(s.id)} aria-label={t("workflowRules.delete", "O'chirish")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </EPCard>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title={t("workflowRules.confirmDeleteTitle", "Qoidani o'chirish")}
        description={t("workflowRules.confirmDeleteDesc", "Bu qadam o'chiriladi (faolsizlantiriladi).")}
        confirmText={t("workflowRules.delete", "O'chirish")}
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
      />
    </div>
  );
}
