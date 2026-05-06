/**
 * WarehouseHub12 — 12 qatlamli universal ombor sahifasi.
 *
 * 9 ta ombor turi (RM-MAIN, RM-ROLLS, FG-MAIN, WIP-MAIN, SCRAP-MAIN, QC-HOLD,
 * TOOL-MAIN, MRO-MAIN, MRO-STORE) — har biri o'ziga xos kontentga ega.
 *
 * Har bir ombor turi uchun:
 *  - Maxsus tavsif va KPI kartochkalari
 *  - Prioritet tablar (birinchi ochiladigan tab)
 *  - Ombor turiga mos mazmun va ogohlantirish xabarlari
 *
 * Source-of-truth: `pos_warehouse_stock_view` — POS Monitor ham shu joydan o'qiydi.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes, Truck, Send, ShieldCheck, ArrowRightLeft, Lock,
  ClipboardList, ScanBarcode, BarChart3, Users, History, RefreshCw,
  Loader2, ArrowLeft, Search, AlertTriangle, Package,
  ScrollText, Factory, Trash2, Wrench, CheckCircle2,
  Timer, TrendingDown, TrendingUp, Ruler,
  PackageCheck, Recycle,
  Hammer, SprayCan, Cog, ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { selectArray } from "@/lib/queryClient";
import { useWarehousePosSync, type WarehouseRow, type WarehouseStockRow } from "@/hooks/useWarehousePosSync";
import { warehouseIcons, warehouseColors } from "@/components/wms/hub/helpers";
import { AsyncBoundary } from "@/components/AsyncBoundary";

// ─── 12 qatlam ta'rifi ─────────────────────────────────────────────────────
const LAYERS = [
  { key: "stock",        label: "Zaxira",         icon: Boxes,         },
  { key: "receiving",    label: "Qabul",          icon: Truck,         },
  { key: "issuing",      label: "Berish",         icon: Send,          },
  { key: "qc",           label: "QC",             icon: ShieldCheck,   },
  { key: "movements",    label: "Harakatlar",     icon: ArrowRightLeft },
  { key: "reservations", label: "Bron",           icon: Lock,          },
  { key: "inventory",    label: "Inventarizatsiya",icon: ClipboardList },
  { key: "barcodes",     label: "Shtrix-kod",     icon: ScanBarcode,   },
  { key: "reports",      label: "Hisobotlar",     icon: BarChart3,     },
  { key: "suppliers",    label: "Ta'minotchilar", icon: Users,         },
  { key: "history",      label: "Tarix",          icon: History,       },
  { key: "pos-sync",     label: "POS Sync",       icon: RefreshCw,     },
] as const;

type LayerKey = typeof LAYERS[number]["key"];

// ─── Ombor turiga xos konfiguratsiya ───────────────────────────────────────

interface WarehouseTypeConfig {
  /** Sahifa header ostidagi qo'shimcha tavsif */
  description: string;
  /** Birinchi ochiladigan tab */
  defaultTab: LayerKey;
  /** Ustuvor tablar (bold qilinadi) */
  featuredTabs: LayerKey[];
  /** Ombor turiga xos 4 ta KPI */
  kpiLabels: [string, string, string, string];
  /** Ombor turiga xos ikonkalar (4 ta) */
  kpiIcons: [typeof Boxes, typeof Boxes, typeof Boxes, typeof Boxes];
  /** Ombor turiga xos ranglar (4 ta) */
  kpiColors: [string, string, string, string];
  /** Stock tab bo'sh bo'lganda turga xos xabar */
  emptyStockText: string;
  /** Receiving tab turga xos tavsifi */
  receivingHint: string;
  /** Issuing tab turga xos tavsifi */
  issuingHint: string;
  /** QC tab turga xos tavsifi */
  qcHint: string;
  /** Maxsus funksiyalar ro'yxati */
  specialFeatures: string[];
  /** Ombor turining tavsifli nomi */
  typeBadge: string;
  /** Turga xos rang */
  accentColor: string;
}

