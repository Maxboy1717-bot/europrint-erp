import Dexie, { type Table } from "dexie";

export interface OfflinePosProduct {
  id: number;
  barcode: string;
  name: string;
  nameRu: string | null;
  category: string | null;
  unitPrice: number;
  unit: string;
  stockQuantity: number | null;
  minStock: number | null;
  isActive: boolean;
  imageUrl: string | null;
  cachedAt: number;
}

export interface OfflinePendingSale {
  id?: number;
  localId: string;
  items: Array<{ productId: number; quantity: number }>;
  paymentMethod: string;
  customerName?: string;
  discountAmount?: number;
  total: number;
  cartSnapshot: Array<{
    productId: number;
    barcode: string;
    name: string;
    nameRu: string | null;
    quantity: number;
    unitPrice: number;
    unit: string;
    total: number;
    stockQuantity: number | null;
  }>;
  createdAt: number;
  status: "pending" | "syncing" | "synced" | "failed";
  syncError?: string;
  serverSaleNumber?: string;
}

export interface OfflineSyncMeta {
  key: string;
  value: string | number;
}

export class PosDatabase extends Dexie {
  products!: Table<OfflinePosProduct, number>;
  pendingSales!: Table<OfflinePendingSale, number>;
  syncMeta!: Table<OfflineSyncMeta, string>;

  constructor() {
    super("EuroPrintPOS");
    this.version(1).stores({
      products: "id, barcode, name, isActive, cachedAt",
      pendingSales: "++id, localId, status, createdAt",
      syncMeta: "key",
    });
  }
}

export const posDb = new PosDatabase();

export async function cacheProducts(products: OfflinePosProduct[]) {
  await posDb.products.bulkPut(products);
  await posDb.syncMeta.put({ key: "productsCachedAt", value: Date.now() });
}

export async function getCachedProducts(search?: string): Promise<OfflinePosProduct[]> {
  let collection = posDb.products?.filter(p => p.isActive);
  if (search && search.trim()) {
    const q = search.toLowerCase();
    collection = posDb.products?.filter(p =>
      p.isActive &&
      (p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.nameRu?.toLowerCase().includes(q) ?? false))
    );
  }
  return collection.toArray();
}

export async function getCachedProductByBarcode(barcode: string): Promise<OfflinePosProduct | undefined> {
  return posDb.products.where("barcode").equals(barcode).first();
}

export async function savePendingSale(sale: Omit<OfflinePendingSale, "id">): Promise<number> {
  return posDb.pendingSales.add(sale);
}

export async function getPendingSales(): Promise<OfflinePendingSale[]> {
  return posDb.pendingSales.where("status").anyOf(["pending", "failed"]).toArray();
}

export async function getAllPendingCount(): Promise<number> {
  return posDb.pendingSales.where("status").anyOf(["pending", "syncing"]).count();
}

export async function updateSaleStatus(
  id: number,
  status: OfflinePendingSale["status"],
  extra?: Partial<OfflinePendingSale>
) {
  await posDb.pendingSales.update(id, { status, ...extra });
}

export async function decreaseLocalStock(productId: number, quantity: number) {
  const product = await posDb.products.get(productId);
  if (product) {
    const newQty = Math.max(0, (Number(product.stockQuantity) || 0) - quantity);
    await posDb.products.update(productId, { stockQuantity: newQty });
  }
}
