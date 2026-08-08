/**
 * @module useWizardState
 * @description React UI component.
 */

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
    customerId: "",
    mahsulotNomi: "",
    productId: "",
    mahsulotTuri: "",
    vidZakaza: "",
    zakazFormy: "new",
    tiraj: 0,
    krasok: "1+0",
    narx: 0,
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

  // Customer dropdown sources from sd_customers (canonical customer master) so new
  // orders bind to the same customer base used everywhere else — NOT crm_companies.
  // /api/sd/customers returns { data: [...], total }; unwrap .data → CrmCompany[] {id,name}.
  const { data: companies = [], isError: companiesError, refetch: refetchCompanies } = useQuery<CrmCompany[]>({
    queryKey: ["/api/sd/customers", "order-wizard-dropdown"],
    queryFn: async () => {
      const resp = await apiRequest<unknown>("GET", "/api/sd/customers?limit=500");
      const arr = Array.isArray(resp)
        ? resp
        : Array.isArray((resp as Record<string, unknown>)?.["data"])
        ? ((resp as Record<string, unknown>)["data"] as CrmCompany[])
        : [];
      return arr as CrmCompany[];
    },
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

  // Owner decision 2026-07-13 (chat) — "buyurtma 1 ta joydan yaratilishi kerak": this wizard
  // now creates a REAL sales_orders + sales_order_items row (via the same canonical
  // POST /api/sd/orders -> CreateOrderCommand path SDSalesOrders.tsx uses), instead of the
  // legacy /api/papka-orders table, which had zero link into the golden thread (no Design/
  // QC/Technologist/AI-planning event ever fired from a papka_order). companyId+customerId
  // both carry sd_customers.id — the same "same value in both fields" convention already
  // established at SDSalesOrders.tsx:290-294 (sales_orders.customer_id is NOT NULL live).
  // designFlag defaults true: every order from this single entry point should enter the
  // Design -> (lab) -> Technologist -> production-planning chain the owner described.
  // The wizard's own "product" picker sources from material_cards (raw materials — see the
  // /api/erp/products query above), not the finished-goods `products` catalog, so it cannot
  // bind sales_order_items.product_id (a real products-table FK). This order line is
  // therefore posted as a bespoke job (product_id left unset) using the custom-spec columns
  // already wired for this exact case on the quotation-conversion paths (owner decision
  // 2026-07-13 — same "Mahsulot vs Buyurtma" decision). krasok ("4+4" style) is parsed for
  // its leading print-colors count; the "+back" side isn't captured as a separate field yet.
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const printColors = parseInt(formData.krasok.split("+")[0] ?? "", 10);
      const netPrice = Number(formData.narx) || 0;
      const orderData = {
        companyId: Number(formData.customerId),
        customerId: Number(formData.customerId),
        totalAmount: netPrice * formData.tiraj,
        currency: "UZS",
        designFlag: true,
        sampleFlag: false,
        items: [{
          description: formData.mahsulotNomi || formData.papkaNo || "Maxsus buyurtma",
          orderQuantity: formData.tiraj,
          unit: "dona",
          netPrice,
          productType: formData.mahsulotTuri || undefined,
          printColors: Number.isFinite(printColors) ? printColors : undefined,
          lengthMm: formData.formatA || undefined,
          widthMm: formData.formatB || undefined,
          heightMm: formData.formatC || undefined,
        }],
      };
      return apiRequest("POST", "/api/sd/orders", orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: t.created });
      setFormData({
        papkaNo: "",
        mijozNomi: "",
        customerId: "",
        mahsulotNomi: "",
        productId: "",
        mahsulotTuri: "",
        vidZakaza: "",
        zakazFormy: "new",
        tiraj: 0,
        krasok: "1+0",
        narx: 0,
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
        return !!(formData.mijozNomi && formData.customerId && formData.mahsulotNomi && formData.tiraj > 0 && formData.narx > 0);
      default:
        // Steps 2-4 (BOM/material/routing) are optional context: this wizard submits a
        // bespoke custom-spec job (owner decision 2026-07-13, see createOrderMutation
        // comment above) that never depends on product_id/BOM binding. Gating on
        // selectedBomId here permanently blocked order creation whenever bom_headers
        // was empty (e.g. right after the 2026-07-11 full DB reset) since there was no
        // way to ever satisfy the gate — the sole canonical entry point was unusable.
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
    // L-07: Yetarli bo'lmagan materiallar bo'lsa tasdiqlash so'rash
    if (insufficientCount > 0) {
      const confirmed = window.confirm(
        `${insufficientCount} ta material yetarli emas. Shunga qaramasdan buyurtma yaratmoqchimisiz?`
      );
      if (!confirmed) return;
    }
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
