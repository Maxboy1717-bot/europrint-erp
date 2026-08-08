
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module TechCardsTypes
 * @description Shared TypeScript interfaces, constants, and pure utility functions
 * for the TechCards feature. No JSX — safe to import from both .ts and .tsx files.
 */

// ---------------------------------------------------------------------------
// Raw backend shapes (as returned by the API before mapping)
// ---------------------------------------------------------------------------

export interface BackendOperation {
  step?: number;
  equipmentType?: string;
  duration?: number;
  durationMinutes?: number;
  description?: string;
  operationDescription?: string;
}

export interface BackendNorm {
  materialName: string;
  normQuantityPer1000: number;
  unit: string;
  wastePercentage?: number;
}

// ---------------------------------------------------------------------------
// Domain types used throughout the TechCards feature
// ---------------------------------------------------------------------------

export interface TechCard {
  id: string;
  code?: string;
  name: string;
  direction?: string;
  materialType?: string;
  productType: string;
  formatA: number;
  formatB: number;
  formatCode?: string;
  gofraProfile?: string;
  scrapPct?: number;
  status?: string;        // draft | approved | archived
  version?: number;
  labApproved?: boolean;
  maketApproved?: boolean;
  totalDurationMinutes?: number;
  setupDurationMinutes?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  calculatedByAI?: boolean;
  basedOnOrdersCount?: number;
  operations?: Array<{
    operationName: string;
    machineCode: string;
    setupTime: number;
    machineTime: number;
    sequence: number;
  }>;
  materials?: Array<{
    materialName: string;
    quantity: number;
    unit: string;
    wastagePercent: number;
  }>;
}

// ── Phase 1 master child rows ────────────────────────────────────────────────
export interface BomRow { id: number; materialCode: string; quantity: string; unit: string; layer?: string | null; }
export interface RouteRow { id: number; opSeq: number; operation: string; machineId?: number | null; normPerHour?: string | null; setupMinutes?: number | null; minRazryad?: number | null; isCore?: boolean; }
export interface VersionRow { id: number; version: number; changedBy?: number | null; changedAt: string; }

/** Manual master-create form (texkarta master). Strings — coerced on submit. */
export interface CreateCardForm {
  code: string; name: string; direction: string; materialType: string; productType: string;
  formatA: string; formatB: string; formatCode: string; gofraProfile: string; scrapPct: string;
}

export const EMPTY_CREATE_FORM: CreateCardForm = {
  code: '', name: '', direction: '', materialType: '', productType: '',
  formatA: '', formatB: '', formatCode: '', gofraProfile: '', scrapPct: '',
};

export function mapBomRow(r: Record<string, unknown>): BomRow {
  return { id: Number(r.id), materialCode: String(r.material_code ?? r.materialCode ?? ''), quantity: String(r.quantity ?? '0'), unit: String(r.unit ?? 'kg'), layer: (r.layer as string) ?? null };
}
export function mapRouteRow(r: Record<string, unknown>): RouteRow {
  return { id: Number(r.id), opSeq: Number(r.op_seq ?? r.opSeq ?? 0), operation: String(r.operation ?? ''), machineId: (r.machine_id ?? r.machineId) as number ?? null, normPerHour: (r.norm_per_hour ?? r.normPerHour) as string ?? null, setupMinutes: (r.setup_minutes ?? r.setupMinutes) as number ?? null, minRazryad: (r.min_razryad ?? r.minRazryad) as number ?? null, isCore: Boolean(r.is_core ?? r.isCore) };
}
export function mapVersionRow(r: Record<string, unknown>): VersionRow {
  return { id: Number(r.id), version: Number(r.version ?? 0), changedBy: (r.changed_by ?? r.changedBy) as number ?? null, changedAt: String(r.changed_at ?? r.changedAt ?? '') };
}

export interface OptimizeResult {
  cardId: string;
  cardName: string;
  totalMaterialCost: number;
  materialCount: number;
  optimizationSuggestions: Array<{
    material: string;
    currentWastage: number;
    suggestedWastage: number;
    saving: number;
  }>;
  estimatedSaving: number;
  optimizationScore: number;
}

