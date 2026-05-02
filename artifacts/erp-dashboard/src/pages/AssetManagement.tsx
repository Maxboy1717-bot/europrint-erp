import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Building2, RefreshCw } from "lucide-react";
import type { AssetInventoryItem, AssetSummary, MaintenanceRecord, DisposalRecord, TransferRecord, InsuranceRecord } from "@/components/assets/types";
import { AssetFormDialogs } from "@/components/assets/AssetFormDialogs";
import { AssetActionDialogs } from "@/components/assets/AssetActionDialogs";
import { AssetsTab } from "@/components/assets/AssetsTab";
import { AssetSummaryCards } from "@/components/assets/AssetSummaryCards";
import { AssetTabsList } from "@/components/assets/AssetTabsList";
import { MaintenanceTab } from "@/components/assets/AssetMaintenanceTab";
import { DisposalTab, TransferTab, InsuranceTab } from "@/components/assets/AssetDisposalTabs";
import { DepreciationTab } from "@/components/assets/AssetDepreciationTab";

const emptyAssetForm = {
  assetCode: "", assetName: "", assetNameRu: "", assetType: "equipment",
  location: "", purchaseDate: "", purchaseValue: 0, currentValue: 0,
  usefulLife: 5, salvageValue: 0, depreciationMethod: "straight_line",
  condition: "good", serialNumber: "", notes: "",
};
const emptyMaintenanceForm = {
  assetId: 0, maintenanceType: "preventive", scheduledDate: "",
  technicianName: "", cost: 0, description: "", notes: "",
};

