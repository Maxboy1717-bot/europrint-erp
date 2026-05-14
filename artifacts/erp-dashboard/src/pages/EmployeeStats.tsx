/**
 * @module EmployeeStats
 * @description React page component. Route-level UI.
 */

import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AddAttendanceDialog } from "@/components/AddAttendanceDialog";
import { AddDisciplineDialog } from "@/components/AddDisciplineDialog";
import { AbcAnalysisCard } from "@/components/AbcAnalysisCard";
import { EditPersonalInfoDialog } from "@/components/EditPersonalInfoDialog";
import { EmployeeHeader } from "@/components/hr/stats/EmployeeHeader";
import { OrganizationalStructure } from "@/components/hr/stats/OrganizationalStructure";
import { StatsOverview } from "@/components/hr/stats/StatsOverview";
import { StatsCharts } from "@/components/hr/stats/StatsCharts";
import { AttendanceDisciplineTables } from "@/components/hr/stats/AttendanceDisciplineTables";
import { LearningHistoryTables } from "@/components/hr/stats/LearningHistoryTables";
import { FilesTable } from "@/components/hr/stats/FilesTable";
import { HierarchyTab } from "@/components/hr/stats/HierarchyTab";
import { useEmployeeFiles } from "@/components/hr/stats/useEmployeeFiles";
import {
  useEmployeeData,
  getInitials,
  getStatusBadge,
  getAttendanceStatusBadge,
  getDisciplineTypeBadge,
  formatFileSize,
} from "@/components/hr/stats/utils";
import {
  Employee,
  Assignment,
  Attempt,
  Certificate,
  Progress,
  AttendanceRecord,
  DisciplineRecord,
  EmployeeFile,
  AbcAnalysis as LocalAbcAnalysis,
} from "@/components/hr/stats/types";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function EmployeeStats() {
  const { t } = useTranslation("common");
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isDisciplineDialogOpen, setIsDisciplineDialogOpen] = useState(false);
  const [isPersonalInfoDialogOpen, setIsPersonalInfoDialogOpen] = useState(false);

  const { data: employee, isLoading: employeeLoading, isError, refetch } = useQuery<Employee>({
    queryKey: ["/api/employees", id],
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: attempts = [] } = useQuery<Attempt[]>({
    queryKey: ["/api/attempts"],
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: progress = [] } = useQuery<Progress[]>({
    queryKey: ["/api/progress"],
  });

  const { data: allAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/hr/attendance"],
  });

  const { data: allDisciplineRecords = [] } = useQuery<DisciplineRecord[]>({
    queryKey: ["/api/hr/discipline-records"],
  });

  const { data: employeeFiles = [], isLoading: filesLoading } = useQuery<EmployeeFile[]>({
    queryKey: ["/api/employees", id, "files"],
  });

  const { data: abcAnalysis } = useQuery<LocalAbcAnalysis>({
    queryKey: ["/api/hr/abc-analysis", id],
    enabled: !!id,
  });

  const {
    employeeAssignments,
    employeeAttempts,
    employeeCertificates,
    employeeAttendance,
    employeeDisciplineRecords,
    completedCourses,
    passedTests,
    completedLessons,
    attendanceChartData,
  } = useEmployeeData(id, assignments, attempts, certificates, progress, allAttendance, allDisciplineRecords);

  const {
    isUploadOpen,
    setIsUploadOpen,
    selectedFile,
    setSelectedFile,
    fileDescription,
    setFileDescription,
    handleFileUpload,
    uploadFileMutation,
    deleteFileMutation,
  } = useEmployeeFiles(id);

  const calculateAbcMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/hr/abc-analysis/${id}/calculate`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/abc-analysis", id] });
      toast({
        title: "Muvaffaqiyat",
        description: "ABC analiz muvaffaqiyatli hisoblandi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error?.message || "ABC analiz hisoblashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t("Yuklanmoqda...")}</div>
      </div>
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-muted-foreground">{t("xodimTopilmadi")}</div>
        <Button onClick={() => navigate("/employees")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
      </div>
    );
  }

  const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/employees")} data-testid="button-back-icon" className="rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex-1">
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("xodimStatistikasi")}</b></>}
        title={t("xodimStatistikasi")}
        subtitle={t("toliqMalumotlarVaOqishJarayoni")}
      />
        </div>
      </div>

      <EmployeeHeader 
        employee={employee} 
        getInitials={getInitials} 
        getStatusBadge={getStatusBadge} 
      />

      <OrganizationalStructure 
        employee={employee} 
        getInitials={getInitials} 
        onNavigate={navigate} 
      />

      <StatsOverview 
        totalCourses={employeeAssignments.length}
        completedCourses={completedCourses}
        totalTests={employeeAttempts.length}
        passedTests={passedTests}
        completedLessons={completedLessons}
        totalCertificates={employeeCertificates.length}
      />

      <StatsCharts 
        employeeAttempts={employeeAttempts} 
        attendanceChartData={attendanceChartData} 
        COLORS={COLORS} 
      />

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="bg-muted/60 rounded-lg p-1">
          <TabsTrigger value="activity">{t("faoliyat")}</TabsTrigger>
          <TabsTrigger value="learning">{t("oquvJarayoni")}</TabsTrigger>
          <TabsTrigger value="files">{t("fayllar")}</TabsTrigger>
          <TabsTrigger value="abc">{t("abcAnaliz")}</TabsTrigger>
          <TabsTrigger value="hierarchy">{t("tuzilma")}</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <AttendanceDisciplineTables 
            attendance={employeeAttendance}
            discipline={employeeDisciplineRecords}
            getAttendanceStatusBadge={getAttendanceStatusBadge}
            getDisciplineTypeBadge={getDisciplineTypeBadge}
            onOpenAttendanceDialog={() => setIsAttendanceDialogOpen(true)}
            onOpenDisciplineDialog={() => setIsDisciplineDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <LearningHistoryTables 
            assignments={employeeAssignments}
            certificates={employeeCertificates}
          />
        </TabsContent>

        <TabsContent value="files">
          <FilesTable 
            files={employeeFiles}
            isLoading={filesLoading}
            isUploadOpen={isUploadOpen}
            setIsUploadOpen={setIsUploadOpen}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            fileDescription={fileDescription}
            setFileDescription={setFileDescription}
            handleFileUpload={handleFileUpload}
            isUploading={uploadFileMutation.isPending}
            onDeleteFile={(id) => deleteFileMutation.mutate(id)}
            isDeleting={deleteFileMutation.isPending}
            formatFileSize={formatFileSize}
          />
        </TabsContent>

        <TabsContent value="abc">
          <AbcAnalysisCard
            analysis={abcAnalysis || null}
            onCalculate={() => calculateAbcMutation.mutate()}
            onEdit={() => setIsPersonalInfoDialogOpen(true)}
            isCalculating={calculateAbcMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="hierarchy">
          <HierarchyTab />
        </TabsContent>
      </Tabs>

      <AddAttendanceDialog 
        open={isAttendanceDialogOpen} 
        onOpenChange={setIsAttendanceDialogOpen}
        userId={id}
      />
      <AddDisciplineDialog 
        open={isDisciplineDialogOpen} 
        onOpenChange={setIsDisciplineDialogOpen}
        userId={id}
      />
      <EditPersonalInfoDialog
        open={isPersonalInfoDialogOpen}
        onOpenChange={setIsPersonalInfoDialogOpen}
        userId={id || ""}
        employee={employee}
      />
    </div>
  );
}
