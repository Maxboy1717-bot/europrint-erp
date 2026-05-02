import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Language, 
  FormData, 
  CrmCompany, 
  Product, 
  BomHeader, 
  BomItem, 
  RawMaterial, 
  MaterialCalculation,
  RoutingOperation,
  Translation
} from "./types";
import { translations } from "./translations";

export function useWizardState() {
  const { toast } = useToast();
  const [lang, setLang] = useState<Language>("uz");
  const [currentStep, setCurrentStep] = useState(1);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  const t = translations[lang];

  const [formData, setFormData] = useState<FormData>({
    papkaNo: "",
    mijozNomi: "",
    mahsulotNomi: "",
    productId: "",
    mahsulotTuri: "",
    vidZakaza: "",
    zakazFormy: "new",
    tiraj: 0,
    krasok: "1+0",
    formatA: 0,
    formatB: 0,
    formatC: 0,
    sana: new Date().toISOString().split("T")[0],
    tayyorBolishSanasi: "",
    tayyorBolishVaqti: "12:00",
    schetNo: "",
    menedzherZakaza: "",
    texnolog: "",
    primZakaza: "",
    selectedBomId: "",
  });

  const { data: companies = [], isError: companiesError, refetch: refetchCompanies } = useQuery<CrmCompany[]>({
    queryKey: ["/api/crm/companies"],
  });

  const { data: productsResponse } = useQuery<{ products: Product[] } | Product[]>({
    queryKey: ["/api/erp/products"],
  });
  
  const products = Array.isArray(productsResponse) 
    ? productsResponse 
    : productsResponse?.products || [];

  const { data: bomListResponse = [] } = useQuery<Array<{ bom: BomHeader; product: Product }>>({
    queryKey: ["/api/erp/bom-headers"],
    enabled: !!formData.productId,
  });

  const filteredBoms = useMemo(() => {
    if (!formData.productId) return [];
    return (Array.isArray(bomListResponse) ? bomListResponse : []).filter((item) => item.bom.productId === formData.productId);
  }, [bomListResponse, formData.productId]);

  const { data: selectedBomDetail } = useQuery<{
    bom: BomHeader;
    product: Product;
    items: Array<{ item: BomItem; component: Product }>;
  }>({
    queryKey: ["/api/erp/bom-headers", formData.selectedBomId],
    enabled: !!formData.selectedBomId,
  });

  const bomItemsResponse = selectedBomDetail?.items || [];
  const selectedBom = (Array.isArray(bomListResponse) ? bomListResponse : []).find((item) => item.bom.id === formData.selectedBomId) ?? null;

  const { data: rawMaterialsResponse } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
  });

  const rawMaterials = rawMaterialsResponse || [];

  const { data: routingsResponse = [] } = useQuery<Array<{ routing: { id: string; routingNumber: string; productId: string; status: string }; product: Product }>>({
    queryKey: ["/api/erp/routings"],
    enabled: !!formData.productId,
  });

  const { data: routingOperations = [] } = useQuery<Array<{ operation: RoutingOperation; workCenter: { id: string; name: string } }>>({
    queryKey: ["/api/erp/routing-operations"],
    enabled: !!formData.productId,
  });

  const materialCalculations = useMemo((): MaterialCalculation[] => {
    if (!bomItemsResponse.length || formData.tiraj <= 0) return [];

    return (Array.isArray(bomItemsResponse) ? bomItemsResponse : []).map(({ item, component }) => {
      const scrapMultiplier = 1 + (item.scrapPercentage / 100);
      const requiredQuantity = item.quantity * formData.tiraj * scrapMultiplier;
      
      const material = (Array.isArray(rawMaterials) ? rawMaterials : []).find(
        (m) => m.id === item.componentId || m.code === component?.code
      );
      const availableStock = material?.currentStock || 0;
      const deficit = Math.max(0, requiredQuantity - availableStock);

      return {
        componentId: item.componentId,
        componentName: component?.name || "Noma'lum",
        componentCode: component?.code || "-",
        unit: item.unit,
        baseQuantity: item.quantity,
        scrapPercentage: item.scrapPercentage,
        requiredQuantity: Math.ceil(requiredQuantity),
        availableStock,
        deficit: Math.ceil(deficit),
        status: deficit <= 0 ? "sufficient" : "insufficient",
      };
    });
  }, [bomItemsResponse, formData.tiraj, rawMaterials]);

  const estimatedProductionTime = useMemo(() => {
    const productRoutings = (Array.isArray(routingsResponse) ? routingsResponse : []).filter(
      (r) => r.routing.productId === formData.productId && r.routing.status === "active"
    );
    
    if (!productRoutings.length) return null;

    const routingId = productRoutings[0]?.routing?.id;
    if (!routingId) return null;

    const ops = (Array.isArray(routingOperations) ? routingOperations : []).filter((o) => o.operation.routingId === routingId);
    const totalTime = (Array.isArray(ops) ? ops : []).reduce((sum, o) => {
      return sum + o.operation.setupTime + (o.operation.machineTime * formData.tiraj);
    }, 0);

    return totalTime;
  }, [routingsResponse, routingOperations, formData.productId, formData.tiraj]);

  const sufficientCount = (Array.isArray(materialCalculations) ? materialCalculations : []).filter((m) => m.status === "sufficient").length;
  const insufficientCount = (Array.isArray(materialCalculations) ? materialCalculations : []).filter((m) => m.status === "insufficient").length;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const productRouting = (Array.isArray(routingsResponse) ? routingsResponse : []).find(
        (r) => r.routing.productId === formData.productId && r.routing.status === "active"
      );
      
      const materialReqs = (Array.isArray(materialCalculations) ? materialCalculations : []).map(m => ({
        componentId: m.componentId,
        componentName: m.componentName,
        componentCode: m.componentCode,
        unit: m.unit,
        requiredQuantity: m.requiredQuantity,
        availableStock: m.availableStock,
        deficit: m.deficit,
        status: m.status
      }));
      
      const orderData = {
        papkaNo: formData.papkaNo || "",
        mijozNomi: formData.mijozNomi,
        mahsulotNomi: formData.mahsulotNomi,
        mahsulotTuri: formData.mahsulotTuri,
        vidZakaza: formData.vidZakaza || null,
        zakazFormy: formData.zakazFormy || "new",
        tiraj: formData.tiraj,
        krasok: formData.krasok || null,
        formatA: formData.formatA,
        formatB: formData.formatB,
        formatC: formData.formatC || null,
        sana: formData.sana,
        tayyorBolishSanasi: formData.tayyorBolishSanasi,
        tayyorBolishVaqti: formData.tayyorBolishVaqti || null,
        schetNo: formData.schetNo || null,
        menedzherZakaza: formData.menedzherZakaza || null,
        texnolog: formData.texnolog || null,
        primZakaza: formData.primZakaza || null,
        status: "new",
        bomId: formData.selectedBomId || null,
        productId: formData.productId || null,
        routingId: productRouting?.routing?.id || null,
        materialRequirements: materialReqs.length > 0 ? materialReqs : null,
        stockCheckResult: materialReqs.length > 0 ? {
          sufficient: sufficientCount,
          insufficient: insufficientCount,
          total: materialReqs.length
        } : null,
        estimatedProductionTime: estimatedProductionTime || null,
      };
      return apiRequest("POST", "/api/papka-orders", orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      toast({ title: t.created });
      setFormData({
        papkaNo: "",
        mijozNomi: "",
        mahsulotNomi: "",
        productId: "",
        mahsulotTuri: "",
        vidZakaza: "",
        zakazFormy: "new",
        tiraj: 0,
        krasok: "1+0",
        formatA: 0,
        formatB: 0,
        formatC: 0,
        sana: new Date().toISOString().split("T")[0],
        tayyorBolishSanasi: "",
        tayyorBolishVaqti: "12:00",
        schetNo: "",
        menedzherZakaza: "",
        texnolog: "",
        primZakaza: "",
        selectedBomId: "",
      });
      setCurrentStep(1);
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: t.error,
        description: error.message || t.error
      });
    },
  });

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.mijozNomi && formData.mahsulotNomi && formData.tiraj > 0);
      case 2:
        return !!formData.selectedBomId;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({ variant: "destructive", title: t.validation });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    createOrderMutation.mutate();
  };

  const handleProductSelect = (product: Product) => {
    setFormData({
      ...formData,
      productId: product.id,
      mahsulotNomi: product.name,
      selectedBomId: "",
    });
    setProductOpen(false);
  };

  return {
    lang,
    setLang,
    currentStep,
    setCurrentStep,
    customerOpen,
    setCustomerOpen,
    productOpen,
    setProductOpen,
    formData,
    setFormData,
    t,
    companies,
    companiesError,
    refetchCompanies,
    products,
    filteredBoms,
    selectedBom,
    materialCalculations,
    estimatedProductionTime,
    sufficientCount,
    insufficientCount,
    createOrderMutation,
    handleNext,
    handleBack,
    handleSubmit,
    handleProductSelect,
  };
}