export default function AssetManagement() {
  const { toast } = useToast();
  const { t } = useTranslation('mro');
  const { t: tCommon } = useTranslation('common');
  const [activeTab, setActiveTab] = useState("assets");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState("all");

  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [isDepreciateOpen, setIsDepreciateOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isDisposalOpen, setIsDisposalOpen] = useState(false);
  const [isCompleteMaintenanceOpen, setIsCompleteMaintenanceOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetInventoryItem | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null);

  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenanceForm);
  const emptyDisposalForm = { assetId: 0, disposalMethod: "write_off", disposalDate: new Date().toISOString().split("T")[0], disposalValue: 0, reason: "", notes: "" };
  const [disposalForm, setDisposalForm] = useState(emptyDisposalForm);
  const [completeMaintenanceForm, setCompleteMaintenanceForm] = useState({
    completedDate: new Date().toISOString().split("T")[0], nextMaintenanceDate: "", notes: "",
  });

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const emptyTransferForm = { assetId: 0, fromLocation: "", toLocation: "", transferDate: today, toDepartmentId: 0, reason: "", notes: "" };
  const [transferForm, setTransferForm] = useState(emptyTransferForm);

  const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
  const emptyInsuranceForm = {
    assetId: 0, policyNumber: "", insurerName: "", coverageType: "comprehensive",
    startDate: today, endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    premiumAmount: 0, coverageAmount: 0, contactInfo: "", notes: "",
  };
  const [insuranceForm, setInsuranceForm] = useState(emptyInsuranceForm);

  const { data: assets = [], isLoading: assetsLoading, refetch: refetchAssets } = useQuery<AssetInventoryItem[]>({ queryKey: ["/api/asset-management/assets"] });
  const { data: assetSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<AssetSummary>({ queryKey: ["/api/asset-management/assets/summary"] });
  const { data: maintenanceRecords = [], isLoading: maintenanceLoading, refetch: refetchMaintenance } = useQuery<MaintenanceRecord[]>({ queryKey: ["/api/asset-management/maintenance"] });
  const { data: disposals = [], isLoading: disposalsLoading, refetch: refetchDisposals } = useQuery<DisposalRecord[]>({ queryKey: ["/api/asset-management/disposals"] });
  const { data: transfers = [], isLoading: transfersLoading, refetch: refetchTransfers } = useQuery<TransferRecord[]>({ queryKey: ["/api/asset-management/transfers"] });
  const { data: insuranceRecords = [], isLoading: insuranceLoading, refetch: refetchInsurance } = useQuery<InsuranceRecord[]>({ queryKey: ["/api/asset-management/insurance"] });
  const { data: expiringInsurance = [] } = useQuery<InsuranceRecord[]>({ queryKey: ["/api/asset-management/insurance/expiring-soon"] });

  const createAssetMutation = useMutation({
    mutationFn: (data: typeof assetForm) => apiRequest("POST", "/api/asset-management/assets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/assets/summary"] });
      toast({ title: t("assetCreated") });
      setIsCreateAssetOpen(false);
      setAssetForm(emptyAssetForm);
    },
    onError: () => toast({ title: tCommon("operationFailed"), variant: "destructive" }),
  });

  const depreciateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/asset-management/assets/${id}/depreciate`, {}),
    onSuccess: (data: { asset: AssetInventoryItem; monthlyDepreciation: number; accumulatedDepreciation: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/assets/summary"] });
      toast({ title: t("depreciationCalculated"), description: `${t("monthlyDepreciationLabel")}: ${formatCurrency(data.monthlyDepreciation)}` });
      setIsDepreciateOpen(false);
    },
    onError: () => toast({ title: tCommon("errorOccurred"), variant: "destructive" }),
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: (data: typeof maintenanceForm) => apiRequest("POST", "/api/asset-management/maintenance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/maintenance"] });
      toast({ title: t("maintenanceCreated") });
      setIsMaintenanceOpen(false);
      setMaintenanceForm(emptyMaintenanceForm);
    },
    onError: () => toast({ title: tCommon("errorOccurred"), variant: "destructive" }),
  });

  const completeMaintenanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof completeMaintenanceForm }) =>
      apiRequest("PATCH", `/api/asset-management/maintenance/${id}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/maintenance"] });
      toast({ title: t("maintenanceCompleted") });
      setIsCompleteMaintenanceOpen(false);
    },
    onError: () => toast({ title: tCommon("errorOccurred"), variant: "destructive" }),
  });

  const createDisposalMutation = useMutation({
    mutationFn: (data: typeof disposalForm) => apiRequest("POST", "/api/asset-management/disposals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/assets/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/disposals"] });
      toast({ title: t("assetDisposed") });
      setIsDisposalOpen(false);
      setDisposalForm(emptyDisposalForm);
    },
    onError: () => toast({ title: tCommon("errorOccurred"), variant: "destructive" }),
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: typeof transferForm) => apiRequest("POST", "/api/asset-management/transfers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/transfers"] });
      toast({ title: t("transferRecordCreated") });
      setIsTransferOpen(false);
      setTransferForm(emptyTransferForm);
    },
    onError: () => toast({ title: tCommon("errorOccurred"), variant: "destructive" }),
  });

  const createInsuranceMutation = useMutation({
    mutationFn: (data: typeof insuranceForm) => apiRequest("POST", "/api/asset-management/insurance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/insurance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-management/insurance/expiring-soon"] });
      toast({ title: t("insuranceCreated") });
      setIsInsuranceOpen(false);
      setInsuranceForm(emptyInsuranceForm);
    },
    onError: () => toast({ title: tCommon("errorOccurred"), variant: "destructive" }),
  });

  const filteredAssets = (Array.isArray(assets) ? assets : []).filter((a) => {
    if (typeFilter !== "all" && a.assetType !== typeFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.assetCode.toLowerCase().includes(q) || a.assetName.toLowerCase().includes(q) || (a.serialNumber || "").toLowerCase().includes(q);
    }
    return true;
  });

  const filteredMaintenance = (Array.isArray(maintenanceRecords) ? maintenanceRecords : []).filter((m) => maintenanceStatusFilter === "all" || m.status === maintenanceStatusFilter);

  const totalDepreciationPercent = assetSummary
    ? assetSummary.totalPurchaseValue > 0
      ? ((assetSummary.totalAccumulatedDepreciation / assetSummary.totalPurchaseValue) * 100).toFixed(1) : "0"
    : "0";

  const handleDepreciateClick = (asset: AssetInventoryItem) => { setSelectedAsset(asset); setIsDepreciateOpen(true); };
  const handleMaintenanceClick = (asset: AssetInventoryItem) => { setSelectedAsset(asset); setMaintenanceForm({ ...emptyMaintenanceForm, assetId: asset.id }); setIsMaintenanceOpen(true); };
  const handleDisposalClick = (asset: AssetInventoryItem) => { setSelectedAsset(asset); setDisposalForm({ ...emptyDisposalForm, assetId: asset.id }); setIsDisposalOpen(true); };
  const handleCompleteMaintenanceClick = (record: MaintenanceRecord) => { setSelectedMaintenance(record); setCompleteMaintenanceForm({ completedDate: new Date().toISOString().split("T")[0], nextMaintenanceDate: "", notes: "" }); setIsCompleteMaintenanceOpen(true); };
  const handleTransferClick = (asset: AssetInventoryItem) => { setSelectedAsset(asset); setTransferForm({ ...emptyTransferForm, assetId: asset.id, fromLocation: asset.location || "" }); setIsTransferOpen(true); };
  const handleInsuranceClick = (asset: AssetInventoryItem) => { setSelectedAsset(asset); setInsuranceForm({ ...emptyInsuranceForm, assetId: asset.id }); setIsInsuranceOpen(true); };
  const handleRefresh = () => { refetchAssets(); refetchSummary(); refetchMaintenance(); refetchDisposals(); refetchTransfers(); refetchInsurance(); };

  return (
    <div className="min-h-screen bg-background" data-testid="asset-management-page">
      <div className="border-b bg-gradient-to-r from-violet-600 to-violet-500 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("pageTitle")}</h1>
                <p className="text-violet-100 text-sm">{t("pageDesc")}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRefresh} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-1" />{t("refresh")}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <AssetSummaryCards assetSummary={assetSummary} summaryLoading={summaryLoading} totalDepreciationPercent={totalDepreciationPercent} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <AssetTabsList />

          <AssetsTab
            assets={assets}
            assetSummary={assetSummary}
            filteredAssets={filteredAssets}
            assetsLoading={assetsLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            setIsCreateAssetOpen={setIsCreateAssetOpen}
            handleDepreciateClick={handleDepreciateClick}
            handleMaintenanceClick={handleMaintenanceClick}
            handleTransferClick={handleTransferClick}
            handleInsuranceClick={handleInsuranceClick}
            handleDisposalClick={handleDisposalClick}
          />
          <MaintenanceTab
            maintenanceRecords={maintenanceRecords}
            filteredMaintenance={filteredMaintenance}
            maintenanceLoading={maintenanceLoading}
            maintenanceStatusFilter={maintenanceStatusFilter}
            setMaintenanceStatusFilter={setMaintenanceStatusFilter}
            handleCompleteMaintenanceClick={handleCompleteMaintenanceClick}
          />
          <DisposalTab disposals={disposals} disposalsLoading={disposalsLoading} />
          <TransferTab
            transfers={transfers}
            transfersLoading={transfersLoading}
            setTransferForm={setTransferForm}
            emptyTransferForm={emptyTransferForm}
            setIsTransferOpen={setIsTransferOpen}
          />
          <InsuranceTab
            insuranceRecords={insuranceRecords}
            expiringInsurance={expiringInsurance}
            insuranceLoading={insuranceLoading}
            setInsuranceForm={setInsuranceForm}
            emptyInsuranceForm={emptyInsuranceForm}
            setIsInsuranceOpen={setIsInsuranceOpen}
          />
          <DepreciationTab assets={assets} assetsLoading={assetsLoading} handleDepreciateClick={handleDepreciateClick} />
        </Tabs>
      </div>

      <AssetFormDialogs
        selectedAsset={selectedAsset}
        selectedMaintenance={selectedMaintenance}
        isCreateAssetOpen={isCreateAssetOpen}
        setIsCreateAssetOpen={setIsCreateAssetOpen}
        assetForm={assetForm}
        setAssetForm={setAssetForm}
        createAssetMutation={createAssetMutation}
        isDepreciateOpen={isDepreciateOpen}
        setIsDepreciateOpen={setIsDepreciateOpen}
        depreciateMutation={depreciateMutation}
        isMaintenanceOpen={isMaintenanceOpen}
        setIsMaintenanceOpen={setIsMaintenanceOpen}
        maintenanceForm={maintenanceForm}
        setMaintenanceForm={setMaintenanceForm}
        createMaintenanceMutation={createMaintenanceMutation}
        isCompleteMaintenanceOpen={isCompleteMaintenanceOpen}
        setIsCompleteMaintenanceOpen={setIsCompleteMaintenanceOpen}
        completeMaintenanceForm={completeMaintenanceForm}
        setCompleteMaintenanceForm={setCompleteMaintenanceForm}
        completeMaintenanceMutation={completeMaintenanceMutation}
      />
      <AssetActionDialogs
        assets={assets}
        selectedAsset={selectedAsset}
        isDisposalOpen={isDisposalOpen}
        setIsDisposalOpen={setIsDisposalOpen}
        disposalForm={disposalForm}
        setDisposalForm={setDisposalForm}
        createDisposalMutation={createDisposalMutation}
        isTransferOpen={isTransferOpen}
        setIsTransferOpen={setIsTransferOpen}
        transferForm={transferForm}
        setTransferForm={setTransferForm}
        createTransferMutation={createTransferMutation}
        isInsuranceOpen={isInsuranceOpen}
        setIsInsuranceOpen={setIsInsuranceOpen}
        insuranceForm={insuranceForm}
        setInsuranceForm={setInsuranceForm}
        createInsuranceMutation={createInsuranceMutation}
      />
    </div>
  );
}
