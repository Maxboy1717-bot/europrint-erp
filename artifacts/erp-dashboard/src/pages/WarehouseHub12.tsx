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
;
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { selectArray } from "@/lib/queryClient";
import { useWarehousePosSync, type WarehouseRow, type WarehouseStockRow } from "@/hooks/useWarehousePosSync";
import {
  LAYERS, type LayerKey, type MovementRow,
  getTypeConfig, WarehouseGridCard, WarehouseHub12Header,
} from "./WarehouseHub12Helpers";
import { WarehouseHub12StockOpsTab } from "./WarehouseHub12StockOpsTab";
import { WarehouseHub12MiddleTabs } from "./WarehouseHub12MiddleTabs";
import { WarehouseHub12ReportsTab } from "./WarehouseHub12ReportsTab";
import { EPPageHeader, EPLoader } from "@/components/ep";

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
    return { id: code, code, name: tpl.name ?? code, type: tpl.type ?? "general", isActive: true };
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
      <div className="flex items-center justify-center h-screen bg-background">
        <EPLoader size={40} />
      </div>
    );
  }

  if (isWarehousesError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Omborlarni yuklashda xatolik</p>
            <Button onClick={() => refetchWarehouses()}>Qayta urinish</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── 9 ta ombor grid ─────────────────────────────────────────────────────
  if (!activeWarehouse) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Ombor Boshqaruvi</b></>}
        title="Ombor Boshqaruvi"
      />
          <p className="text-sm text-muted-foreground mt-1">
            9 ta ombor — har biri o'ziga xos funksiyalar va 12 qatlamli boshqaruv. POS Monitor avtomatik sinxronlashadi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(warehouses.length > 0
            ? warehouses.filter(w => w.isActive)
            : DEFAULT_WAREHOUSES
          ).map(wh => (
            <WarehouseGridCard
              key={wh.code}
              wh={wh}
              onOpen={() => navigate(`/warehouse/hub/${wh.code}`)}
            />
          ))}
        </div>
        {warehouses.length === 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Omborlar bazada hali seed qilinmagan — statik shablon bilan ishlayapti. Migratsiya qo'llanilgach, real ma'lumotlar tortiladi.
          </p>
        )}
      </div>
    );
  }

  // ─── Tanlangan ombor — 12 qatlamli turga xos ko'rinish ───────────────────
  const cfg = typeConfig!;

  return (
    <div className="space-y-6">
      <WarehouseHub12Header
        activeWarehouse={activeWarehouse}
        cfg={cfg}
        kpis={kpis}
        isSyncing={isSyncing}
        onNavigate={navigate}
        onSyncToPos={syncToPos}
      />

      {/* 12 qatlamli tabs — ustuvor tablar bold */}
      <Tabs value={activeLayer} onValueChange={handleLayerChange}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 lg:grid-cols-12 h-auto bg-muted/60 p-1 rounded-xl gap-1 mb-4">
          {LAYERS.map(layer => {
            const LayerIcon = layer.icon;
            const isFeatured = cfg.featuredTabs.includes(layer.key);
            return (
              <TabsTrigger
                key={layer.key}
                value={layer.key}
                className={`flex-col py-2 px-1 rounded-xl text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-white ${isFeatured ? "font-bold" : "font-medium text-muted-foreground/70"}`}
                data-testid={`tab-${layer.key}`}
              >
                <LayerIcon className="h-4 w-4" />
                {layer.label}
                {isFeatured && <span className="h-1 w-1 rounded-full bg-current" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ═══════ Tabs 1–4: stock · receiving · issuing · qc ═══════ */}
        <WarehouseHub12StockOpsTab
          activeWarehouse={activeWarehouse}
          cfg={cfg}
          filtered={filtered}
          search={search}
          onSearchChange={setSearch}
          stockQuery={stockQuery}
          receiptsQuery={receiptsQuery}
          pickingQuery={pickingQuery}
          kpisTotal={kpis.total}
          onNavigate={navigate}
        />

        {/* ═══════ Tabs 5–8: movements · employees · reservations · inventory · barcodes ═══════ */}
        <WarehouseHub12MiddleTabs
          activeWarehouse={activeWarehouse}
          movementsQuery={movementsQuery}
          barcodesQuery={barcodesQuery}
        />

        {/* ═══════ Tabs 9–12: reports · suppliers · history · pos-sync ═══════ */}
        <WarehouseHub12ReportsTab
          activeWarehouse={activeWarehouse}
          cfg={cfg}
          alertsCount={alertsQuery.data?.length ?? 0}
          isSyncing={isSyncing}
          onSyncToPos={syncToPos}
        />
      </Tabs>
    </div>
  );
}