const TYPE_CONFIGS: Record<string, WarehouseTypeConfig> = {
  "RM-MAIN": {
    description: "Asosiy xom ashyo ombori — ishlab chiqarish uchun barcha materiallar shu yerda saqlanadi. Yetkazib beruvchilardan keladigan materiallar birinchi bu omborga qabul qilinadi.",
    defaultTab: "stock",
    featuredTabs: ["stock", "receiving", "suppliers", "qc"],
    kpiLabels: ["Xom ashyo turlari", "Yetkazib berishda", "Min. darajadan past", "Xom ashyo qiymati"],
    kpiIcons: [Package, Truck, AlertTriangle, TrendingUp],
    kpiColors: ["text-blue-600", "text-indigo-600", "text-orange-500", "text-emerald-600"],
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
    kpiColors: ["text-indigo-600", "text-purple-600", "text-orange-500", "text-emerald-600"],
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
    kpiColors: ["text-emerald-600", "text-green-600", "text-blue-600", "text-emerald-600"],
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
    kpiColors: ["text-cyan-600", "text-blue-600", "text-red-500", "text-emerald-600"],
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
    kpiColors: ["text-red-600", "text-red-500", "text-amber-600", "text-red-600"],
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
    kpiColors: ["text-amber-600", "text-green-600", "text-orange-500", "text-amber-600"],
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
    kpiColors: ["text-yellow-600", "text-blue-600", "text-red-500", "text-yellow-600"],
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
    kpiColors: ["text-amber-600", "text-blue-600", "text-orange-500", "text-amber-600"],
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
    kpiColors: ["text-purple-600", "text-blue-600", "text-red-500", "text-purple-600"],
    emptyStockText: "MRO ehtiyot qismlar hali kiritilmagan. Uskunalar uchun ehtiyot qismlar shu yerda saqlanadi.",
    receivingHint: "Ehtiyot qismlar va ta'mirlash materiallari qabul qilish. Uskuna katalog raqamini belgilang.",
    issuingHint: "Ta'mirlash uchun ehtiyot qism berish. Work Order raqamini kiritish shart.",
    qcHint: "Ehtiyot qism sifati tekshiruvi — asl/o'rinbosar (OEM/aftermarket) aniqlash.",
    specialFeatures: ["Uskuna-ehtiyot qism bog'lash", "Ta'mirlash Work Order", "Kritik zaxira ogohlantirish", "Yetkazib beruvchi kataloglari"],
    typeBadge: "MRO Ehtiyot Qism",
    accentColor: "bg-purple-500",
  },
};

/** Ombor kodiga mos konfiguratsiyani qaytaradi, default bilan */
function getTypeConfig(code: string): WarehouseTypeConfig {
  return TYPE_CONFIGS[code] ?? {
    description: "Umumiy ombor — barcha turdagi materiallar saqlanadi.",
    defaultTab: "stock" as LayerKey,
    featuredTabs: ["stock", "movements"],
    kpiLabels: ["Material turlari", "Kam zaxira", "Tugagan", "Jami qiymat"],
    kpiIcons: [Boxes, AlertTriangle, TrendingDown, TrendingUp],
    kpiColors: ["text-gray-600", "text-orange-500", "text-red-500", "text-emerald-600"],
    emptyStockText: "Bu omborda hozircha material yo'q.",
    receivingHint: "Material qabul qilish.",
    issuingHint: "Material berish.",
    qcHint: "Sifat nazorati.",
    specialFeatures: [],
    typeBadge: "Umumiy",
    accentColor: "bg-gray-500",
  };
}

// ─── 9 ta standart ombor — DB'da seed bo'lmasa ham frontend ishlaydi ─────
const DEFAULT_WAREHOUSES: WarehouseRow[] = [
  { id: "RM-MAIN",   code: "RM-MAIN",   name: "Xom Ashyo Ombori",      type: "raw_material",   isActive: true },
  { id: "RM-ROLLS",  code: "RM-ROLLS",  name: "Rulon Ombori",          type: "raw_material",   isActive: true },
  { id: "FG-MAIN",   code: "FG-MAIN",   name: "Tayyor Mahsulot Ombori",type: "finished_goods", isActive: true },
  { id: "WIP-MAIN",  code: "WIP-MAIN",  name: "Yarim Tayyor Mahsulot", type: "wip",            isActive: true },
  { id: "SCRAP-MAIN",code: "SCRAP-MAIN",name: "Brak Ombori",           type: "scrap",          isActive: true },
  { id: "QC-HOLD",   code: "QC-HOLD",   name: "Karantin Ombori",       type: "quarantine",     isActive: true },
  { id: "TOOL-MAIN", code: "TOOL-MAIN", name: "Asbob-Uskuna Ombori",   type: "tools",          isActive: true },
  { id: "MRO-MAIN",  code: "MRO-MAIN",  name: "Xo'jalik Ombori",       type: "household",      isActive: true },
  { id: "MRO-STORE", code: "MRO-STORE", name: "MRO Ombori",            type: "mro",            isActive: true },
];

interface MovementRow {
  id: number;
  movementType: string;
  materialName: string;
  quantity: string | number;
  unit?: string;
  performedByName?: string;
  reason?: string;
  createdAt: string;
}

