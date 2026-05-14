/**
 * @module SDSettings
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RotateCcw } from "lucide-react";
import { fmt } from "@/lib/sd-helpers";
import { EPPageHeader } from "@/components/ep";

const SETTING_GROUPS = [
  {
    title: "Qog'oz turlari narxi (so'm / m²)",
    fields: [
      { key: "paperBPrice", label: "B-flute 3mm", hint: "Eng ko'p ishlatiladigan tur" },
      { key: "paperCPrice", label: "C-flute 4mm", hint: "O'rta og'ir yuklash" },
      { key: "paperBcPrice", label: "BC-flute 7mm (ikki qavat)", hint: "Og'ir tovarlar uchun" },
      { key: "paperEPrice", label: "E-flute 1.5mm (ingichka)", hint: "Display va yengil qutular" },
    ],
  },
  {
    title: "Bosma narxi (so'm / 1000 dona)",
    fields: [
      { key: "print1ColorPrice", label: "1 rang bosma", hint: "Oddiy bir rangli" },
      { key: "print2ColorPrice", label: "2 rang bosma", hint: "Ikki rangli" },
      { key: "print4ColorPrice", label: "4 rang / to'liq rang (CMYK)", hint: "Foto sifatli bosma" },
    ],
  },
  {
    title: "Uskunalar narxi (so'm)",
    fields: [
      { key: "plateCostPerColor", label: "Plastina narxi (1 rang)", hint: "Har bir rang uchun alohida plastina" },
      { key: "dieCostNew", label: "Yangi qolip narxi", hint: "Birinchi marta qolip qilganda" },
    ],
  },
  {
    title: "Qo'shimcha ishlovlar (so'm / 1000 dona)",
    fields: [
      { key: "laminationPrice", label: "Laminatsiya", hint: "Yuzani himoya qilish" },
      { key: "embossingPrice", label: "Bo'rtma (kongreve)", hint: "Relief naqsh" },
      { key: "perforationPrice", label: "Perforatsiya", hint: "Teshish" },
    ],
  },
  {
    title: "Yetkazib berish",
    fields: [
      { key: "deliveryBaseCost", label: "Standart yetkazish (so'm)", hint: "Toshkent shahar ichida" },
    ],
  },
  {
    title: "Ombor-ijara",
    fields: [
      { key: "storageFreedays", label: "Bepul kunlar soni", hint: "Standart 8 kun" },
      { key: "storageDailyRate", label: "Kunlik tarif (so'm/m²/kun)", hint: "8 kundan keyin" },
    ],
  },
  {
    title: "Moliyaviy sozlamalar (%)",
    fields: [
      { key: "defaultMarkupPercent", label: "Ustama foizi", hint: "Tannarxdan qo'shimcha %" },
      { key: "vatRate", label: "QQS foizi", hint: "Standart 12%" },
    ],
  },
];

export default function SDSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/sd/price-formulas"],
  });

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [changed, setChanged] = useState<Set<string>>(new Set());

  const saveMut = useMutation({
    mutationFn: (body: Record<string, number>) =>
      apiRequest("PUT", "/api/sd/price-formulas", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/price-formulas"] });
      setChanged(new Set());
      setLocalValues({});
      toast({ title: "Sozlamalar saqlandi" });
    },
    onError: () => toast({ title: "Saqlashda xatolik", variant: "destructive" }),
  });

  function getValue(key: string): string {
    if (key in localValues) return localValues[key];
    return String(settings?.[key] ?? "");
  }

  function handleChange(key: string, val: string) {
    setLocalValues(prev => ({ ...prev, [key]: val }));
    setChanged(prev => new Set(prev).add(key));
  }

  function handleSave() {
    const body: Record<string, number> = {};
    for (const key of changed) {
      const v = parseFloat(localValues[key]);
      if (!isNaN(v)) body[key] = v;
    }
    if (Object.keys(body).length === 0) {
      toast({ title: "O'zgarishlar yo'q" });
      return;
    }
    saveMut.mutate(body);
  }

  function handleReset() {
    setLocalValues({});
    setChanged(new Set());
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <div className="text-center py-12 text-[13px] text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">CRM & Sotuv Sozlamalari</b></>}
        title="CRM & Sotuv Sozlamalari"
        subtitle="Narx formulasi parametrlari — faqat super admin o'zgartiradi"
      />
        </div>
        <div className="flex gap-3">
          {changed.size > 0 && (
            <Button 
              variant="outline" 
              onClick={handleReset} 
              data-testid="btn-reset-settings"
              className="rounded-lg border-border text-foreground hover:bg-muted gap-2"
            >
              <RotateCcw className="w-4 h-4" />Bekor
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saveMut.isPending || changed.size === 0}
            data-testid="btn-save-settings"
            className="bg-primary text-white rounded-lg px-6 shadow-sm gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMut.isPending ? "Saqlanmoqda..." : `Saqlash${changed.size > 0 ? ` (${changed.size})` : ""}`}
          </Button>
        </div>
      </div>

      {changed.size > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary font-medium flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {changed.size} ta o'zgarish saqlanmagan. "Saqlash" tugmasini bosing.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Array.isArray(SETTING_GROUPS) ? SETTING_GROUPS : []).map(group => (
          <Card key={group.title} className="bg-card border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-muted/40/50">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {(Array.isArray(group.fields) ? group.fields : []).map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <Label className="text-sm font-semibold text-foreground">{field.label}</Label>
                      {field.hint && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">
                          {field.hint}
                        </span>
                      )}
                    </div>
                    
                    <div className="relative">
                      <Input
                        type="number"
                        value={getValue(field.key)}
                        onChange={e => handleChange(field.key, e.target.value)}
                        className={`rounded-lg border-border bg-background focus:ring-primary/20 ${
                          changed.has(field.key) ? "border-primary ring-1 ring-primary/20 bg-primary/5" : ""
                        }`}
                        data-testid={`input-${field.key}`}
                        min={0}
                      />
                      {changed.has(field.key) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">O'zgardi</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                    
                    {settings?.[field.key] !== undefined && changed.has(field.key) && (
                      <p className="text-[11px] font-medium text-muted-foreground mt-1">
                        Avvalgi qiymat: <span className="text-foreground">{fmt(settings[field.key])} so'm</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-6 bg-muted/40 rounded-xl border border-border/30 space-y-3">
        <div className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          Eslatma
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <li className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-xl border border-border/20">
            <span className="font-bold text-primary block mb-1">Mavjud ma'lumotlar:</span>
            Sozlamalar o'zgarganda mavjud taklifnomalar va buyurtmalar ta'sirlanmaydi
          </li>
          <li className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-xl border border-border/20">
            <span className="font-bold text-primary block mb-1">Yangi hisob-kitoblar:</span>
            Faqat yangi taklifnomalar yangi narxlar bilan hisoblanadi
          </li>
          <li className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-xl border border-border/20">
            <span className="font-bold text-primary block mb-1">Xavfsizlik:</span>
            Har bir o'zgarish tizimda logga yoziladi (kim, qachon, nimani)
          </li>
        </ul>
      </div>
    </div>
  );
}
