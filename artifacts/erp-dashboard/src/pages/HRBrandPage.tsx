import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Plus,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface Review {
  name: string;
  position: string;
  text: string;
  rating: number;
}

interface BrandData {
  presentation: { goal: string; values: string; mission: string };
  channels: { telegram: string; instagram: string; linkedin: string; olx: string };
  benefits: string[];
  reviews: Review[];
  stats: { employees_count: string; avg_tenure: string; growth_percent: string };
  vacancy_template: string;
}

interface PortretData {
  position_name_variants?: string;
  main_purpose?: string;
  main_duties?: string;
  expected_result?: string;
  professional_skills?: string;
  experience_field?: string;
  education_req?: string;
  age_min?: number;
  age_max?: number;
  gender?: string;
  salary_min?: number;
  salary_max?: number;
  work_schedule?: string;
  social_package?: string[];
  candidate_presentation?: { kompaniya_taqdimoti?: string };
  danger_candidate?: string;
}

interface OrgNode {
  id: number;
  name: string;
}

const EMPTY_BRAND: BrandData = {
  presentation: { goal: "", values: "", mission: "" },
  channels: { telegram: "", instagram: "", linkedin: "", olx: "" },
  benefits: [],
  reviews: [],
  stats: { employees_count: "", avg_tenure: "", growth_percent: "" },
  vacancy_template: "",
};

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value?.length ?? 0;
  return (
    <span className={`text-xs ${len > max * 0.9 ? "text-red-500" : "text-gray-400"}`}>
      {len}/{max}
    </span>
  );
}

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
      apiRequest("PUT", "/api/hr/brand-settings", { brand_data: brandData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/brand-settings"] });
      toast({ title: "Saqlandi", description: "HR Brend ma'lumotlari muvaffaqiyatli saqlandi." });
    },
    onError: () => {
      toast({ title: "Xato", description: "Saqlashda xato yuz berdi.", variant: "destructive" });
    },
  });

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

    const benefits = brand.benefits.length
      ? brand.benefits?.map((b) => `• ${b}`).join("\n")
      : "";
    const mission = brand.presentation.mission ?? "";
    const values = brand.presentation.values ?? "";

    const lines: string[] = [];
    lines.push(`📋 VAKANSIYA: ${positionName.toUpperCase()}`);
    lines.push("");

    if (portret?.main_purpose) {
      lines.push(`🎯 Lavozim maqsadi:`);
      lines.push(portret.main_purpose);
      lines.push("");
    }

    if (mission || values) {
      lines.push(`🏢 Kompaniya haqida:`);
      if (mission) lines.push(mission);
      if (values) lines.push(`Qadriyatlar: ${values}`);
      lines.push("");
    }

    if (portret?.main_duties) {
      lines.push(`📌 Asosiy vazifalar (Funksional):`);
      portret.main_duties
        .split(/\n|;/)
        .map((d) => d.trim())
        .filter(Boolean)
        .forEach((d) => lines.push(`• ${d}`));
      lines.push("");
    }

    if (portret?.expected_result) {
      lines.push(`✅ Kutilayotgan natija:`);
      lines.push(portret.expected_result);
      lines.push("");
    }

    const reqs: string[] = [];
    if (portret?.education_req) reqs.push(`Ta'lim: ${portret.education_req}`);
    if (portret?.experience_field) reqs.push(`Tajriba: ${portret.experience_field}`);
    if (portret?.age_min || portret?.age_max) {
      const ageStr =
        portret.age_min && portret.age_max
          ? `${portret.age_min}–${portret.age_max} yosh`
          : portret.age_min
          ? `${portret.age_min}+ yosh`
          : `${portret.age_max} yoshgacha`;
      reqs.push(`Yosh: ${ageStr}`);
    }
    if (portret?.gender) reqs.push(`Jins: ${portret.gender}`);
    if (portret?.professional_skills) {
      reqs.push(`Kasb ko'nikmalari: ${portret.professional_skills}`);
    }

    if (reqs.length > 0) {
      lines.push(`📋 Talablar:`);
      (reqs ?? []).forEach((r) => lines.push(`• ${r}`));
      lines.push("");
    }

    const conditions: string[] = [];
    if (portret?.salary_min || portret?.salary_max) {
      const salStr =
        portret.salary_min && portret.salary_max
          ? `${portret.salary_min.toLocaleString()}–${portret.salary_max.toLocaleString()} UZS`
          : portret.salary_min
          ? `${portret.salary_min.toLocaleString()}+ UZS`
          : `${portret.salary_max?.toLocaleString()} UZS gacha`;
      conditions.push(`Maosh: ${salStr}`);
    }
    if (portret?.work_schedule) conditions.push(`Ish tartibi: ${portret.work_schedule}`);
    if (portret?.social_package?.length) {
      conditions.push(`Ijtimoiy paket: ${portret.social_package.join(", ")}`);
    }
    if (benefits) {
      conditions.push(`Kompaniya afzalliklari:\n${benefits}`);
    }

    if (conditions.length > 0) {
      lines.push(`💼 Ish sharoitlari:`);
      (conditions ?? []).forEach((c) => lines.push(c.includes("\n") ? c : `• ${c}`));
      lines.push("");
    }

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
    lines.push(
      `#vakansiya #${positionName.toLowerCase().replace(/[\s\/\\]/g, "")} #ish`
    );

    const text = lines.join("\n");
    setBrand((prev) => ({ ...prev, vacancy_template: text }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Yuklanmoqda...
      </div>
    );
  }

  const orgNodes: OrgNode[] = nodesData?.data ?? [];

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
        <TabsList className="grid grid-cols-6 w-full">
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

        {/* Tab 1: Kompaniya taqdimoti */}
        <TabsContent value="presentation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Kompaniya Taqdimoti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Maqsad (Goal)</Label>
                  <CharCounter value={brand.presentation.goal} max={500} />
                </div>
                <Textarea
                  rows={3}
                  placeholder="Kompaniyaning asosiy maqsadini kiriting..."
                  value={brand.presentation.goal}
                  onChange={(e) =>
                    setBrand((prev) => ({
                      ...prev,
                      presentation: { ...prev.presentation, goal: e.target.value },
                    }))
                  }
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Qadriyatlar (Values)</Label>
                  <CharCounter value={brand.presentation.values} max={500} />
                </div>
                <Textarea
                  rows={3}
                  placeholder="Kompaniya qadriyatlarini kiriting..."
                  value={brand.presentation.values}
                  onChange={(e) =>
                    setBrand((prev) => ({
                      ...prev,
                      presentation: { ...prev.presentation, values: e.target.value },
                    }))
                  }
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Missiya (Mission)</Label>
                  <CharCounter value={brand.presentation.mission} max={500} />
                </div>
                <Textarea
                  rows={3}
                  placeholder="Kompaniyaning missiyasini kiriting..."
                  value={brand.presentation.mission}
                  onChange={(e) =>
                    setBrand((prev) => ({
                      ...prev,
                      presentation: { ...prev.presentation, mission: e.target.value },
                    }))
                  }
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Kanal kontent */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600" />
                Kanal Kontent Shablonlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {(["telegram", "instagram", "linkedin", "olx"] as const).map((channel) => {
                const labels: Record<string, string> = {
                  telegram: "Telegram",
                  instagram: "Instagram",
                  linkedin: "LinkedIn",
                  olx: "OLX",
                };
                const placeholders: Record<string, string> = {
                  telegram: "Telegram uchun vakansiya e'loni shabloni...",
                  instagram: "Instagram uchun qisqa va rasmli post matni...",
                  linkedin: "LinkedIn uchun professional e'lon matni...",
                  olx: "OLX uchun batafsil vakansiya e'loni...",
                };
                return (
                  <div key={channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">{labels[channel]}</Label>
                      <CharCounter value={brand.channels[channel]} max={1000} />
                    </div>
                    <Textarea
                      rows={4}
                      placeholder={placeholders[channel]}
                      value={brand.channels[channel]}
                      onChange={(e) =>
                        setBrand((prev) => ({
                          ...prev,
                          channels: { ...prev.channels, [channel]: e.target.value },
                        }))
                      }
                      maxLength={1000}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Afzalliklar */}
        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Kompaniya Afzalliklari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                "Bizda nima yaxshi?" — xodimlar uchun afzalliklar ro'yxati
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder='Masalan: "Erkin jadval", "Korporativ tadbirlar"'
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBenefit();
                    }
                  }}
                />
                <Button onClick={addBenefit} variant="outline" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Qo'shish
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-gray-50">
                {brand.benefits.length === 0 && (
                  <span className="text-sm text-gray-400 self-center">
                    Hali afzalliklar qo'shilmagan
                  </span>
                )}
                {(Array.isArray(brand.benefits) ? brand.benefits : []).map((benefit, i) => (
                  <Badge
                    key={`k-${i}`}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1 text-sm"
                  >
                    {benefit}
                    <button
                      onClick={() => removeBenefit(i)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Xodimlar sharhlari */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Xodimlar Sharhlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Ichki yig'ilgan xodimlar sharhlari (reyting 1–5)
              </p>
              <Button onClick={addReview} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Sharh qo'shish
              </Button>

              <div className="space-y-4">
                {brand.reviews.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Hali sharhlar qo'shilmagan
                  </p>
                )}
                {(Array.isArray(brand.reviews) ? brand.reviews : []).map((review, i) => (
                  <Card key={`k-${i}`} className="border border-gray-200">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">#{i + 1} Sharh</span>
                        <button
                          onClick={() => removeReview(i)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Ism</Label>
                          <Input
                            placeholder="Xodim ismi"
                            value={review.name}
                            onChange={(e) => updateReview(i, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Lavozim</Label>
                          <Input
                            placeholder="Lavozim"
                            value={review.position}
                            onChange={(e) => updateReview(i, "position", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Sharh matni</Label>
                        <Textarea
                          rows={2}
                          placeholder="Xodim sharhi..."
                          value={review.text}
                          onChange={(e) => updateReview(i, "text", e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Reyting (1–5)</Label>
                        <div className="flex items-center gap-2">
                          {([1, 2, 3, 4, 5]).map((star) => (
                            <button
                              key={star}
                              onClick={() => updateReview(i, "rating", star)}
                              className={`text-xl transition-colors ${
                                star <= review.rating ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="text-sm text-gray-500 ml-1">{review.rating}/5</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Raqamlar */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Kompaniya Statistikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Employer brending uchun asosiy raqamlar
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Xodimlar soni</Label>
                  <Input
                    placeholder="Masalan: 250"
                    value={brand.stats.employees_count}
                    onChange={(e) =>
                      setBrand((prev) => ({
                        ...prev,
                        stats: { ...prev.stats, employees_count: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>O'rtacha ish staji (yil)</Label>
                  <Input
                    placeholder="Masalan: 3.5"
                    value={brand.stats.avg_tenure}
                    onChange={(e) =>
                      setBrand((prev) => ({
                        ...prev,
                        stats: { ...prev.stats, avg_tenure: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>O'sish foizi (%)</Label>
                  <Input
                    placeholder="Masalan: 15"
                    value={brand.stats.growth_percent}
                    onChange={(e) =>
                      setBrand((prev) => ({
                        ...prev,
                        stats: { ...prev.stats, growth_percent: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              {(brand.stats.employees_count || brand.stats.avg_tenure || brand.stats.growth_percent) && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {brand.stats.employees_count && (
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {brand.stats.employees_count}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">Xodimlar</div>
                    </div>
                  )}
                  {brand.stats.avg_tenure && (
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {brand.stats.avg_tenure} yil
                      </div>
                      <div className="text-xs text-green-600 mt-1">O'rtacha staj</div>
                    </div>
                  )}
                  {brand.stats.growth_percent && (
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-700">
                        {brand.stats.growth_percent}%
                      </div>
                      <div className="text-xs text-orange-600 mt-1">O'sish</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Vakansiya e'lon shabloni */}
        <TabsContent value="vacancy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Vakansiya E'lon Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Org tuzilmasidagi lavozim (portret) ma'lumotlaridan avtomatik vakansiya matni
                generatsiya qilinadi. HR Brend ma'lumotlari (missiya, qadriyatlar, afzalliklar)
                avtomatik qo'shiladi.
              </p>

              <div className="space-y-2">
                <Label>Lavozim portretini tanlang</Label>
                <Select value={selectedNodeId} onValueChange={setSelectedNodeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bo'lim/lavozimni tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(orgNodes) ? orgNodes : []).map((node) => (
                      <SelectItem key={node.id} value={String(node.id)}>
                        {node.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedNodeId && portretData?.portret?.portret_data && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm space-y-1">
                  <p className="font-medium text-blue-800">Portret ma'lumotlari topildi:</p>
                  {portretData.portret.portret_data.main_purpose && (
                    <p className="text-blue-700">
                      Maqsad: {portretData.portret.portret_data.main_purpose.slice(0, 80)}...
                    </p>
                  )}
                  {portretData.portret.portret_data.main_duties && (
                    <p className="text-blue-700">
                      Vazifalar: {portretData.portret.portret_data.main_duties.slice(0, 80)}...
                    </p>
                  )}
                </div>
              )}

              {selectedNodeId && !portretLoading && !portretData?.portret && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                  Bu lavozim uchun portret ma'lumotlari topilmadi. HR Brend asosiy
                  ma'lumotlaridan foydalaniladi.
                </div>
              )}

              <Button
                onClick={generateVacancyFromPortret}
                disabled={portretLoading}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {portretLoading ? "Yuklanmoqda..." : "Generatsiya qilish"}
              </Button>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>E'lon matni</Label>
                  <CharCounter value={brand.vacancy_template} max={3000} />
                </div>
                <Textarea
                  rows={16}
                  placeholder="Generatsiya tugmasini bosing yoki qo'lda kiriting..."
                  value={brand.vacancy_template}
                  onChange={(e) =>
                    setBrand((prev) => ({ ...prev, vacancy_template: e.target.value }))
                  }
                  maxLength={3000}
                  className="font-mono text-sm"
                />
              </div>

              {brand.vacancy_template && (
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(brand.vacancy_template);
                    toast({
                      title: "Nusxalandi",
                      description: "E'lon matni clipboard ga nusxalandi.",
                    });
                  }}
                  className="gap-2"
                >
                  Matnni nusxalash
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