// ─── Ombor grid'idagi har bir karta uchun qo'shimcha ma'lumot ──────────────
function WarehouseGridCard({ wh, onOpen }: { wh: WarehouseRow; onOpen: () => void }) {
  const cfg = getTypeConfig(wh.code);
  const Icon = warehouseIcons[wh.code] ?? Boxes;
  const gradient = warehouseColors[wh.code] ?? "from-gray-500 to-gray-600";

  return (
    <button
      onClick={onOpen}
      className="group text-left p-5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant transition-all hover:shadow-lg hover:scale-[1.02]"
      data-testid={`warehouse-card-${wh.code}`}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        <Badge className={`${cfg.accentColor} text-white text-[10px]`}>{cfg.typeBadge}</Badge>
      </div>
      <div className="mt-3">
        <div className="font-bold text-on-surface">{wh.name}</div>
        <div className="text-xs text-on-surface-variant mt-0.5">{wh.code}</div>
      </div>
      <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">{cfg.description}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {cfg.specialFeatures.slice(0, 2).map(f => (
          <span key={f} className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded-full text-on-surface-variant">{f}</span>
        ))}
      </div>
      <div className="mt-3 text-xs text-primary group-hover:underline font-medium">
        Ochish ({cfg.featuredTabs.length} ustuvor qatlam) &rarr;
      </div>
    </button>
  );
}

