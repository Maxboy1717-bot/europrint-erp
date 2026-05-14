/** @module HRBrandPageTabsB @description Tab panel components 4–6 for HRBrandPage: Reviews, Stats, Vacancy generator. */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, BarChart3, FileText, Plus, X, Sparkles } from "lucide-react";
import { BrandData, OrgNode, PortretData } from "./HRBrandPageTypes";
import { CharCounter } from "./HRBrandPageHelpers";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Tab 4 — Xodimlar Sharhlari
// ---------------------------------------------------------------------------

interface ReviewsTabProps {
  brand: BrandData;
  onAdd: () => void;
  onUpdate: (index: number, field: "name" | "position" | "text" | "rating", value: string | number) => void;
  onRemove: (index: number) => void;
}

export function ReviewsTab({ brand, onAdd, onUpdate, onRemove }: ReviewsTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="reviews">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--ep-green)]" />
            {t("xodimlarSharhlari")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Ichki yig'ilgan xodimlar sharhlari (reyting 1–5)
          </p>
          <Button onClick={onAdd} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            {t("sharhQoshish")}
          </Button>
          <div className="space-y-4">
            {brand.reviews.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                {t("haliSharhlarQoshilmagan")}
              </p>
            )}
            {(Array.isArray(brand.reviews) ? brand.reviews : []).map((review, i) => (
              <Card key={`k-${i}`} className="border border-gray-200">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">#{i + 1} Sharh</span>
                    <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("ism1")}</Label>
                      <Input
                        placeholder={t("xodimIsmi")}
                        value={review.name}
                        onChange={(e) => onUpdate(i, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("lavozim1")}</Label>
                      <Input
                        placeholder={t("lavozim1")}
                        value={review.position}
                        onChange={(e) => onUpdate(i, "position", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("sharhMatni")}</Label>
                    <Textarea
                      rows={2}
                      placeholder={t("xodimSharhi")}
                      value={review.text}
                      onChange={(e) => onUpdate(i, "text", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reyting (1–5)</Label>
                    <div className="flex items-center gap-2">
                      {([1, 2, 3, 4, 5]).map((star) => (
                        <button
                          key={star}
                          onClick={() => onUpdate(i, "rating", star)}
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
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Statistika
// ---------------------------------------------------------------------------

interface StatsTabProps {
  brand: BrandData;
  setBrand: React.Dispatch<React.SetStateAction<BrandData>>;
}

export function StatsTab({ brand, setBrand }: StatsTabProps) {
  return (
    <TabsContent value="stats">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--ep-primary)]" />
            {t("kompaniyaStatistikasi")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">{t("employerBrendingUchunAsosiyRaqamlar")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
          <Label>{t("xodimlarSoni")}</Label>
              <Input
                placeholder={t("masalan250")}
                value={brand.stats.employees_count}
                onChange={(e) =>
                  setBrand((prev) => ({ ...prev, stats: { ...prev.stats, employees_count: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1">
          <Label>O'rtacha ish staji (yil)</Label>
              <Input
                placeholder={t("masalan35")}
                value={brand.stats.avg_tenure}
                onChange={(e) =>
                  setBrand((prev) => ({ ...prev, stats: { ...prev.stats, avg_tenure: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1">
          <Label>O'sish foizi (%)</Label>
              <Input
                placeholder={t("masalan15")}
                value={brand.stats.growth_percent}
                onChange={(e) =>
                  setBrand((prev) => ({ ...prev, stats: { ...prev.stats, growth_percent: e.target.value } }))
                }
              />
            </div>
          </div>
          {(brand.stats.employees_count || brand.stats.avg_tenure || brand.stats.growth_percent) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {brand.stats.employees_count && (
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--ep-blue)]">{brand.stats.employees_count}</div>
                  <div className="text-xs text-[var(--ep-blue)] mt-1">{t("xodimlar")}</div>
                </div>
              )}
              {brand.stats.avg_tenure && (
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--ep-green)]">{brand.stats.avg_tenure} yil</div>
                  <div className="text-xs text-[var(--ep-green)] mt-1">{t("ortachaStaj")}</div>
                </div>
              )}
              {brand.stats.growth_percent && (
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--ep-primary)]">{brand.stats.growth_percent}%</div>
                  <div className="text-xs text-[var(--ep-primary)] mt-1">{t("osish")}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// Tab 6 — Vakansiya E'lon Generator
// ---------------------------------------------------------------------------

interface VacancyTabProps {
  brand: BrandData;
  setBrand: React.Dispatch<React.SetStateAction<BrandData>>;
  orgNodes: OrgNode[];
  selectedNodeId: string;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string>>;
  portretData: { portret: { portret_data: PortretData } | null } | undefined;
  portretLoading: boolean;
  onGenerate: () => void;
  onCopy: () => void;
}

export function VacancyTab({
  brand,
  setBrand,
  orgNodes,
  selectedNodeId,
  setSelectedNodeId,
  portretData,
  portretLoading,
  onGenerate,
  onCopy,
}: VacancyTabProps) {
  return (
    <TabsContent value="vacancy">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--ep-blue)]" />
            {t("vakansiyaElonGenerator")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Org tuzilmasidagi lavozim (portret) ma'lumotlaridan avtomatik vakansiya matni
            generatsiya qilinadi. HR Brend ma'lumotlari (missiya, qadriyatlar, afzalliklar)
            avtomatik qo'shiladi.
          </p>
          <div className="space-y-1">
          <Label>{t("lavozimPortretiniTanlang")}</Label>
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
              <p className="font-medium text-blue-800">{t("portretMalumotlariTopildi")}</p>
              {portretData.portret.portret_data.main_purpose && (
                <p className="text-[var(--ep-blue)]">
                  Maqsad: {portretData.portret.portret_data.main_purpose.slice(0, 80)}...
                </p>
              )}
              {portretData.portret.portret_data.main_duties && (
                <p className="text-[var(--ep-blue)]">
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
          <Button onClick={onGenerate} disabled={portretLoading} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {portretLoading ? "Yuklanmoqda..." : "Generatsiya qilish"}
          </Button>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("elonMatni")}</Label>
              <CharCounter value={brand.vacancy_template} max={3000} />
            </div>
            <Textarea
              rows={16}
              placeholder={t("generatsiyaTugmasiniBosingYokiQolda")}
              value={brand.vacancy_template}
              onChange={(e) =>
                setBrand((prev) => ({ ...prev, vacancy_template: e.target.value }))
              }
              maxLength={3000}
              className="font-mono text-sm"
            />
          </div>
          {brand.vacancy_template && (
            <Button variant="outline" onClick={onCopy} className="gap-2">
              {t("matnniNusxalash")}
            </Button>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
