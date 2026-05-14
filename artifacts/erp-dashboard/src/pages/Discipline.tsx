/**
 * @module Discipline
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { AlertTriangle, DollarSign, Award, FileText } from "lucide-react";
import type { User as UserType } from "@shared/schema";

import {
  disciplineFormSchema,
  type DisciplineWithUser,
  type DialogType,
  INITIAL_FORM_STATE,
} from "./DisciplineTypes";
import { DisciplineStats, ActionButtons, RecordsTable } from "./DisciplineSections";
import { CreateRecordDialog, EmployeeHistoryDialog } from "./DisciplineDialogs";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";

export default function Discipline() {
  const { t, language, setLanguage } = useTranslation("hr");
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();

  const [activeTab,                setActiveTab]                = useState("all");
  const [searchQuery,              setSearchQuery]              = useState("");
  const [isDialogOpen,             setIsDialogOpen]             = useState(false);
  const [dialogType,               setDialogType]               = useState<DialogType>("warning");
  const [selectedEmployee,         setSelectedEmployee]         = useState("");
  const [amount,                   setAmount]                   = useState("");
  const [reason,                   setReason]                   = useState("");
  const [warningType,              setWarningType]              = useState("oral");
  const [selectedEmployeeHistory,  setSelectedEmployeeHistory]  = useState<string | null>(null);

  const oralLabel    = t("oralWarning");
  const writtenLabel = t("writtenWarning");
  const finalLabel   = t("finalWarning");
  const sumLabel     = t("currencyLabel");

  const { data: employees = [], isLoading: employeesLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const {
    data: records = [],
    isLoading: recordsLoading,
    isError: recordsError,
    refetch: refetchRecords,
  } = useQuery<DisciplineWithUser[]>({
    queryKey: ["/api/hr/discipline-records"],
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: { userId: string; type: string; amount?: number; reason: string }) => {
      return apiRequest("POST", "/api/hr/discipline-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/discipline-records"] });
      toast({ title: tCommon("savedSuccessfully") });
      resetForm();
    },
    onError: () => {
      toast({ title: tCommon("operationFailed"), variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setSelectedEmployee("");
    setAmount("");
    setReason("");
    setWarningType("oral");
  };

  const openDialog = (type: DialogType) => {
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const recordType = dialogType === "act" ? "warning" : dialogType;
    const fullReason =
      dialogType === "warning"
        ? `[${warningType === "oral" ? oralLabel : warningType === "written" ? writtenLabel : finalLabel}] ${reason}`
        : reason;

    const validation = disciplineFormSchema.safeParse({
      userId: selectedEmployee,
      type:   recordType,
      amount: amount ? parseInt(amount) : undefined,
      reason: fullReason,
    });

    if (!validation.success) {
      toast({ title: validation.error.errors[0].message, variant: "destructive" });
      return;
    }

    createRecordMutation.mutate({
      userId: selectedEmployee,
      type:   recordType,
      amount: amount ? parseInt(amount) : undefined,
      reason: fullReason,
    });
  };

  const recordsArr = Array.isArray(records) ? records : [];
  const employeesArr = Array.isArray(employees) ? employees : [];

  const filteredRecords = recordsArr.filter((record) => {
    if (activeTab !== "all" && record.type !== activeTab) return false;
    if (searchQuery) {
      const employee = employeesArr.find((e) => e.id === record.userId);
      if (!employee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const employeeHistoryRecords = selectedEmployeeHistory
    ? recordsArr.filter((r) => r.userId === selectedEmployeeHistory)
    : [];

  const warningsCount = recordsArr.filter((r) => r.type === "warning").length;
  const penaltiesSum  = recordsArr.filter((r) => r.type === "penalty").reduce((s, r) => s + (r.amount || 0), 0);
  const rewardsSum    = recordsArr.filter((r) => r.type === "reward").reduce((s, r) => s + (r.amount || 0), 0);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning": return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon("warning")}</Badge>;
      case "penalty": return <EPStatusPill tone="danger">{t("fine")}</EPStatusPill>;
      case "reward":  return <EPStatusPill tone="success">{t("reward")}</EPStatusPill>;
      default:        return <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{type}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />;
      case "penalty": return <DollarSign   className="h-4 w-4 text-[var(--ep-red)]"    />;
      case "reward":  return <Award        className="h-4 w-4 text-[var(--ep-green)]"  />;
      default:        return <FileText     className="h-4 w-4"                 />;
    }
  };

  if (recordsError) return <div className="space-y-6"><EPErrorState onRetry={refetchRecords} /></div>;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-6">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("intizomNazorati")}</b></>}
        title={t("intizomNazorati")}
      />
        <div className="flex items-center gap-2">
          <Button
            variant={language === "uz" ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage("uz")}
            data-testid="button-lang-uz"
            className={language === "uz" ? "bg-primary text-white" : ""}
          >UZ</Button>
          <Button
            variant={language === "ru" ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage("ru")}
            data-testid="button-lang-ru"
            className={language === "ru" ? "bg-primary text-white" : ""}
          >RU</Button>
        </div>
      </div>

      <DisciplineStats
        warningsCount={warningsCount}
        penaltiesSum={penaltiesSum}
        rewardsSum={rewardsSum}
        tCommon={tCommon}
        t={t}
      />

      <ActionButtons onOpenDialog={openDialog} tCommon={tCommon} t={t} />

      <RecordsTable
        filteredRecords={filteredRecords}
        employees={employeesArr}
        recordsLoading={recordsLoading}
        activeTab={activeTab}
        searchQuery={searchQuery}
        onTabChange={setActiveTab}
        onSearchChange={setSearchQuery}
        onShowHistory={setSelectedEmployeeHistory}
        getTypeBadge={getTypeBadge}
        getTypeIcon={getTypeIcon}
        finalLabel={finalLabel}
        writtenLabel={writtenLabel}
        sumLabel={sumLabel}
        tCommon={tCommon}
        t={t}
      />

      <CreateRecordDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        dialogType={dialogType}
        employees={employeesArr}
        selectedEmployee={selectedEmployee}
        onEmployeeChange={setSelectedEmployee}
        warningType={warningType}
        onWarningTypeChange={setWarningType}
        amount={amount}
        onAmountChange={setAmount}
        reason={reason}
        onReasonChange={setReason}
        onSave={handleSave}
        onCancel={resetForm}
        isSaving={createRecordMutation.isPending}
        oralLabel={oralLabel}
        writtenLabel={writtenLabel}
        finalLabel={finalLabel}
        sumLabel={sumLabel}
        tCommon={tCommon}
        t={t}
      />

      <EmployeeHistoryDialog
        selectedEmployeeHistory={selectedEmployeeHistory}
        onClose={() => setSelectedEmployeeHistory(null)}
        employees={employeesArr}
        employeeHistoryRecords={employeeHistoryRecords}
        getTypeBadge={getTypeBadge}
        sumLabel={sumLabel}
        tCommon={tCommon}
        t={t}
      />
    </div>
  );
}