export default function WarehouseHub12() {
  const params = useParams<{ code?: string }>();
  const [, navigate] = useLocation();
  const [activeLayer, setActiveLayer] = useState<LayerKey>("stock");
  const [search, setSearch] = useState("");

  const {
    warehouses,
    isWarehousesLoading,
    isWarehousesError,
    syncToPos,
    isSyncing,
    refetchWarehouses,
  } = useWarehousePosSync();

  const selectedWarehouse: WarehouseRow | undefined = useMemo(() => {
    if (!params.code) return undefined;
    const code = params.code.toUpperCase();
    return warehouses.find(w => String(w.code).toUpperCase() === code);
  }, [params.code, warehouses]);

  const fallbackWarehouse: WarehouseRow | undefined = useMemo(() => {
    if (selectedWarehouse) return undefined;
    if (!params.code) return undefined;
    const FALLBACKS: Record<string, Partial<WarehouseRow>> = {
      "RM-MAIN":   { name: "Xom Ashyo Ombori",     type: "raw_material" },
      "RM-ROLLS":  { name: "Rulon Ombori",         type: "raw_material" },
      "FG-MAIN":   { name: "Tayyor Mahsulot",      type: "finished_goods" },
      "WIP-MAIN":  { name: "Yarim Tayyor Mahsulot",type: "wip" },
      "SCRAP-MAIN":{ name: "Brak Ombori",          type: "scrap" },
      "QC-HOLD":   { name: "Karantin Ombori",      type: "quarantine" },
      "TOOL-MAIN": { name: "Asbob-Uskuna Ombori",  type: "tools" },
      "MRO-MAIN":  { name: "Xo'jalik Ombori",      type: "household" },
      "MRO-STORE": { name: "MRO Ombori",           type: "mro" },
    };
    const code = params.code.toUpperCase();
    const tpl = FALLBACKS[code];
    if (!tpl) return undefined;
    return {
      id: code,
      code,
      name: tpl.name ?? code,
      type: tpl.type ?? "general",
      isActive: true,
    };
  }, [selectedWarehouse, params.code]);

  const activeWarehouse = selectedWarehouse ?? fallbackWarehouse;
  const typeConfig = useMemo(
    () => activeWarehouse ? getTypeConfig(activeWarehouse.code) : null,
    [activeWarehouse],
  );

  // Ombor turi o'zgarganda default tab'ga o'tish
  useEffect(() => {
    if (!typeConfig) return;
    const hash = window.location.hash.replace("#", "");
    if (hash && LAYERS.some(l => l.key === hash)) {
      setActiveLayer(hash as LayerKey);
    } else {
      setActiveLayer(typeConfig.defaultTab);
    }
  }, [typeConfig]);

  // Tanlangan ombor stoki
  const stockQuery = useQuery<{ totalItems: number; items: WarehouseStockRow[] }>({
    queryKey: ["/api/warehouse/warehouses", activeWarehouse?.id, "stock"],
    enabled: !!activeWarehouse,
    staleTime: 30_000,
  });

  // Movements — real-time
  const movementsQuery = useQuery({
    queryKey: ["/api/pos/wh/movements", { warehouseId: activeWarehouse?.id ?? "", limit: "50" }],
    enabled: !!activeWarehouse,
    select: selectArray<MovementRow>,
    staleTime: 15_000,
  });

  // Stock alerts (low/out)
  const alertsQuery = useQuery({
    queryKey: ["/api/pos/wh/alerts"],
    enabled: !!activeWarehouse,
    select: selectArray<WarehouseStockRow>,
  });

  // Goods receipts
  const receiptsQuery = useQuery({
    queryKey: ["/api/warehouse/goods-receipts", { status: "pending" }],
    enabled: !!activeWarehouse && activeLayer === "receiving",
    select: (raw: unknown) => {
      if (Array.isArray(raw)) return raw as Record<string, unknown>[];
      const obj = raw as { items?: unknown; data?: unknown };
      return Array.isArray(obj?.items) ? obj.items as Record<string, unknown>[]
           : Array.isArray(obj?.data)  ? obj.data  as Record<string, unknown>[] : [];
    },
  });

  // Picking tasks
  const pickingQuery = useQuery({
    queryKey: ["/api/barcode-warehouse/picking-tasks"],
    enabled: !!activeWarehouse && activeLayer === "issuing",
    select: selectArray<Record<string, unknown>>,
  });

  // Barcodes
  const barcodesQuery = useQuery({
    queryKey: ["/api/barcode-warehouse/barcodes"],
    enabled: !!activeWarehouse && activeLayer === "barcodes",
    select: selectArray<Record<string, unknown>>,
  });

  // ─── KPI hisoblar ─────────────────────────────────────────────────────────
  const stockItems = stockQuery.data?.items ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return stockItems;
    const q = search.trim().toLowerCase();
    return stockItems.filter(s =>
      String(s.materialName ?? "").toLowerCase().includes(q) ||
      String(s.materialCode ?? "").toLowerCase().includes(q),
    );
  }, [stockItems, search]);

  const kpis = useMemo(() => {
    const total = stockItems.length;
    const lowStock = stockItems.filter(s => s.stockStatus === "LOW_STOCK").length;
    const outOfStock = stockItems.filter(s => s.stockStatus === "OUT_OF_STOCK").length;
    const totalValue = stockItems.reduce(
      (sum, s) => sum + Number(s.quantity ?? 0) * Number(s.unitPrice ?? 0), 0,
    );
    return { total, lowStock, outOfStock, totalValue };
  }, [stockItems]);

  const handleLayerChange = (k: string) => {
    setActiveLayer(k as LayerKey);
    window.history.replaceState(null, "", `#${k}`);
  };

  // ─── Loading / Error ──────────────────────────────────────────────────────
  if (isWarehousesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isWarehousesError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-on-surface-variant mb-4">Omborlarni yuklashda xatolik</p>
            <Button onClick={() => refetchWarehouses()}>Qayta urinish</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── 9 ta ombor grid ─────────────────────────────────────────────────────
  if (!activeWarehouse) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-light tracking-tight">
            Ombor <span className="font-bold text-primary">Boshqaruvi</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            9 ta ombor — har biri o'ziga xos funksiyalar va 12 qatlamli boshqaruv. POS Monitor avtomatik sinxronlashadi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(warehouses.length > 0 ? warehouses : DEFAULT_WAREHOUSES).map(wh => (
            <WarehouseGridCard
              key={wh.code}
              wh={wh}
              onOpen={() => navigate(`/warehouse/hub/${wh.code}`)}
            />
          ))}
        </div>
        {warehouses.length === 0 && (
          <p className="text-xs text-on-surface-variant mt-4 text-center">
            Omborlar bazada hali seed qilinmagan — statik shablon bilan ishlayapti. Migratsiya qo'llanilgach, real ma'lumotlar tortiladi.
          </p>
        )}
      </div>
    );
  }

  // ─── Tanlangan ombor — 12 qatlamli turga xos ko'rinish ───────────────────
  const cfg = typeConfig!;
  const Icon = warehouseIcons[activeWarehouse.code] ?? Boxes;
  const gradient = warehouseColors[activeWarehouse.code] ?? "from-gray-500 to-gray-600";

  // KPI qiymatlari — birinchi va to'rtinchi turga xos, 2 va 3 chi universal
  const kpiValues = [
    kpis.total,
    kpis.lowStock,
    kpis.outOfStock,
    kpis.totalValue > 0 ? `${(kpis.totalValue / 1_000_000).toFixed(1)}M` : "0",
  ];

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      {/* Header — turga xos */}
      <div className="flex items-start gap-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/warehouse/hub")}
          data-testid="button-back"
          className="mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className={`h-14 w-14 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shrink-0`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-on-surface">{activeWarehouse.name}</h1>
            <Badge className={`${cfg.accentColor} text-white`}>{cfg.typeBadge}</Badge>
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            {activeWarehouse.code} · {activeWarehouse.type}
            {activeWarehouse.address && ` · ${activeWarehouse.address}`}
          </div>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{cfg.description}</p>
        </div>
        <Button
          onClick={() => syncToPos(activeWarehouse.id)}
          disabled={isSyncing}
          variant="outline"
          data-testid="button-sync-pos-header"
          className="shrink-0"
        >
          {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          POS Sync
        </Button>
      </div>

      {/* Maxsus funksiyalar badges */}
      <div className="flex flex-wrap gap-1.5 mb-4 ml-[4.5rem]">
        {cfg.specialFeatures.map(f => (
          <span key={f} className="text-[11px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant border border-outline-variant">
            {f}
          </span>
        ))}
      </div>

      {/* KPI cards — turga xos labellar va ranglar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {cfg.kpiLabels.map((label, i) => {
          const KpiIcon = cfg.kpiIcons[i];
          return (
            <Card key={label} className={i === 2 && kpis.outOfStock > 0 ? "border-red-500/30" : i === 1 && kpis.lowStock > 0 ? "border-orange-500/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <KpiIcon className={`h-4 w-4 ${cfg.kpiColors[i]}`} />
                  <p className="text-xs text-on-surface-variant">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${i === 1 && kpis.lowStock > 0 ? "text-orange-500" : i === 2 && kpis.outOfStock > 0 ? "text-red-500" : ""}`}>
                  {kpiValues[i]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 12 qatlamli tabs — ustuvor tablar bold */}
      <Tabs value={activeLayer} onValueChange={handleLayerChange}>
        <TabsList className="grid grid-cols-6 lg:grid-cols-12 h-auto bg-surface-container p-1 rounded-2xl gap-1 mb-4">
          {LAYERS.map(layer => {
            const LayerIcon = layer.icon;
            const isFeatured = cfg.featuredTabs.includes(layer.key);
            return (
              <TabsTrigger
                key={layer.key}
                value={layer.key}
                className={`flex-col py-2 px-1 rounded-xl text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-white ${isFeatured ? "font-bold" : "font-medium text-on-surface-variant/70"}`}
                data-testid={`tab-${layer.key}`}
              >
                <LayerIcon className="h-4 w-4" />
                {layer.label}
                {isFeatured && <span className="h-1 w-1 rounded-full bg-current" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ═══════ 1. STOCK ═══════ */}
        <TabsContent value="stock" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input
              placeholder="Material qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <AsyncBoundary
                isLoading={stockQuery.isLoading}
                isError={stockQuery.isError}
                isEmpty={filtered.length === 0}
                onRetry={stockQuery.refetch}
                emptyText={search ? "Qidiruv natijasi yo'q" : cfg.emptyStockText}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead className="text-right">Mavjud</TableHead>
                      <TableHead className="text-right">Bron</TableHead>
                      <TableHead className="text-right">Jami</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.materialName}</TableCell>
                        <TableCell className="text-xs text-on-surface-variant">{s.materialCode}</TableCell>
                        <TableCell className="text-right font-mono">{Number(s.available ?? 0).toLocaleString('uz-UZ')} {s.unit}</TableCell>
                        <TableCell className="text-right font-mono text-on-surface-variant">{Number(s.reserved ?? 0).toLocaleString('uz-UZ')}</TableCell>
                        <TableCell className="text-right font-mono">{Number(s.quantity ?? 0).toLocaleString('uz-UZ')}</TableCell>
                        <TableCell>
                          <Badge variant={s.stockStatus === 'OUT_OF_STOCK' ? 'destructive' : s.stockStatus === 'LOW_STOCK' ? 'outline' : 'secondary'}>
                            {s.stockStatus ?? 'OK'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AsyncBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 2. RECEIVING ═══════ */}
        <TabsContent value="receiving">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Truck className={`h-5 w-5 ${cfg.kpiColors[1]}`} />
                <CardTitle className="text-base">Qabul qilish — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">{cfg.receivingHint}</p>
            </CardHeader>
            <CardContent>
              <AsyncBoundary
                isLoading={receiptsQuery.isLoading}
                isError={receiptsQuery.isError}
                isEmpty={(receiptsQuery.data?.length ?? 0) === 0}
                onRetry={receiptsQuery.refetch}
                emptyText={`Kutilayotgan qabul yo'q — ${activeWarehouse.name}`}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GRN raqami</TableHead>
                      <TableHead>Yetkazuvchi</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(receiptsQuery.data ?? []).map((r, i) => (
                      <TableRow key={String(r.id ?? i)}>
                        <TableCell className="font-mono text-xs">{String(r.grnNumber ?? r.receiptNumber ?? r.id ?? '—')}</TableCell>
                        <TableCell className="text-sm">{String(r.supplierName ?? r.vendorName ?? '—')}</TableCell>
                        <TableCell className="text-sm">{String(r.materialName ?? r.itemName ?? '—')}</TableCell>
                        <TableCell className="text-right font-mono">{String(r.quantity ?? r.receivedQty ?? '—')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{String(r.status ?? 'pending')}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-on-surface-variant">
                          {r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString('uz-UZ') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AsyncBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 3. ISSUING ═══════ */}
        <TabsContent value="issuing">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Send className={`h-5 w-5 ${cfg.kpiColors[0]}`} />
                <CardTitle className="text-base">Material berish — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">{cfg.issuingHint}</p>
            </CardHeader>
            <CardContent>
              <AsyncBoundary
                isLoading={pickingQuery.isLoading}
                isError={pickingQuery.isError}
                isEmpty={(pickingQuery.data?.length ?? 0) === 0}
                onRetry={pickingQuery.refetch}
                emptyText={`Faol picking topshirig'i yo'q — ${activeWarehouse.name}`}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topshiriq</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead>Buyurtmachi</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pickingQuery.data ?? []).map((p, i) => (
                      <TableRow key={String(p.id ?? i)}>
                        <TableCell className="font-mono text-xs">{String(p.taskId ?? p.pickingNumber ?? p.id ?? '—')}</TableCell>
                        <TableCell className="text-sm">{String(p.materialName ?? p.itemName ?? '—')}</TableCell>
                        <TableCell className="text-right font-mono">{String(p.quantity ?? p.requestedQty ?? '—')}</TableCell>
                        <TableCell className="text-xs">{String(p.requestedBy ?? p.department ?? '—')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{String(p.status ?? 'pending')}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AsyncBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 4. QC ═══════ */}
        <TabsContent value="qc">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">Sifat nazorati — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">{cfg.qcHint}</p>
            </CardHeader>
            <CardContent>
              {activeWarehouse.code === "QC-HOLD" ? (
                /* Karantin ombori uchun maxsus QC panel */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="border-amber-200">
                      <CardContent className="p-4 text-center">
                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                        <p className="text-sm font-bold">Tekshiruv kutmoqda</p>
                        <p className="text-2xl font-bold text-amber-600">{kpis.total}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200">
                      <CardContent className="p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm font-bold">Tasdiqlangan</p>
                        <p className="text-2xl font-bold text-green-600">—</p>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardContent className="p-4 text-center">
                        <Trash2 className="h-8 w-8 mx-auto mb-2 text-red-500" />
                        <p className="text-sm font-bold">Rad etilgan</p>
                        <p className="text-2xl font-bold text-red-600">—</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      QC jarayoni
                    </h4>
                    <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                      <li>Material karantinga kiritiladi (GRN yoki ichki transfer)</li>
                      <li>QC xodimi namunalarni oladi va testdan o'tkazadi</li>
                      <li>Natija kiritiladi: APPROVED (tasdiqlangan) yoki REJECTED (rad)</li>
                      <li>APPROVED — tegishli omborga chiqariladi</li>
                      <li>REJECTED — SCRAP-MAIN omboriga o'tkaziladi</li>
                    </ol>
                  </div>
                </div>
              ) : (
                /* Boshqa omborlar uchun oddiy QC */
                <div className="text-center py-6 text-on-surface-variant">
                  <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-amber-500" />
                  <p className="font-medium">Sifat nazorati sahifasi</p>
                  <p className="text-xs mt-2">{cfg.qcHint}</p>
                  {activeWarehouse.code !== "SCRAP-MAIN" && (
                    <p className="text-xs mt-1">
                      QC tekshiruviga muhtoj materiallar QC-HOLD omboriga o'tkaziladi.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 5. MOVEMENTS ═══════ */}
        <TabsContent value="movements">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Harakatlar — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">
                {activeWarehouse.code === "WIP-MAIN"
                  ? "Sexlar o'rtasidagi material harakatlari va ishlab chiqarish bosqichlari"
                  : `${activeWarehouse.name}dagi barcha kirim/chiqim harakatlari (real-time)`}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <AsyncBoundary
                isLoading={movementsQuery.isLoading}
                isError={movementsQuery.isError}
                isEmpty={(movementsQuery.data?.length ?? 0) === 0}
                onRetry={movementsQuery.refetch}
                emptyText={`Hozircha harakatlar yo'q — ${activeWarehouse.name}`}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tur</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead>Foydalanuvchi</TableHead>
                      <TableHead>Sabab</TableHead>
                      <TableHead className="text-right">Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(movementsQuery.data ?? []).map(m => (
                      <TableRow key={m.id}>
                        <TableCell><Badge variant="outline" className="text-xs">{m.movementType}</Badge></TableCell>
                        <TableCell className="text-sm">{m.materialName}</TableCell>
                        <TableCell className="text-right font-mono">{Number(m.quantity).toFixed(2)} {m.unit}</TableCell>
                        <TableCell className="text-xs">{m.performedByName ?? '—'}</TableCell>
                        <TableCell className="text-xs text-on-surface-variant">{m.reason ?? '—'}</TableCell>
                        <TableCell className="text-right text-xs text-on-surface-variant">
                          {new Date(m.createdAt).toLocaleString('uz-UZ', { timeStyle: 'short', dateStyle: 'short' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AsyncBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 6. RESERVATIONS ═══════ */}
        <TabsContent value="reservations">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Bron qilingan zaxiralar — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">
                {activeWarehouse.code === "FG-MAIN"
                  ? "Buyurtmachilar uchun ajratilgan tayyor mahsulotlar. Jo'natish kuniga qadar bron saqlanadi."
                  : activeWarehouse.code === "RM-MAIN"
                  ? "Ishlab chiqarish buyurtmalari uchun ajratilgan xom ashyo. Production Order asosida bronlanadi."
                  : "Buyurtmalar uchun ajratilgan miqdorlar."}
              </p>
            </CardHeader>
            <CardContent className="py-6 text-center text-on-surface-variant">
              <Lock className="h-10 w-10 mx-auto mb-2" />
              <p className="text-xs mt-2">Bron qilingan zaxiralar uchun API integratsiyasi tayyor.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 7. INVENTORY ═══════ */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-base">Inventarizatsiya — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">
                {activeWarehouse.code === "TOOL-MAIN"
                  ? "Asbob-uskunalar inventarizatsiyasi. Har bir uskuna joyida borligini va holatini tekshirish."
                  : activeWarehouse.code === "RM-ROLLS"
                  ? "Rulon inventarizatsiyasi. Har bir rulonning qoldig'i va jismoniy holati tekshiriladi."
                  : `${activeWarehouse.name} — cycle count va to'liq inventarizatsiya.`}
              </p>
            </CardHeader>
            <CardContent className="py-6 text-center text-on-surface-variant">
              <ClipboardList className="h-10 w-10 mx-auto mb-2" />
              <p className="font-medium">Inventarizatsiya hisobi</p>
              <p className="text-xs mt-2">
                {activeWarehouse.code === "SCRAP-MAIN"
                  ? "Brak materiallar inventarizatsiyasi — utilizatsiya uchun tayyor miqdorni aniqlash."
                  : "Jismoniy va sistemaviy zaxira farqini aniqlash."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 8. BARCODES ═══════ */}
        <TabsContent value="barcodes">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ScanBarcode className="h-5 w-5 text-violet-500" />
                <CardTitle className="text-base">Shtrix-kodlar — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">
                {activeWarehouse.code === "RM-ROLLS"
                  ? "Har bir rulonga yagona barcode biriktiriladi. Skanerlash orqali rulon ma'lumotlari ko'rinadi."
                  : activeWarehouse.code === "TOOL-MAIN"
                  ? "Har bir asbob-uskunaga barcode biriktirilgan. Checkout/return jarayonida skanerlanadi."
                  : `${activeWarehouse.name} materiallaridagi barcode'lar.`}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <AsyncBoundary
                isLoading={barcodesQuery.isLoading}
                isError={barcodesQuery.isError}
                isEmpty={(barcodesQuery.data?.length ?? 0) === 0}
                onRetry={barcodesQuery.refetch}
                emptyText={`Shtrix-kodlar topilmadi — ${activeWarehouse.name}`}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Joylashuv</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(barcodesQuery.data ?? []).slice(0, 20).map((b, i) => (
                      <TableRow key={String(b.id ?? i)}>
                        <TableCell className="font-mono text-xs">{String(b.barcodeId ?? b.barcode ?? '—')}</TableCell>
                        <TableCell className="text-sm">{String(b.materialName ?? '—')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{String(b.status ?? '—')}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{String(b.currentLocation ?? b.location ?? '—')}</TableCell>
                        <TableCell className="text-right font-mono">{String(b.remainingQuantity ?? b.quantity ?? '—')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AsyncBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 9. REPORTS ═══════ */}
        <TabsContent value="reports">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Hisobotlar — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">
                {activeWarehouse.code === "SCRAP-MAIN"
                  ? "Brak tahlili — nuqson turlari, yo'qotish summasi, sabab-oqibat statistikasi."
                  : activeWarehouse.code === "FG-MAIN"
                  ? "Tayyor mahsulot hisobotlari — jo'natish tayyor, kutilayotgan, oylik ishlab chiqarish."
                  : `${activeWarehouse.name} — ABC tahlili, aging hisobi, aylanish tezligi.`}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeWarehouse.code === "SCRAP-MAIN" ? (
                  <>
                    <Card><CardContent className="p-4">
                      <Trash2 className="h-8 w-8 mb-2 text-red-500" />
                      <h3 className="font-bold">Nuqson turlari</h3>
                      <p className="text-xs text-on-surface-variant">Brak sabablari klassifikatsiyasi</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <TrendingDown className="h-8 w-8 mb-2 text-red-500" />
                      <h3 className="font-bold">Yo'qotish hisobi</h3>
                      <p className="text-xs text-on-surface-variant">Oylik/yillik brak summasi (UZS)</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <Recycle className="h-8 w-8 mb-2 text-green-500" />
                      <h3 className="font-bold">Qayta ishlash</h3>
                      <p className="text-xs text-on-surface-variant">Recycling va utilizatsiya</p>
                    </CardContent></Card>
                  </>
                ) : activeWarehouse.code === "TOOL-MAIN" ? (
                  <>
                    <Card><CardContent className="p-4">
                      <Wrench className="h-8 w-8 mb-2 text-yellow-500" />
                      <h3 className="font-bold">Uskuna holati</h3>
                      <p className="text-xs text-on-surface-variant">Ishlamoqda / ta'mirda / yaroqsiz</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <Timer className="h-8 w-8 mb-2 text-orange-500" />
                      <h3 className="font-bold">Kalibratsiya</h3>
                      <p className="text-xs text-on-surface-variant">O'z vaqtida / muddati o'tgan</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <Users className="h-8 w-8 mb-2 text-blue-500" />
                      <h3 className="font-bold">Operator foydalanish</h3>
                      <p className="text-xs text-on-surface-variant">Kim qancha vaqt ishlatgan</p>
                    </CardContent></Card>
                  </>
                ) : (
                  <>
                    <Card><CardContent className="p-4">
                      <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                      <h3 className="font-bold">ABC tahlili</h3>
                      <p className="text-xs text-on-surface-variant">A/B/C kategoriyalar bo'yicha</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                      <h3 className="font-bold">Aging</h3>
                      <p className="text-xs text-on-surface-variant">Eskirgan zaxiralar tahlili</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                      <h3 className="font-bold">Turnover</h3>
                      <p className="text-xs text-on-surface-variant">Aylanish darajasi</p>
                    </CardContent></Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 10. SUPPLIERS ═══════ */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Ta'minotchilar — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">
                {activeWarehouse.code === "RM-MAIN"
                  ? "Xom ashyo yetkazib beruvchilar ro'yxati. Narxlar, yetkazish muddatlari, sifat reytingi."
                  : activeWarehouse.code === "MRO-STORE"
                  ? "MRO ehtiyot qism yetkazuvchilari. Uskuna brendlari va OEM kataloglar."
                  : `${activeWarehouse.name} uchun aktiv ta'minotchilar.`}
              </p>
            </CardHeader>
            <CardContent className="py-6 text-center text-on-surface-variant">
              <Users className="h-10 w-10 mx-auto mb-2" />
              <p className="font-medium">Yetkazib beruvchilar</p>
              <p className="text-xs mt-2">
                {activeWarehouse.code === "RM-MAIN" || activeWarehouse.code === "RM-ROLLS"
                  ? "Xom ashyo/rulon yetkazib beruvchilarni MM modulida boshqaring."
                  : "Ombor uchun aktiv ta'minotchilar."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 11. HISTORY ═══════ */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                <CardTitle className="text-base">Tarix — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">
                {activeWarehouse.code === "QC-HOLD"
                  ? "QC qarorlar tarixi — kim, qachon tasdiqladi yoki rad etdi. Audit trail."
                  : activeWarehouse.code === "SCRAP-MAIN"
                  ? "Brak kirim/chiqim tarixi — qachon, qancha, nimaga brak deb topildi."
                  : `${activeWarehouse.name} — barcha o'zgarishlar tarixi (audit trail).`}
              </p>
            </CardHeader>
            <CardContent className="py-6 text-center text-on-surface-variant">
              <History className="h-10 w-10 mx-auto mb-2" />
              <p className="font-medium">Audit trail</p>
              <p className="text-xs mt-2">Kim, qachon, nimani o'zgartirdi — barcha amallar kuzatiladi.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ 12. POS SYNC ═══════ */}
        <TabsContent value="pos-sync">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">POS Monitor sinxronizatsiyasi — {activeWarehouse.name}</CardTitle>
              </div>
              <p className="text-sm text-on-surface-variant">
                {activeWarehouse.code === "FG-MAIN"
                  ? "Tayyor mahsulot zaxirasi POS terminallarida ko'rinadi. Buyurtma qabul qilishda real-time holat."
                  : `${activeWarehouse.name} stok ma'lumotlari POS Monitor'ga avtomatik uzatiladi.`}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-on-surface-variant">
                    Stock alerts: {alertsQuery.data?.length ?? 0} ta ogohlantirish
                  </p>
                </div>
                <Button onClick={() => syncToPos(activeWarehouse.id)} disabled={isSyncing} data-testid="button-sync-now">
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Hozir sinxronlash
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <Card><CardContent className="p-4">
                  <p className="text-xs text-on-surface-variant">POS terminallar</p>
                  <p className="text-2xl font-bold">—</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-on-surface-variant">Oxirgi sync</p>
                  <p className="text-sm font-bold">{new Date().toLocaleTimeString('uz-UZ')}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-on-surface-variant">Status</p>
                  <Badge variant="secondary">Avtomatik</Badge>
                </CardContent></Card>
              </div>
              <div className="mt-4 bg-surface-container rounded-xl p-4">
                <h4 className="font-bold text-sm mb-2">Sinxronizatsiya mexanizmi</h4>
                <ul className="text-xs text-on-surface-variant space-y-1 list-disc list-inside">
                  <li>Stock har o'zgarganda <code className="bg-surface px-1 rounded">pos_sync_events</code> jadvaliga yoziladi</li>
                  <li>POS Monitor bu eventlarni o'qib, ekranni yangilaydi</li>
                  <li>"Hozir sinxronlash" tugmasi manual signal yuboradi</li>
                  <li>{activeWarehouse.name} zaxirasi POS terminallarida real-time ko'rinadi</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
