/**
 * @module ERPDailyReports
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  dailyReportFormSchema,
  defaultDailyReportValues,
  type DailyReport,
  type DailyReportFormValues,
} from "./ERPDailyReportsTypes";
import { FiltersCard, ReportsTableCard } from "./ERPDailyReportsSections";
import { ReportFormDialog, DeleteReportDialog } from "./ERPDailyReportsDialogs";
import { useTranslation } from '@/lib/i18n';

export default function ERPDailyReports() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", shift: "" });

  const form = useForm<DailyReportFormValues>({
    resolver: zodResolver(dailyReportFormSchema),
    defaultValues: defaultDailyReportValues,
  });

  const { data: reports = [], isLoading, isError, refetch } = useQuery<DailyReport[]>({
    queryKey: ["/api/erp/daily-reports", filters],
  });

  const { data: users = [] } = useQuery<Array<{ id: string; fullName: string }>>({
    queryKey: ["/api/users"],
  });

  const { data: workCenters = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/erp/work-centers"],
  });

  const { data: orders = [] } = useQuery<Array<{ id: string; orderNumber: string; productName?: string }>>({
    queryKey: ["/api/erp/orders"],
  });

  const createMutation = useMutation({
    mutationFn: (data: DailyReportFormValues) =>
      apiRequest("POST", "/api/erp/daily-reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/daily-reports"] });
      toast({ title: "Hisobot yaratildi" });
      setIsDialogOpen(false);
      form.reset(defaultDailyReportValues);
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DailyReportFormValues }) =>
      apiRequest("PATCH", `/api/erp/daily-reports/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/daily-reports"] });
      toast({ title: "Hisobot yangilandi" });
      setIsDialogOpen(false);
      setEditingReport(null);
      form.reset(defaultDailyReportValues);
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/erp/daily-reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/daily-reports"] });
      toast({ title: "Hisobot o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const handleEdit = (report: DailyReport) => {
    setEditingReport(report);
    form.reset({
      reportDate: report.reportDate,
      userId: report.userId ?? "",
      shift: report.shift ?? "1-smena",
      workCenterId: report.workCenterId ?? "",
      productionOrderId: report.productionOrderId ?? "",
      planQty: report.planQty,
      factQty: report.factQty,
      scrapQty: report.scrapQty,
      downtimeMinutes: report.downtimeMinutes,
      downtimeReasonCode: report.downtimeReasonCode ?? "",
      comment: report.comment ?? "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: DailyReportFormValues) => {
    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="page-daily-reports">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ep-h1" data-testid="text-page-title">{t("kunlikHisobotlar1")}</h1>
          <p className="text-muted-foreground">{t("smenaOxiridaIshlabChiqarishHisobotlari")}</p>
        </div>
        <ReportFormDialog
          isOpen={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingReport(null);
          }}
          isEditing={!!editingReport}
          form={form}
          onSubmit={onSubmit}
          isSaving={createMutation.isPending || updateMutation.isPending}
          users={Array.isArray(users) ? users : []}
          workCenters={Array.isArray(workCenters) ? workCenters : []}
          orders={Array.isArray(orders) ? orders : []}
        />
      </div>

      <FiltersCard filters={filters} onFiltersChange={setFilters} />

      <ReportsTableCard
        reports={Array.isArray(reports) ? reports : []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onEdit={handleEdit}
        onDelete={setDeleteId}
      />

      <DeleteReportDialog
        deleteId={deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}