export interface PapkaOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  formatA?: number;
  formatB?: number;
  tiraj?: number;
  status: string;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Escapes HTML special characters to prevent XSS in generated PDF markup. */
export const escHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// ---------------------------------------------------------------------------
// PDF HTML builder (pure — no DOM access, no JSX)
// ---------------------------------------------------------------------------

/** Builds the full HTML string used for the browser print-PDF export. */
export function buildPdfHtml(card: TechCard): string {
  const opsRows =
    card.operations && card.operations.length > 0
      ? card.operations
          .map(
            (op, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escHtml(op.operationName)}</td>
          <td>${escHtml(op.machineCode)}</td>
          <td style="text-align:center">${escHtml(op.setupTime)}</td>
          <td style="text-align:center">${escHtml(op.machineTime)}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" style="text-align:center;color:#888">{tLabel('common.TechCardsTypes.operatsiyalarMavjudEmas', "Operatsiyalar mavjud emas")}</td></tr>`;

  const matRows =
    card.materials && card.materials.length > 0
      ? card.materials
          .map(
            (m, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escHtml(m.materialName)}</td>
          <td style="text-align:center">${escHtml(m.quantity)}</td>
          <td style="text-align:center">${escHtml(m.unit)}</td>
          <td style="text-align:center">${escHtml(m.wastagePercent)}%</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" style="text-align:center;color:#888">{tLabel('common.TechCardsTypes.materiallarMavjudEmas', "Materiallar mavjud emas")}</td></tr>`;

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>Texnologik Karta — ${escHtml(card.name)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
    .logo { font-weight: bold; font-size: 20px; color: #333; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 16px; }
    .meta-item { display: flex; gap: 6px; }
    .meta-label { color: #666; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f0f0f0; padding: 6px 8px; text-align: left; border: 1px solid #ccc; font-size: 11px; text-transform: uppercase; }
    td { padding: 5px 8px; border: 1px solid #ddd; }
    tr:nth-child(even) { background: #fafafa; }
    h3 { font-size: 13px; text-transform: uppercase; color: #444; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 8px; color: #888; font-size: 11px; display: flex; justify-content: space-between; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; background: ${card.isActive ? "#d1fae5" : "#f3f4f6"}; color: ${card.isActive ? "#065f46" : "#374151"}; }
    @media print { body { margin: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">EUROPRINT ERP</div>
    <h1>Texnologik Karta</h1>
    <div>${escHtml(card.name)} <span class="badge">${card.isActive ? "Faol" : "Nofaol"}</span></div>
  </div>
  <h3>{tLabel('common.TechCardsTypes.umumiyMalumotlar', "Umumiy ma'lumotlar")}</h3>
  <div class="meta">
    <div class="meta-item"><span class="meta-label">{tLabel('common.TechCardsTypes.mahsulotTuri', "Mahsulot turi:")}</span> ${escHtml(card.productType)}</div>
    <div class="meta-item"><span class="meta-label">Format:</span> ${escHtml(card.formatA)} × ${escHtml(card.formatB)} mm</div>
    <div class="meta-item"><span class="meta-label">{tLabel('common.TechCardsTypes.jamiDavomiylik', "Jami davomiylik:")}</span> ${escHtml(card.totalDurationMinutes || 0)} daqiqa</div>
    <div class="meta-item"><span class="meta-label">Setup vaqti:</span> ${escHtml(card.setupDurationMinutes || 0)} daqiqa</div>
    <div class="meta-item"><span class="meta-label">AI generatsiya:</span> ${card.calculatedByAI ? "Ha" : "Yo'q"}</div>
    <div class="meta-item"><span class="meta-label">Yaratilgan:</span> ${escHtml(new Date(card.createdAt).toLocaleDateString("uz-UZ"))}</div>
    ${card.notes ? `<div class="meta-item" style="grid-column:span 2"><span class="meta-label">Izoh:</span> ${escHtml(card.notes)}</div>` : ""}
  </div>
  <h3>{tLabel('common.TechCardsTypes.operatsiyalarRouting', "Operatsiyalar (Routing)")}</h3>
  <table>
    <thead><tr><th>#</th><th>{tLabel('common.TechCardsTypes.operatsiyaNomi', "Operatsiya nomi")}</th><th>Mashina kodi</th><th>Setup (min)</th><th>Mashina (min)</th></tr></thead>
    <tbody>${opsRows}</tbody>
  </table>
  <h3>{tLabel('common.TechCardsTypes.materiallarBom', "Materiallar (BOM)")}</h3>
  <table>
    <thead><tr><th>#</th><th>{tLabel('common.TechCardsTypes.materialNomi', "Material nomi")}</th><th>{tLabel('common.TechCardsTypes.miqdor1000', "Miqdor/1000")}</th><th>{tLabel('common.TechCardsTypes.birlik', "Birlik")}</th><th>Chiqindi</th></tr></thead>
    <tbody>${matRows}</tbody>
  </table>
  <div class="footer">
    <span>Europrint ERP — Texnologik karta eksporti</span>
    <span>Sana: ${escHtml(new Date().toLocaleDateString("uz-UZ"))} ${escHtml(new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }))}</span>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Backend mapper
// ---------------------------------------------------------------------------

/** Maps a raw API response record to a typed {@link TechCard}.
 *  Reads snake_case (raw DB columns from the master) with camelCase fallback. */
export function mapBackendCard(raw: Record<string, unknown>): TechCard {
  const pick = (s: string, c: string): unknown => raw[s] ?? raw[c];
  const productType = (pick('product_type', 'productType') as string) || "Noma'lum";
  const formatA = Number(pick('format_a', 'formatA')) || 0;
  const formatB = Number(pick('format_b', 'formatB')) || 0;
  const realName = (raw.name as string) || '';
  const name = realName || `${productType} — ${formatA}x${formatB} mm`;

  const rawOps: BackendOperation[] = [];
  if (raw.operations) {
    try {
      const parsed =
        typeof raw.operations === "string"
          ? JSON.parse(raw.operations)
          : raw.operations;
      if (Array.isArray(parsed)) rawOps.push(...parsed);
    } catch { /* ignore parse errors */ }
  }

  const operations = rawOps.map((op, i) => ({
    sequence: op.step ?? i + 1,
    operationName:
      op.description ||
      op.operationDescription ||
      op.equipmentType ||
      `Operatsiya ${i + 1}`,
    machineCode: op.equipmentType || "-",
    setupTime: 0,
    machineTime: op.durationMinutes ?? op.duration ?? 0,
  }));

  const rawNorms = (raw.norms as BackendNorm[] | undefined) || [];
  const materials = (Array.isArray(rawNorms) ? rawNorms : []).map((n) => ({
    materialName: n.materialName,
    quantity: Number(n.normQuantityPer1000) || 0,
    unit: n.unit || "kg",
    wastagePercent: Number(n.wastePercentage) || 0,
  }));

  const isActiveRaw = pick('is_active', 'isActive');
  const scrap = pick('scrap_pct', 'scrapPct');
  return {
    id: String(raw.id ?? ''),
    code: (raw.code as string) || undefined,
    name,
    direction: (raw.direction as string) || undefined,
    materialType: (pick('material_type', 'materialType') as string) || undefined,
    productType,
    formatA,
    formatB,
    formatCode: (pick('format_code', 'formatCode') as string) || undefined,
    gofraProfile: (pick('gofra_profile', 'gofraProfile') as string) || undefined,
    scrapPct: scrap != null ? Number(scrap) : undefined,
    status: (raw.status as string) || undefined,
    version: pick('version', 'version') != null ? Number(pick('version', 'version')) : undefined,
    labApproved: Boolean(pick('lab_approved', 'labApproved')),
    maketApproved: Boolean(pick('maket_approved', 'maketApproved')),
    totalDurationMinutes: Number(pick('total_duration_minutes', 'totalDurationMinutes')) || 0,
    setupDurationMinutes: Number(pick('setup_duration_minutes', 'setupDurationMinutes')) || 0,
    notes: raw.notes as string | undefined,
    isActive: isActiveRaw !== false,
    createdAt: (pick('created_at', 'createdAt') as string) || new Date().toISOString(),
    calculatedByAI: Boolean(pick('calculated_by_ai', 'calculatedByAI')),
    basedOnOrdersCount: Number(pick('based_on_orders_count', 'basedOnOrdersCount')) || 0,
    operations,
    materials,
  };
}
