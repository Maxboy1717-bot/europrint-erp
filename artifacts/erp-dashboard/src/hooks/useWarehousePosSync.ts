/**
 * useWarehousePosSync — Warehouse ↔ POS Monitor real-time sinxronizatsiya hook.
 *
 * Foydalanish:
 *   const { warehouses, stock, syncToPos, isSyncing } = useWarehousePosSync(warehouseId);
 *
 * - WarehouseHub va PosWarehousePage ikkalasi bitta source-of-truth ishlatadi.
 * - Movement yaratilganda barcha qaramligi (queries) avtomatik invalidate bo'ladi.
 * - WebSocket signal kelganida ham qayta yuklash mumkin (kelajakda).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, safeArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  type: string;
  isActive: boolean;
  address?: string;
  capacityTotal?: number;
  capacityUsed?: number;
}

export interface WarehouseStockRow {
  id: string | number;
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: string | number;
  reserved: string | number;
  available: string | number;
  minStock: string | number;
  maxStock: string | number;
  unitPrice: string | number;
  currency: string;
  stockStatus?: 'OK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVER_STOCK';
}

export interface WarehouseStockResponse {
  totalItems: number;
  items: WarehouseStockRow[];
}

const WAREHOUSE_KEYS = {
  list: ["/api/warehouse/warehouses"] as const,
  stock: (id: string | undefined) =>
    ["/api/warehouse/warehouses", id, "stock"] as const,
  posStock: ["/api/pos/wh/stock"] as const,
  posAlerts: ["/api/pos/wh/alerts"] as const,
  posMovements: ["/api/pos/wh/movements"] as const,
  barcodes: ["/api/barcode-warehouse/barcodes"] as const,
  dashboard: ["/api/barcode-warehouse/dashboard"] as const,
};

/**
 * Backend'dan kelgan har qanday shakldagi (snake_case yoki camelCase, wrapped yoki
 * raw) ombor ma'lumotini frontend kutadigan WarehouseRow ga normalize qiladi.
 * Legacy endpoint `is_active` kabi snake_case qaytaradi — biz hammasini yagona
 * shaklga keltiramiz.
 */
function normalizeWarehouse(raw: unknown): WarehouseRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.id ?? r.warehouseId ?? r.warehouse_id;
  const code = r.code ?? r.warehouseCode ?? r.warehouse_code;
  const name = r.name ?? r.warehouseName ?? r.warehouse_name;
  if (id == null || !code || !name) return null;
  const isActive = r.isActive ?? r.is_active ?? r.active;
  return {
    id: String(id),
    code: String(code),
    name: String(name),
    nameRu: (r.nameRu ?? r.name_ru) as string | undefined,
    type: String(r.type ?? "general"),
    // is_active default true — agar ustun bo'lmasa ham ko'rinsin
    isActive: isActive === undefined || isActive === null ? true : Boolean(isActive),
    address: (r.address) as string | undefined,
    capacityTotal: r.capacityTotal as number | undefined ?? r.capacity_total as number | undefined,
    capacityUsed: r.capacityUsed as number | undefined ?? r.capacity_used as number | undefined,
  };
}

function normalizeWarehouses(raw: unknown): WarehouseRow[] {
  return safeArray<unknown>(raw)
    .map(normalizeWarehouse)
    .filter((w): w is WarehouseRow => w !== null);
}

export function useWarehousePosSync(warehouseId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  // Barcha omborlar — ikkala UI ham shu joydan o'qiydi.
  // Legacy endpoint snake_case qaytarsa ham normalize qilinadi.
  const warehousesQuery = useQuery<WarehouseRow[]>({
    queryKey: WAREHOUSE_KEYS.list,
    select: normalizeWarehouses,
    staleTime: 60_000, // 1 daqiqa cache
  });

  // Tanlangan ombor stoki — POS view bilan integratsiyalashgan
  const stockQuery = useQuery<WarehouseStockResponse>({
    queryKey: WAREHOUSE_KEYS.stock(warehouseId),
    enabled: !!warehouseId,
    staleTime: 30_000, // 30 sek (real-time'ga yaqin)
  });

  /**
   * POS Monitor'ga sinxronizatsiya signali yuborish.
   * POS Monitor offline rejimda ishlasa, keyingi onlinida ushbu eventni o'qiydi.
   */
  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/warehouse/warehouses/${id}/sync-pos`, {});
    },
    onSuccess: (_data, id) => {
      toast({
        title: "✅ POS Monitor yangilandi",
        description: `Ombor #${id} stok ma'lumoti POS terminallariga yuborildi`,
      });
      // Bog'liq query'larni invalidate qilamiz — UI darhol yangilanadi
      qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.stock(id) });
      qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.posStock });
      qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.posAlerts });
      qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.dashboard });
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Sinxronizatsiya xatosi",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Universal invalidator — har qanday warehouse o'zgarishidan keyin chaqiriladi.
   * Movement yaratilganda, stock o'zgarganda, QC qabul qilinganda — bu hammasi bir vaqtda yangilanadi.
   */
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.list });
    qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.stock(warehouseId) });
    qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.posStock });
    qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.posAlerts });
    qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.posMovements });
    qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.barcodes });
    qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.dashboard });
  };

  return {
    warehouses: warehousesQuery.data ?? [],
    isWarehousesLoading: warehousesQuery.isLoading,
    isWarehousesError: warehousesQuery.isError,

    stock: stockQuery.data?.items ?? [],
    stockTotal: stockQuery.data?.totalItems ?? 0,
    isStockLoading: stockQuery.isLoading,
    isStockError: stockQuery.isError,

    syncToPos: syncMutation.mutate,
    isSyncing: syncMutation.isPending,

    invalidateAll,

    refetchWarehouses: warehousesQuery.refetch,
    refetchStock: stockQuery.refetch,
  };
}
