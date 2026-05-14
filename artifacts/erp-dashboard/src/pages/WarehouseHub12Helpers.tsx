/**
 * WarehouseHub12Helpers — shared types, configs, and components
 * for the WarehouseHub12 page family.
 */
import { Boxes, Truck, Send, Lock, AlertTriangle, Package, ScrollText, Factory, Trash2, Wrench, Timer, TrendingDown, TrendingUp, Ruler, PackageCheck, Recycle, Hammer, SprayCan, Cog, ShoppingCart, ShieldCheck, CheckCircle2, Users, ArrowRightLeft, RefreshCw, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { warehouseIcons, warehouseColors } from "@/components/wms/hub/helpers";
import type { WarehouseRow } from "@/hooks/useWarehousePosSync";

import { EPLoader } from "@/components/ep";
// ─── 12 qatlam ta'rifi ─────────────────────────────────────────────────────
export const LAYERS = [
  { key: "stock",        label: "Zaxira",          icon: Boxes,         },
  { key: "receiving",    label: "Qabul",            icon: Truck,         },
  { key: "issuing",      label: "Berish",           icon: Send,          },
  { key: "qc",           label: "QC",               icon: ShieldCheck,   },
  { key: "movements",    label: "Harakatlar",       icon: ArrowRightLeft },
  { key: "employees",    label: "Xodimlar",         icon: Users,         },
  { key: "reservations", label: "Bron",             icon: Lock,          },
  { key: "inventory",    label: "Inventarizatsiya", icon: CheckCircle2   },
  { key: "barcodes",     label: "Shtrix-kod",       icon: Boxes,         },
  { key: "reports",      label: "Hisobotlar",       icon: Boxes,         },
  { key: "suppliers",    label: "Ta'minotchilar",   icon: Users,         },
  { key: "history",      label: "Tarix",            icon: Boxes,         },
  { key: "pos-sync",     label: "POS Sync",         icon: Boxes,         },
] as const;

export type LayerKey = typeof LAYERS[number]["key"];

// ─── Ombor turiga xos konfiguratsiya ───────────────────────────────────────
export interface WarehouseTypeConfig {
  description: string;
  defaultTab: LayerKey;
  featuredTabs: LayerKey[];
  kpiLabels: [string, string, string, string];
  kpiIcons: [typeof Boxes, typeof Boxes, typeof Boxes, typeof Boxes];
  kpiColors: [string, string, string, string];
  emptyStockText: string;
  receivingHint: string;
  issuingHint: string;
  qcHint: string;
  specialFeatures: string[];
  typeBadge: string;
  accentColor: string;
}

export const TYPE_CONFIGS: Record<string, WarehouseTypeConfig> = {
  "RM-MAIN": {
    description: "Asosiy xom ashyo ombori — ishlab chiqarish uchun barcha materiallar shu yerda saqlanadi. Yetkazib beruvchilardan keladigan materiallar birinchi bu omborga qabul qilinadi.",
    defaultTab: "stock",
    featuredTabs: ["stock", "receiving", "suppliers", "qc"],
    kpiLabels: ["Xom ashyo turlari", "Yetkazib berishda", "Min. darajadan past", "Xom ashyo qiymati"],
    kpiIcons: [Package, Truck, AlertTriangle, TrendingUp],
    kpiColors: ["text-[var(--ep-blue)]", "text-[var(--ep-blue)]", "text-[var(--ep-primary)]", "text-[var(--ep-green)]"],
    emptyStockText: "Xom ashyo hali kiritilmagan. Yetkazib beruvchidan material qabul qiling.",
    receivingHint: "Yetkazib beruvchilardan kelayotgan xom ashyo partiyalari. GRN (Goods Receipt Note) yarating.",
    issuingHint: "Ishlab chiqarish bo'limlariga xom ashyo berish. Production Order asosida material chiqariladi.",
    qcHint: "Kelgan xom ashyolarni sifat nazoratidan o'tkazish. Lot namunalari test qilinadi.",
    specialFeatures: ["Xom ashyo turi bo'yicha saralash", "Min/Max zaxira darajasi", "Yetkazib beruvchi narxlari", "Lead time monitoring"],
    typeBadge: "Xom Ashyo",
    accentColor: "bg-blue-500",
  },
  "RM-ROLLS": {
    description: "Rulon materiallari ombori — qog'oz, plyonka, vinillar rulonlarda saqlanadi. Har bir rulonning kengligi, uzunligi va og'irligi kuzatiladi.",
    defaultTab: "stock",
    featuredTabs: ["stock", "receiving", "barcodes", "inventory"],
    kpiLabels: ["Rulon turlari", "Jami uzunlik (m)", "Kam qolgan rulonlar", "Rulon qiymati"],
    kpiIcons: [ScrollText, Ruler, AlertTriangle, TrendingUp],
    kpiColors: ["text-[var(--ep-blue)]", "text-[var(--ep-purple)]", "text-[var(--ep-primary)]", "text-[var(--ep-green)]"],
    emptyStockText: "Rulon materiallari hali kiritilmagan. Rulon qabul qilish uchun 'Qabul' tabini bosing.",
    receivingHint: "Kelayotgan rulonlar. Har bir rulonga barcode yopishtiring va o'lchamlarini kiriting.",
    issuingHint: "Kesish (cutting) bo'limiga rulon berish. Buyurtmaga mos kengliklardagi rulonlar tanlanadi.",
    qcHint: "Rulon sifati tekshiruvi — rang, qalinlik, kengligi standartga mos kelishini aniqlash.",
    specialFeatures: ["Rulon o'lchamlari (eni/bo'yi)", "Kesish rejasi (Cutting Plan)", "Rulon barcode tracking", "Qoldiq material hisobi"],
    typeBadge: "Rulonlar",
    accentColor: "bg-indigo-500",
  },
  "FG-MAIN": {
    description: "Tayyor mahsulot ombori — ishlab chiqarish tugagan buyumlar jo'natishga tayyor holda saqlanadi. Buyurtmachi kutayotgan mahsulotlar shu yerda.",
    defaultTab: "stock",
    featuredTabs: ["stock", "issuing", "reservations", "pos-sync"],
    kpiLabels: ["Tayyor mahsulot", "Jo'natishga tayyor", "Bron qilingan", "Mahsulot qiymati"],
    kpiIcons: [PackageCheck, Send, Lock, TrendingUp],
    kpiColors: ["text-[var(--ep-green)]", "text-[var(--ep-green)]", "text-[var(--ep-blue)]", "text-[var(--ep-green)]"],
    emptyStockText: "Tayyor mahsulot hali yo'q. Ishlab chiqarish yakunlangach bu yerga kirim qilinadi.",
    receivingHint: "Ishlab chiqarishdan tayyor mahsulot qabul qilish. QC dan o'tgan partiyalar bu omborga kiritiladi.",
    issuingHint: "Buyurtmachiga jo'natish. Picking list asosida tayyor mahsulot yig'iladi va jo'natiladi.",
    qcHint: "Tayyor mahsulot yakuniy sifat nazorati — buyurtmachi talablariga mos kelishini tekshirish.",
    specialFeatures: ["Jo'natish tayyor partiyalar", "Buyurtmachi bronlari", "Qadoqlash bo'limi", "Yetkazib berish jadvali"],
    typeBadge: "Tayyor Mahsulot",
    accentColor: "bg-emerald-500",
  },
  "WIP-MAIN": {
    description: "Yarim tayyor mahsulot ombori — ishlab chiqarish jarayonidagi materiallar. Bir sexdan ikkinchisiga o'tayotgan yarim tayyor buyumlar shu yerda.",
    defaultTab: "movements",
    featuredTabs: ["movements", "stock", "qc", "barcodes"],
    kpiLabels: ["Jarayondagi partiyalar", "Bosqichlar soni", "Kechikkan partiyalar", "WIP qiymati"],
    kpiIcons: [Factory, ArrowRightLeft, Timer, TrendingUp],
    kpiColors: ["text-[var(--ep-cyan)]", "text-[var(--ep-blue)]", "text-[var(--ep-red)]", "text-[var(--ep-green)]"],
    emptyStockText: "Jarayondagi material yo'q. Ishlab chiqarish buyrug'i yaratilganda WIP avtomatik to'ldiriladi.",
    receivingHint: "Oldingi bosqichdan yarim tayyor mahsulot qabul qilish. Batch raqami bilan kirish.",
    issuingHint: "Keyingi ishlab chiqarish bosqichiga material uzatish. Sex bo'yicha berish.",
    qcHint: "Oraliq sifat nazorati — har bir bosqichdan keyin yarim tayyor mahsulot tekshiriladi.",
    specialFeatures: ["Ishlab chiqarish bosqichlari", "Batch tracking", "Sex bo'yicha harakat", "Production Order bog'lanish"],
    typeBadge: "Yarim Tayyor (WIP)",
    accentColor: "bg-cyan-500",
  },
  "SCRAP-MAIN": {
    description: "Brak ombori — yaroqsiz va nuqsonli materiallar ajratib saqlanadi. Utilizatsiya yoki qayta ishlash uchun kutayotgan buyumlar.",
    defaultTab: "stock",
    featuredTabs: ["stock", "receiving", "reports", "history"],
    kpiLabels: ["Brak turlari", "Bugungi kirim", "Utilizatsiyaga tayyor", "Brak qiymati (yo'qotish)"],
    kpiIcons: [Trash2, TrendingDown, Recycle, AlertTriangle],
    kpiColors: ["text-[var(--ep-red)]", "text-[var(--ep-red)]", "text-[var(--ep-yellow)]", "text-[var(--ep-red)]"],
    emptyStockText: "Brak material yo'q — bu yaxshi natija! Sifat nazorati samarali ishlayapti.",
    receivingHint: "Brak deb topilgan materiallarni kiritish. Nuqson turi va sababini belgilang.",
    issuingHint: "Utilizatsiya yoki qayta ishlash uchun brakni chiqarish. Disposal aktini rasmiylashtiring.",
    qcHint: "Brak materialni qayta ko'rib chiqish — ba'zilari tuzatilib qayta ishlatilishi mumkin.",
    specialFeatures: ["Nuqson klassifikatsiyasi", "Utilizatsiya kuzatuvi", "Brak sabablari tahlili", "Yo'qotish hisobi (UZS)"],
    typeBadge: "Brak / Chiqindi",
    accentColor: "bg-red-500",
  },
  "QC-HOLD": {
    description: "Karantin ombori — sifat nazorati tekshiruvidan o'tayotgan materiallar vaqtincha shu yerda saqlanadi. QC qaroriga qarab chiqariladi yoki brakka o'tkaziladi.",
    defaultTab: "qc",
    featuredTabs: ["qc", "stock", "movements", "history"],
    kpiLabels: ["Kutayotgan tekshiruvlar", "Bugungi qarorlar", "O'rtacha kutish (soat)", "Karantin qiymati"],
    kpiIcons: [ShieldCheck, CheckCircle2, Timer, Lock],
    kpiColors: ["text-[var(--ep-yellow)]", "text-[var(--ep-green)]", "text-[var(--ep-primary)]", "text-[var(--ep-yellow)]"],
    emptyStockText: "Karantinda material yo'q. Barcha kelgan partiyalar allaqachon tekshirilgan.",
    receivingHint: "QC tekshiruviga material kiritish. GRN yaratilganda avtomatik karantinga tushadi.",
    issuingHint: "QC tekshiruvidan o'tgan materiallarni tegishli omborga chiqarish (release).",
    qcHint: "Asosiy ish maydoni — har bir lot/partiyani tekshiring, natijani kiriting: APPROVED yoki REJECTED.",
    specialFeatures: ["QC checklist", "Test natijalari kiritish", "Lot partiya boshqaruvi", "Hold/Release qaror berish"],
    typeBadge: "Karantin / QC",
    accentColor: "bg-amber-500",
  },
  "TOOL-MAIN": {
    description: "Asbob-uskuna ombori — ishlab chiqarish uskunalari, ehtiyot qismlar, o'lchov asboblari. Har bir asbobning holati va kalibratsiya muddati kuzatiladi.",
    defaultTab: "stock",
    featuredTabs: ["stock", "issuing", "history", "inventory"],
    kpiLabels: ["Asbob-uskuna turlari", "Berilgan (checkout)", "Kalibratsiya kerak", "Uskuna qiymati"],
    kpiIcons: [Wrench, Send, AlertTriangle, Cog],
    kpiColors: ["text-[var(--ep-yellow)]", "text-[var(--ep-blue)]", "text-[var(--ep-red)]", "text-[var(--ep-yellow)]"],
    emptyStockText: "Asbob-uskuna hali ro'yxatdan o'tkazilmagan. Har bir uskunani barcode bilan kiritish kerak.",
    receivingHint: "Yangi asbob-uskuna qabul qilish. Serial raqam va texnik ma'lumotlarni kiriting.",
    issuingHint: "Operatorga asbob-uskuna berish (checkout). Qaytarish muddatini belgilang.",
    qcHint: "Asbob-uskuna holati tekshiruvi va kalibratsiya. O'lchov asboblari muddatli tekshiriladi.",
    specialFeatures: ["Asbob checkout/return", "Kalibratsiya jadvali", "Uskuna ta'mirlash tarixi", "Operator javobgarligi"],
    typeBadge: "Asbob-Uskuna",
    accentColor: "bg-yellow-500",
  },
  "MRO-MAIN": {
    description: "Xo'jalik materiallari ombori — tozalash vositalari, ofis mollari, yordamchi materiallar. Kundalik sarflanadigan narsalar boshqariladi.",
    defaultTab: "stock",
    featuredTabs: ["stock", "issuing", "suppliers", "reports"],
    kpiLabels: ["Material turlari", "Oylik sarf", "Buyurtma kerak", "Xo'jalik xarajati"],
    kpiIcons: [SprayCan, ShoppingCart, AlertTriangle, TrendingDown],
    kpiColors: ["text-[var(--ep-yellow)]", "text-[var(--ep-blue)]", "text-[var(--ep-primary)]", "text-[var(--ep-yellow)]"],
    emptyStockText: "Xo'jalik materiallari hali kiritilmagan. Tozalash va ofis mollari shu omborga kiritiladi.",
    receivingHint: "Xo'jalik mollari qabul qilish. Yetkazib beruvchidan kelgan partiyalarni tekshirib kirim qiling.",
    issuingHint: "Bo'limlarga xo'jalik mollari tarqatish. Bo'lim so'rovi asosida beriladi.",
    qcHint: "Xo'jalik mollari sifat tekshiruvi — amal muddati va to'liqligini tekshirish.",
    specialFeatures: ["Bo'limlar bo'yicha sarf", "Avtomatik buyurtma (auto-reorder)", "Oylik limit boshqaruvi", "Yetkazib beruvchi shartnomalar"],
    typeBadge: "Xo'jalik Mollari",
    accentColor: "bg-amber-500",
  },
  "MRO-STORE": {
    description: "MRO (Maintenance, Repair, Operations) ombori — uskunalarni ta'mirlash va texnik xizmat ko'rsatish uchun ehtiyot qismlar va materiallar.",
    defaultTab: "stock",
    featuredTabs: ["stock", "issuing", "inventory", "suppliers"],
    kpiLabels: ["Ehtiyot qism turlari", "Ta'mirda ishlatilgan", "Kritik zaxira", "MRO qiymati"],
    kpiIcons: [Hammer, Wrench, AlertTriangle, TrendingUp],
    kpiColors: ["text-[var(--ep-purple)]", "text-[var(--ep-blue)]", "text-[var(--ep-red)]", "text-[var(--ep-purple)]"],
    emptyStockText: "MRO ehtiyot qismlar hali kiritilmagan. Uskunalar uchun ehtiyot qismlar shu yerda saqlanadi.",
    receivingHint: "Ehtiyot qismlar va ta'mirlash materiallari qabul qilish. Uskuna katalog raqamini belgilang.",
    issuingHint: "Ta'mirlash uchun ehtiyot qism berish. Work Order raqamini kiritish shart.",
    qcHint: "Ehtiyot qism sifati tekshiruvi — asl/o'rinbosar (OEM/aftermarket) aniqlash.",
    specialFeatures: ["Uskuna-ehtiyot qism bog'lash", "Ta'mirlash Work Order", "Kritik zaxira ogohlantirish", "Yetkazib beruvchi kataloglari"],
    typeBadge: "MRO Ehtiyot Qism",
    accentColor: "bg-purple-500",
  },
};

// ─── Shared row types ─────────────────────────────────────────────────────
export interface MovementRow {
  id: number;
  movementType: string;
  materialName: string;
  quantity: string | number;
  unit?: string;
  performedByName?: string;
  reason?: string;
  createdAt: string;
}

/** Ombor kodiga mos konfiguratsiyani qaytaradi, default bilan */
export function getTypeConfig(code: string): WarehouseTypeConfig {
  return TYPE_CONFIGS[code] ?? {
    description: "Umumiy ombor — barcha turdagi materiallar saqlanadi.",
    defaultTab: "stock" as LayerKey,
    featuredTabs: ["stock", "movements"],
    kpiLabels: ["Material turlari", "Kam zaxira", "Tugagan", "Jami qiymat"],
    kpiIcons: [Boxes, AlertTriangle, TrendingDown, TrendingUp],
    kpiColors: ["text-gray-600", "text-[var(--ep-primary)]", "text-[var(--ep-red)]", "text-[var(--ep-green)]"],
    emptyStockText: "Bu omborda hozircha material yo'q.",
    receivingHint: "Material qabul qilish.",
    issuingHint: "Material berish.",
    qcHint: "Sifat nazorati.",
    specialFeatures: [],
    typeBadge: "Umumiy",
    accentColor: "bg-gray-500",
  };
}

// ─── Ombor grid'idagi har bir karta ────────────────────────────────────────
export function WarehouseGridCard({ wh, onOpen }: { wh: WarehouseRow; onOpen: () => void }) {
  const cfg = getTypeConfig(wh.code);
  const Icon = warehouseIcons[wh.code] ?? Boxes;
  const gradient = warehouseColors[wh.code] ?? "";

  return (
    <button
      onClick={onOpen}
      className="group text-left p-5 rounded-xl bg-card hover:bg-muted/40 border border-border transition-all hover:shadow-lg hover:scale-[1.02]"
      data-testid={`warehouse-card-${wh.code}`}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${gradient} text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        <Badge className={`${cfg.accentColor} text-white text-[10px]`}>{cfg.typeBadge}</Badge>
      </div>
      <div className="mt-3">
        <div className="font-bold text-foreground">{wh.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{wh.code}</div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cfg.description}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {cfg.specialFeatures.slice(0, 2).map(f => (
          <span key={f} className="text-[10px] bg-muted/60 px-1.5 py-0.5 rounded-full text-muted-foreground">{f}</span>
        ))}
      </div>
      <div className="mt-3 text-xs text-primary group-hover:underline font-medium">
        Ochish ({cfg.featuredTabs.length} ustuvor qatlam) &rarr;
      </div>
    </button>
  );
}

// ─── Warehouse detail page header (title + badges + KPI cards) ───────────
interface WarehouseHeaderProps {
  activeWarehouse: WarehouseRow;
  cfg: WarehouseTypeConfig;
  kpis: { total: number; lowStock: number; outOfStock: number; totalValue: number };
  isSyncing: boolean;
  onNavigate: (path: string) => void;
  onSyncToPos: (id: string) => void;
}

export function WarehouseHub12Header({
  activeWarehouse, cfg, kpis, isSyncing, onNavigate, onSyncToPos,
}: WarehouseHeaderProps) {
  const Icon = warehouseIcons[activeWarehouse.code] ?? Boxes;
  const gradient = warehouseColors[activeWarehouse.code] ?? "";

  const kpiValues = [
    kpis.total,
    kpis.lowStock,
    kpis.outOfStock,
    kpis.totalValue > 0 ? `${(kpis.totalValue / 1_000_000).toFixed(1)}M` : "0",
  ];

  return (
    <>
      {/* Header — turga xos */}
      <div className="flex items-start gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("/warehouse/hub")}
          data-testid="button-back" className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className={`h-14 w-14 inline-flex items-center justify-center rounded-xl ${gradient} text-white shrink-0`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{activeWarehouse.name}</h1>
            <Badge className={`${cfg.accentColor} text-white`}>{cfg.typeBadge}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {activeWarehouse.code} · {activeWarehouse.type}
            {activeWarehouse.address && ` · ${activeWarehouse.address}`}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{cfg.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => onNavigate(`/wms/kirim-new?warehouseId=${activeWarehouse.id}`)}
            className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white" data-testid="button-yangi-kirim">
            <Truck className="h-4 w-4 mr-2" />Yangi Kirim
          </Button>
          <Button onClick={() => onSyncToPos(activeWarehouse.id)} disabled={isSyncing}
            variant="outline" data-testid="button-sync-pos-header">
            {isSyncing ? <EPLoader className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            POS Sync
          </Button>
        </div>
      </div>

      {/* Maxsus funksiyalar badges */}
      <div className="flex flex-wrap gap-1.5 mb-4 ml-[4.5rem]">
        {cfg.specialFeatures.map(f => (
          <span key={f} className="text-[11px] bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground border border-border">
            {f}
          </span>
        ))}
      </div>

      {/* KPI cards — turga xos labellar va ranglar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {cfg.kpiLabels.map((label, i) => {
          const KpiIcon = cfg.kpiIcons[i];
          return (
            <Card key={label} className={i === 2 && kpis.outOfStock > 0 ? "border-red-500/30" : i === 1 && kpis.lowStock > 0 ? "border-orange-500/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <KpiIcon className={`h-4 w-4 ${cfg.kpiColors[i]}`} />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${i === 1 && kpis.lowStock > 0 ? "text-[var(--ep-primary)]" : i === 2 && kpis.outOfStock > 0 ? "text-[var(--ep-red)]" : ""}`}>
                  {kpiValues[i]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
