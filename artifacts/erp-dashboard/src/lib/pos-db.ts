/**
 * @module pos-db
 * @description Frontend utility / library module.
 */

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

    // ─── SCHEMA MIGRATION CHAIN ──────────────────────────────────────────────
    // Dexie applies version() chains in order. Each new schema change MUST add
    // a new .version(N) call with the COMPLETE store definition (Dexie diffs
    // store strings to figure out which indexes to add/drop). Previous .version
    // calls MUST stay — they describe upgrade paths for users still on an
    // older DB.
    //
    // PATTERN for adding a field/index:
    //   1. Bump version number by 1
    //   2. Re-declare ALL stores (not just the changed one — see Dexie docs)
    //   3. Add .upgrade(tx => …) to backfill the new field for existing rows.
    //      Even a no-op modify(() => {}) forces a row rewrite so the new index
    //      is populated.
    //   4. If introducing a NEW store, only declare it from this version on.
    //   5. NEVER edit a previously-shipped .version() — it breaks users in mid
    //      upgrade.
    //
    // Compound indexes: use "[fieldA+fieldB]" — useful for status+createdAt
    // sorting (current pendingSales query uses status filter + createdAt order
    // independently; bump to compound if we ever hit perf issues).
    this.version(1).stores({
      products: "id, barcode, name, isActive, cachedAt",
      pendingSales: "++id, localId, status, createdAt",
      syncMeta: "key",
    });

    // Version 2 reserved for the first additive migration. Once you add a real
    // schema change here, drop the seed-only upgrade() and replace it with the
    // actual modify() backfill. Until then the chain still proves the pattern
    // works end-to-end (Dexie executes upgrade hooks on first open after the
    // version bump only; idempotent no-op modify is safe).
    this.version(2)
      .stores({
        products: "id, barcode, name, isActive, cachedAt",
        pendingSales: "++id, localId, status, createdAt",
        syncMeta: "key",
      })
      .upgrade(async (tx) => {
        // Future migrations go here. Examples:
        //   await tx.table("pendingSales").toCollection().modify(row => {
        //     row.discountId = row.discountId ?? null;
        //   });
        //   await tx.table("products").toCollection().modify(row => {
        //     row.taxRate = row.taxRate ?? 0;
        //   });
        // No-op: keep the upgrade callback so Dexie acknowledges the version
        // bump even though no fields changed yet. Touching the meta-row makes
        // the v1 → v2 transition observable for logging if we ever need it.
        await tx
          .table("syncMeta")
          .put({ key: "schemaUpgradedTo", value: 2 });
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
