/**
 * @module QCFinalInspection
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ClipboardCheck } from "lucide-react";

import { PapkaOrder, FinalInspection } from "./QCFinalInspectionTypes";
import { InspectionStats, PendingOrdersList, RecentInspectionsList } from "./QCFinalInspectionSections";
import { InspectDialog, InspectDialogFormState, InspectDialogSetters } from "./QCFinalInspectionDialogs";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function QCFinalInspection() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // Dialog open/selected order
  const [selectedOrder, setSelectedOrder] = useState<PapkaOrder | null>(null);
  const [inspectDialog, setInspectDialog] = useState(false);

  // Inspection form state
  const [sampleQty, setSampleQty] = useState(10);
  const [defectQty, setDefectQty] = useState(0);
  const [visualOk, setVisualOk] = useState(false);
  const [dimensionsOk, setDimensionsOk] = useState(false);
  const [printOk, setPrintOk] = useState(false);
  const [packagingOk, setPackagingOk] = useState(false);
  const [comments, setComments] = useState("");

  // Queries
  const { data: orders = [], isLoading } = useQuery<PapkaOrder[]>({
    queryKey: ["/api/papka-orders", "qc_final"],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/qc/final-orders");
      if (!res.ok) throw new Error("Buyurtmalarni yuklashda xatolik");
      return res.json();
    }
  });

  const { data: inspections = [] } = useQuery<FinalInspection[]>({
    queryKey: ["/api/qc/final-inspections"],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/qc/final-inspections");
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Helpers
  const resetForm = () => {
    setSampleQty(10);
    setDefectQty(0);
    setVisualOk(false);
    setDimensionsOk(false);
    setPrintOk(false);
    setPackagingOk(false);
    setComments("");
  };

  // Mutations
  const inspectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error("Buyurtma tanlanmagan");
      return apiRequest("POST", "/api/qc/final-inspections", {
        papkaOrderId: selectedOrder.id,
        sampleQty,
        defectQty,
        visualOk,
        dimensionsOk,
        printOk,
        packagingOk,
        comments,
      });
    },
    onSuccess: (data: { inspection: FinalInspection }) => {
      const passed = data.inspection.status === "passed";
      toast({
        title: passed ? "Muvaffaqiyat" : "Nuqson aniqlandi",
        description: passed
          ? `Buyurtma sifat nazoratidan o'tdi (nuqson: ${data.inspection.defectRate?.toFixed(1)}%)`
          : `Nuqson darajasi yuqori: ${data.inspection.defectRate?.toFixed(1)}%. Qayta ishlov kerak.`,
        variant: passed ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders", "qc_final"] });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/final-inspections"] });
      setInspectDialog(false);
      setSelectedOrder(null);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      return apiRequest("POST", `/api/qc/final-inspections/${inspectionId}/complete`, {});
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Buyurtma tugatildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders", "qc_final"] });
    }
  });

  // Dialog form/setters objects passed to child
  const dialogForm: InspectDialogFormState = {
    sampleQty, defectQty, visualOk, dimensionsOk, printOk, packagingOk, comments,
  };

  const dialogSetters: InspectDialogSetters = {
    setSampleQty, setDefectQty, setVisualOk, setDimensionsOk, setPrintOk, setPackagingOk, setComments,
  };

  if (isLoading) return <div className="p-6">{t("Yuklanmoqda...")}</div>;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("yakuniyQcTekshiruv")}</b></>}
        title={t("yakuniyQcTekshiruv")}
        subtitle={t("tayyorMahsulotniYetkazibBerishdanOldin")}
      />
        </div>
      </div>

      {/* Stats */}
      <InspectionStats ordersCount={orders.length} inspections={inspections} />

      {/* Pending orders */}
      <PendingOrdersList
        orders={orders}
        onInspect={(order) => { setSelectedOrder(order); setInspectDialog(true); }}
      />

      {/* Recent inspections */}
      <RecentInspectionsList inspections={inspections} completeMutation={completeMutation} />

      {/* Inspection dialog */}
      <InspectDialog
        open={inspectDialog}
        onOpenChange={setInspectDialog}
        selectedOrder={selectedOrder}
        form={dialogForm}
        setters={dialogSetters}
        inspectMutation={inspectMutation}
      />
    </div>
  );
}
