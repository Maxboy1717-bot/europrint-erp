/** @module HRBrandPageTabsA @description Tab panel components 1–3 for HRBrandPage: Presentation, Channels, Benefits. */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Building2, Megaphone, Star, Plus, X } from "lucide-react";
import { BrandData, CHANNEL_LABELS, CHANNEL_PLACEHOLDERS } from "./HRBrandPageTypes";
import { CharCounter } from "./HRBrandPageHelpers";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Tab 1 — Kompaniya Taqdimoti
// ---------------------------------------------------------------------------

interface PresentationTabProps {
  brand: BrandData;
  setBrand: React.Dispatch<React.SetStateAction<BrandData>>;
}

export function PresentationTab({ brand, setBrand }: PresentationTabProps) {
  const { t } = useTranslation("common");
  const fields = [
    { key: "goal" as const, label: "Maqsad (Goal)", placeholder: "Kompaniyaning asosiy maqsadini kiriting..." },
    { key: "values" as const, label: "Qadriyatlar (Values)", placeholder: "Kompaniya qadriyatlarini kiriting..." },
    { key: "mission" as const, label: "Missiya (Mission)", placeholder: "Kompaniyaning missiyasini kiriting..." },
  ];

  return (
    <TabsContent value="presentation">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--ep-blue)]" />
            {t("kompaniyaTaqdimoti")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <CharCounter value={brand.presentation[key]} max={500} />
              </div>
              <Textarea
                rows={3}
                placeholder={placeholder}
                value={brand.presentation[key]}
                onChange={(e) =>
                  setBrand((prev) => ({
                    ...prev,
                    presentation: { ...prev.presentation, [key]: e.target.value },
                  }))
                }
                maxLength={500}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Kanal Kontent Shablonlari
// ---------------------------------------------------------------------------

interface ChannelsTabProps {
  brand: BrandData;
  setBrand: React.Dispatch<React.SetStateAction<BrandData>>;
}

export function ChannelsTab({ brand, setBrand }: ChannelsTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="channels">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[var(--ep-purple)]" />
            {t("kanalKontentShablonlari")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {(["telegram", "instagram", "linkedin", "olx"] as const).map((channel) => (
            <div key={channel} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">{CHANNEL_LABELS[channel]}</Label>
                <CharCounter value={brand.channels[channel]} max={1000} />
              </div>
              <Textarea
                rows={4}
                placeholder={CHANNEL_PLACEHOLDERS[channel]}
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
          ))}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Afzalliklar
// ---------------------------------------------------------------------------

interface BenefitsTabProps {
  brand: BrandData;
  newBenefit: string;
  setNewBenefit: React.Dispatch<React.SetStateAction<string>>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function BenefitsTab({ brand, newBenefit, setNewBenefit, onAdd, onRemove }: BenefitsTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="benefits">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[var(--ep-yellow)]" />
            {t("kompaniyaAfzalliklari")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            "Bizda nima yaxshi?" — xodimlar uchun afzalliklar ro'yxati
          </p>
          <div className="flex gap-2">
            <Input
              placeholder={'Masalan: "Erkin jadval", "Korporativ tadbirlar"'}
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAdd();
                }
              }}
            />
            <Button onClick={onAdd} variant="outline" className="gap-1">
              <Plus className="w-4 h-4" />
              {t("add")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-gray-50">
            {brand.benefits.length === 0 && (
              <span className="text-sm text-gray-400 self-center">
                {t("haliAfzalliklarQoshilmagan")}
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
                  onClick={() => onRemove(i)}
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
  );
}
