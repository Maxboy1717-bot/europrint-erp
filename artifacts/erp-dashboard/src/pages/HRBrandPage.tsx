/** @module HRBrandPage @description React page component. Route-level UI for HR Brand management (Material №59). Orchestrates state, queries, and mutations; delegates tab rendering to HRBrandPageTabs. */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Building2,
  Megaphone,
  Star,
  MessageSquare,
  BarChart3,
  FileText,
  Save,
  RefreshCw,
} from "lucide-react";
import { BrandData, OrgNode, PortretData, Review, EMPTY_BRAND } from "./HRBrandPageTypes";
import {
  PresentationTab,
  ChannelsTab,
  BenefitsTab,
  ReviewsTab,
  StatsTab,
  VacancyTab,
} from "./HRBrandPageTabs";

export default function HRBrandPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [brand, setBrand] = useState<BrandData>(EMPTY_BRAND);
  const [newBenefit, setNewBenefit] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");

  const { data, isLoading } = useQuery<{ brand_data: BrandData }>({
    queryKey: ["/api/hr/brand-settings"],
  });

  useEffect(() => {
    if (data?.brand_data) {
      setBrand({ ...EMPTY_BRAND, ...data.brand_data });
    }
  }, [data]);

  const { data: nodesData } = useQuery<{ data: OrgNode[] }>({
    queryKey: ["/api/org-structure/nodes/flat"],
  });

  const { data: portretData, isLoading: portretLoading } = useQuery<{
    portret: { portret_data: PortretData } | null;
  }>({
    queryKey: [`/api/org-structure/nodes/${selectedNodeId}/portret`],
    enabled: Boolean(selectedNodeId),
  });

  const saveMutation = useMutation({
    mutationFn: (brandData: BrandData) =>
      apiRequest("PATCH", "/api/hr/brand-settings", { brand_data: brandData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/brand-settings"] });
      toast({ title: "Saqlandi", description: "HR Brend ma'lumotlari muvaffaqiyatli saqlandi." });
    },
    onError: () => {
      toast({ title: "Xato", description: "Saqlashda xato yuz berdi.", variant: "destructive" });
    },
  });

  // --- handlers ---

  const handleSave = () => saveMutation.mutate(brand);

  const addBenefit = () => {
    const trimmed = newBenefit.trim();
    if (!trimmed) return;
    setBrand((prev) => ({ ...prev, benefits: [...prev.benefits, trimmed] }));
    setNewBenefit("");
  };

  const removeBenefit = (index: number) => {
    setBrand((prev) => ({
      ...prev,
      benefits: prev.benefits?.filter((_, i) => i !== index),
    }));
  };

  const addReview = () => {
    setBrand((prev) => ({
      ...prev,
      reviews: [...prev.reviews, { name: "", position: "", text: "", rating: 5 }],
    }));
  };

  const updateReview = (index: number, field: keyof Review, value: string | number) => {
    setBrand((prev) => {
      const reviews = [...prev.reviews];
      reviews[index] = { ...reviews[index], [field]: value };
      return { ...prev, reviews };
    });
  };

  const removeReview = (index: number) => {
    setBrand((prev) => ({ ...prev, reviews: prev.reviews?.filter((_, i) => i !== index) }));
  };

  const generateVacancyFromPortret = () => {
    const portret = portretData?.portret?.portret_data;
    const selectedNode = nodesData?.data?.find((n) => String(n.id) === selectedNodeId);
    const positionName = selectedNode?.name ?? "Lavozim";
    const benefits = brand.benefits.length ? brand.benefits?.map((b) => `• ${b}`).join("\n") : "";
    const mission = brand.presentation.mission ?? "";
    const values = brand.presentation.values ?? "";
    const lines: string[] = [];
    lines.push(`📋 VAKANSIYA: ${positionName.toUpperCase()}`);
    lines.push("");
    if (portret?.main_purpose) { lines.push(`🎯 Lavozim maqsadi:`); lines.push(portret.main_purpose); lines.push(""); }
    if (mission || values) {
      lines.push(`🏢 Kompaniya haqida:`);
      if (mission) lines.push(mission);
      if (values) lines.push(`Qadriyatlar: ${values}`);
      lines.push("");
    }
    if (portret?.main_duties) {
      lines.push(`📌 Asosiy vazifalar (Funksional):`);
      portret.main_duties.split(/\n|;/).map((d) => d.trim()).filter(Boolean).forEach((d) => lines.push(`• ${d}`));
      lines.push("");
    }
    if (portret?.expected_result) { lines.push(`✅ Kutilayotgan natija:`); lines.push(portret.expected_result); lines.push(""); }
    const reqs: string[] = [];
    if (portret?.education_req) reqs.push(`Ta'lim: ${portret.education_req}`);
    if (portret?.experience_field) reqs.push(`Tajriba: ${portret.experience_field}`);
    if (portret?.age_min || portret?.age_max) {
      const ageStr = portret.age_min && portret.age_max
        ? `${portret.age_min}–${portret.age_max} yosh`
        : portret.age_min ? `${portret.age_min}+ yosh` : `${portret.age_max} yoshgacha`;
      reqs.push(`Yosh: ${ageStr}`);
    }
    if (portret?.gender) reqs.push(`Jins: ${portret.gender}`);
    if (portret?.professional_skills) reqs.push(`Kasb ko'nikmalari: ${portret.professional_skills}`);
    if (reqs.length > 0) { lines.push(`📋 Talablar:`); (Array.isArray(reqs) ? reqs : []).forEach((r) => lines.push(`• ${r}`)); lines.push(""); }
    const conditions: string[] = [];
    if (portret?.salary_min || portret?.salary_max) {
      const salStr = portret.salary_min && portret.salary_max
        ? `${portret.salary_min.toLocaleString()}–${portret.salary_max.toLocaleString()} UZS`
        : portret.salary_min ? `${portret.salary_min.toLocaleString()}+ UZS` : `${portret.salary_max?.toLocaleString()} UZS gacha`;
      conditions.push(`Maosh: ${salStr}`);
    }
    if (portret?.work_schedule) conditions.push(`Ish tartibi: ${portret.work_schedule}`);
    if (portret?.social_package?.length) conditions.push(`Ijtimoiy paket: ${portret.social_package.join(", ")}`);
    if (benefits) conditions.push(`Kompaniya afzalliklari:\n${benefits}`);
    if (conditions.length > 0) { lines.push(`💼 Ish sharoitlari:`); (Array.isArray(conditions) ? conditions : []).forEach((c) => lines.push(c.includes("\n") ? c : `• ${c}`)); lines.push(""); }
    if (brand.stats.employees_count) {
      lines.push(`📊 Kompaniya haqida raqamlar:`);
      lines.push(`• Xodimlar: ${brand.stats.employees_count} kishi`);
      if (brand.stats.avg_tenure) lines.push(`• O'rtacha staj: ${brand.stats.avg_tenure} yil`);
      if (brand.stats.growth_percent) lines.push(`• O'sish: ${brand.stats.growth_percent}%`);
      lines.push("");
    }
    lines.push(`📩 Murojaat qiling:`);
    lines.push(`Rezyumeyingizni Telegram yoki email orqali yuboring.`);
    lines.push("");
    lines.push(`#vakansiya #${positionName.toLowerCase().replace(/[\s\/\\]/g, "")} #ish`);
    setBrand((prev) => ({ ...prev, vacancy_template: lines.join("\n") }));
  };

  const handleCopyVacancy = () => {
    navigator.clipboard.writeText(brand.vacancy_template);
    toast({ title: "Nusxalandi", description: "E'lon matni clipboard ga nusxalandi." });
  };

  // --- loading guard ---

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Yuklanmoqda...
      </div>
    );
  }

  const orgNodes: OrgNode[] = nodesData?.data ?? [];

  // --- render ---

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Brend</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kompaniya employer brand strategiyasini boshqarish (Material №59)
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>

      <Tabs defaultValue="presentation" className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full">
          <TabsTrigger value="presentation" className="flex items-center gap-1 text-xs">
            <Building2 className="w-3 h-3" />
            <span className="hidden sm:inline">Taqdimot</span>
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-1 text-xs">
            <Megaphone className="w-3 h-3" />
            <span className="hidden sm:inline">Kanallar</span>
          </TabsTrigger>
          <TabsTrigger value="benefits" className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3" />
            <span className="hidden sm:inline">Afzalliklar</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-1 text-xs">
            <MessageSquare className="w-3 h-3" />
            <span className="hidden sm:inline">Sharhlar</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1 text-xs">
            <BarChart3 className="w-3 h-3" />
            <span className="hidden sm:inline">Raqamlar</span>
          </TabsTrigger>
          <TabsTrigger value="vacancy" className="flex items-center gap-1 text-xs">
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">Vakansiya</span>
          </TabsTrigger>
        </TabsList>

        <PresentationTab brand={brand} setBrand={setBrand} />
        <ChannelsTab brand={brand} setBrand={setBrand} />
        <BenefitsTab
          brand={brand}
          newBenefit={newBenefit}
          setNewBenefit={setNewBenefit}
          onAdd={addBenefit}
          onRemove={removeBenefit}
        />
        <ReviewsTab
          brand={brand}
          onAdd={addReview}
          onUpdate={updateReview}
          onRemove={removeReview}
        />
        <StatsTab brand={brand} setBrand={setBrand} />
        <VacancyTab
          brand={brand}
          setBrand={setBrand}
          orgNodes={orgNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          portretData={portretData}
          portretLoading={portretLoading}
          onGenerate={generateVacancyFromPortret}
          onCopy={handleCopyVacancy}
        />
      </Tabs>
    </div>
  );
}
