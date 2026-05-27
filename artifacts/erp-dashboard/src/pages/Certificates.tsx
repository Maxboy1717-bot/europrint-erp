/**
 * @module Certificates
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Certificate, User, Course } from "./CertificatesTypes";
import { CertificateTable } from "./CertificatesSections";
import { CreateCertificateDialog } from "./CertificatesDialogs";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function Certificates() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [score, setScore] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: certificates, isLoading, isError, error, refetch } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/hr/employees"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      courseId: string;
      score?: number;
      bonusAmount?: number;
      expiresAt?: string;
    }) => {
      return await apiRequest("POST", "/api/certificates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Muvaffaqiyatli", description: "Sertifikat muvaffaqiyatli yaratildi" });
      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedCourseId("");
      setScore("");
      setBonusAmount("");
      setExpiresAt("");
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Sertifikat yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Muvaffaqiyatli", description: "Sertifikat o'chirildi" });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Sertifikatni o'chirishda xatolik",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (id: string) => {
    window.open(`/api/certificates/${id}/download`, "_blank");
  };

  const handleSubmit = () => {
    if (!selectedUserId || !selectedCourseId) {
      toast({
        title: "Xatolik",
        description: "Iltimos, xodim va kursni tanlang",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      userId: selectedUserId,
      courseId: selectedCourseId,
      score: score ? parseInt(score) : undefined,
      bonusAmount: bonusAmount ? parseInt(bonusAmount) : undefined,
      expiresAt: expiresAt || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">{t("Yuklanmoqda...")}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <EPErrorState onRetry={refetch}  error={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("sertifikatlarRoyxati")}</b></>}
        title={t("sertifikatlarRoyxati")}
        subtitle={t("kursYakunlashSertifikatlariniBoshqarish")}
      />
        </div>
        <CreateCertificateDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          users={users}
          courses={courses}
          selectedUserId={selectedUserId}
          onUserChange={setSelectedUserId}
          selectedCourseId={selectedCourseId}
          onCourseChange={setSelectedCourseId}
          score={score}
          onScoreChange={setScore}
          bonusAmount={bonusAmount}
          onBonusChange={setBonusAmount}
          expiresAt={expiresAt}
          onExpiresAtChange={setExpiresAt}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
        />
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">{t("barchaSertifikatlar")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("berilganSertifikatlarniKorishVaBoshqarish")}
          </p>
        </div>
        <CertificateTable
          certificates={certificates ?? []}
          onDownload={handleDownload}
          onDelete={id => deleteMutation.mutate(id)}
          isDeletePending={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
