/**
 * @module technology-grammage.service
 * @description ⭐ Consumer that wires the documented Gofra/Sloy 3-formula engine
 *   ({@link GofraConversionService}) into a corrugated technology card.
 *
 *   Vision: CHAT-TARIXI-YANGI-2026-06-08.md §3 / §29 ("kg ↔ list avtomatik"):
 *     grammage = liner1 + liner2 + (flute × take-up)   (Formula 3)
 *     kg       = m² × (grammage / 1000)                (Formula 2)
 *     m²       = yoyilgan o'lcham × chiqindi            (Formula 1)
 *
 *   This service does NO arithmetic itself — it ONLY gathers master-data from the
 *   live DB (the card's material → its `material_layer_config` layers + the
 *   `pp_flute_types` take-up factors + the material's format dims + the card's
 *   scrap %) and hands every number to the pure {@link GofraConversionService}.
 *
 *   ⭐ HONESTY (Q-40): the live data is intentionally unfilled by the owner
 *   ("egasi o'zi to'ldiradi"). When the card's material has no layer config, no
 *   flute factor, or no dimensions, this returns an HONEST `complete: false`
 *   payload with concrete reasons (UZ) and null numbers — never a fabricated GSM,
 *   never an assumed 1.0 take-up. When the data IS present it returns the real
 *   computed grammage + kg/sheet conversions.
 *
 * @layer Application (PP)
 */

import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
import { typedExecute } from '@shared/db/typed-execute';
import { GofraConversionService } from '../conversion/gofra-conversion.service';
import {
  GOFRA_FACTORS_REPO,
  type IGofraFactorsRepo,
} from '../conversion/i-gofra-factors.repo';
import type {
  FluteFactorConfig,
  FluteType,
  GrammageLayer,
  SheetSpec,
} from '../conversion/gofra-conversion.types';

/** One resolved layer (master-data row) feeding Formula 3 + its take-up provenance. */
interface ResolvedLayer {
  layerIndex: number;
  role: string;
  gsm: number;
  fluteType: string | null;
  /** Take-up factor the card actually used for this flute (after override resolution). */
  takeUpFactorUsed: number | null;
  takeUpSource: 'layer_row' | 'flute_types' | 'unset' | null;
}

/** The card's resolved material (the layer-config owner). */
interface ResolvedMaterial {
  materialCardId: number;
  kod: string;
  name: string;
  formatAmm: number | null;
  formatBmm: number | null;
  source: 'explicit_param' | 'bom_row';
}

/** Read-model returned by the endpoint. Always 200; `complete` flags honesty. */
export interface TechCardGrammageResult {
  technologyCardId: number;
  /** true → real computed numbers; false → honest "data incomplete" (numbers null). */
  complete: boolean;
  /** Concrete UZ reasons when complete=false; empty when complete=true. */
  reasons: string[];
  material: ResolvedMaterial | null;
  layers: ResolvedLayer[];
  /** Effective board grammage (g/m²) via Formula 3 — null when incomplete. */
  effectiveGrammageGsm: number | null;
  /** Per-sheet kg via Formula 1+2 (needs material dims + scrap %) — null when incomplete. */
  kgPerSheet: number | null;
  /** Sheet geometry actually used for the kg chain (null when dims missing). */
  sheetSpecUsed: (SheetSpec & { scrapPct: number | null }) | null;
  /** Echo of the bidirectional helpers so the FE can show kg↔list both ways. */
  conversions: {
    /** How many sheets one kg of this board yields (kg→m²→list). */
    sheetsPerKg: number | null;
    /** Mass of a single sheet (list→m²→kg). */
    kgPerSheet: number | null;
  };
}

interface CardRow {
  id: number;
  material_type: string | null;
  gofra_profile: string | null;
  scrap_pct: string | number | null;
  format_a: number | null;
  format_b: number | null;
  deleted_at: string | null;
}

interface MaterialRow {
  id: number;
  kod: string;
  xom_ashyo: string;
  format_a: string | number | null;
  format_b: string | number | null;
}

interface LayerRow {
  layer_index: number;
  role: string;
  gsm: string | number;
  flute_type: string | null;
  take_up_factor: string | number | null;
}

const VALID_FLUTES: ReadonlySet<string> = new Set(['A', 'B', 'C', 'E', 'BC', 'EB', 'F']);

@Injectable()
export class TechnologyGrammageService {
  constructor(
    private readonly gofra: GofraConversionService,
    @Inject(GOFRA_FACTORS_REPO) private readonly factorsRepo: IGofraFactorsRepo,
  ) {}

  /**
   * Compute the effective corrugated grammage (+ kg/sheet chains) for a tech card.
   * @param cardId  technology_cards.id
   * @param materialCardId  optional explicit material to evaluate against the card;
   *   when omitted, the material is resolved from the card's BOM rows.
   */
  async computeForCard(
    cardId: number,
    materialCardId?: number,
  ): Promise<Result<TechCardGrammageResult>> {
    try {
      // 1. Card must exist (and not be soft-deleted).
      const cardRows = await typedExecute<CardRow>(sql`
        SELECT id, material_type, gofra_profile, scrap_pct, format_a, format_b, deleted_at
        FROM technology_cards
        WHERE id = ${cardId} AND deleted_at IS NULL
        LIMIT 1`);
      const card = Array.isArray(cardRows) ? cardRows[0] : undefined;
      if (!card) {
        return Err(AppErr('NOT_FOUND', 'Texnologik karta topilmadi'));
      }

      const reasons: string[] = [];

      // 2. Resolve the material that owns the layer config.
      const material = await this.resolveMaterial(cardId, materialCardId);
      if (!material) {
        reasons.push(
          "Material aniqlanmadi: kartaga material bog'lanmagan (materialCardId bering yoki BOM qatori qo'shing)",
        );
        return Ok(this.incomplete(cardId, reasons, null, [], card));
      }

      // 3. Load the material's layer config (the per-material layer source).
      const layerRows = await typedExecute<LayerRow>(sql`
        SELECT layer_index, role, gsm, flute_type, take_up_factor
        FROM material_layer_config
        WHERE material_card_id = ${material.materialCardId}
        ORDER BY layer_index`);
      const rows = Array.isArray(layerRows) ? layerRows : [];
      if (rows.length === 0) {
        reasons.push(
          `Data to'liq emas: '${material.kod}' materiali uchun material_layer_config qatorlari yo'q (egasi to'ldirsin)`,
        );
        return Ok(this.incomplete(cardId, reasons, material, [], card));
      }

      // 4. Flute take-up factors from master-data (pp_flute_types; owner-#6 fallback pre-seed).
      const factorsR = await this.factorsRepo.getFluteFactors();
      if (!factorsR.ok) return Err(factorsR.error);
      const fluteFactors = factorsR.data;

      // 5. Build the pure GrammageLayer[] + a per-flute config, recording provenance.
      //    Per-flute factor preference: the layer row's own take_up_factor (explicit
      //    measured override) wins; otherwise the pp_flute_types value. Never 1.0.
      const built = this.buildLayers(rows, fluteFactors);
      const resolved: ResolvedLayer[] = built.resolved;
      const layersForEngine: GrammageLayer[] = built.engineLayers;
      const perFluteConfig: FluteFactorConfig = built.perFluteConfig;

      // Surface any unset flute factors as an honest reason (do NOT guess 1.0).
      for (const r of resolved) {
        if (r.role === 'flute' && r.takeUpSource === 'unset') {
          reasons.push(
            `Data to'liq emas: '${r.fluteType ?? '?'}'-flute uchun take-up faktor sozlanmagan (pp_flute_types yoki layer.take_up_factor kerak)`,
          );
        }
      }

      // 6. Formula 3 — effective grammage. The pure service Errs on any unset flute.
      const grammageR = this.gofra.computeCorrugatedGrammage(layersForEngine, perFluteConfig);
      if (!grammageR.ok) {
        // Engine refused (e.g. unset flute / non-positive gsm) → honest incomplete.
        if (reasons.length === 0) reasons.push(`Grammaj hisoblanmadi: ${grammageR.error.message}`);
        return Ok(this.incomplete(cardId, reasons, material, resolved, card));
      }
      const effectiveGrammageGsm = grammageR.data;

      // 7. Dimensions + scrap for the kg↔sheet chains (Formula 1+2).
      //    Material format dims are the spread (yoyilgan) sheet; card.scrap_pct is the waste.
      const scrapPct = card.scrap_pct == null ? null : Number(card.scrap_pct);
      const hasDims =
        material.formatAmm != null &&
        material.formatBmm != null &&
        material.formatAmm > 0 &&
        material.formatBmm > 0;

      if (!hasDims) {
        reasons.push(
          `Data to'liq emas: '${material.kod}' materialida format_a/format_b o'lchamlari yo'q — kg↔list hisoblab bo'lmaydi (faqat grammaj qaytarildi)`,
        );
        // Grammage IS real here; only the kg/sheet chain is unavailable. complete=false
        // because the full kg<->sheet promise of the endpoint cannot be honoured.
        const partial = this.incomplete(cardId, reasons, material, resolved, card);
        partial.effectiveGrammageGsm = effectiveGrammageGsm;
        return Ok(partial);
      }

      const sheetSpec: SheetSpec = {
        sheetWidthMm: material.formatAmm as number,
        sheetLengthMm: material.formatBmm as number,
        wastePct: scrapPct ?? 0,
      };

      // 8. Chain Formula 1+2 — mass of one sheet, and sheets per kg.
      const kgPerSheetR = this.gofra.sheetsToKg(1, effectiveGrammageGsm, sheetSpec);
      const sheetsPerKgR = this.gofra.kgToSheets(1, effectiveGrammageGsm, sheetSpec);
      if (!kgPerSheetR.ok) return Err(kgPerSheetR.error);
      if (!sheetsPerKgR.ok) return Err(sheetsPerKgR.error);

      return Ok({
        technologyCardId: cardId,
        complete: true,
        reasons: [],
        material,
        layers: resolved,
        effectiveGrammageGsm,
        kgPerSheet: kgPerSheetR.data,
        sheetSpecUsed: { ...sheetSpec, scrapPct },
        conversions: {
          sheetsPerKg: sheetsPerKgR.data,
          kgPerSheet: kgPerSheetR.data,
        },
      });
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  /** Resolve the layer-config-owning material: explicit param first, then the card's BOM. */
  private async resolveMaterial(
    cardId: number,
    materialCardId?: number,
  ): Promise<ResolvedMaterial | null> {
    if (materialCardId != null && Number.isFinite(materialCardId)) {
      const rows = await typedExecute<MaterialRow>(sql`
        SELECT id, kod, xom_ashyo, format_a, format_b
        FROM material_cards
        WHERE id = ${materialCardId} AND is_active = true
        LIMIT 1`);
      const m = Array.isArray(rows) ? rows[0] : undefined;
      if (!m) return null;
      return this.toMaterial(m, 'explicit_param');
    }

    // No explicit material → resolve via the card's BOM rows (material_code → material_cards.kod).
    // Pick the material that actually has layer config (the corrugated board), else the first.
    const bomRows = await typedExecute<MaterialRow & { has_layers: number }>(sql`
      SELECT mc.id, mc.kod, mc.xom_ashyo, mc.format_a, mc.format_b,
             (SELECT count(*)::int FROM material_layer_config mlc WHERE mlc.material_card_id = mc.id) AS has_layers
      FROM tech_card_bom b
      JOIN material_cards mc ON mc.kod = b.material_code AND mc.is_active = true
      WHERE b.technology_card_id = ${cardId}
      ORDER BY has_layers DESC, b.id ASC
      LIMIT 1`);
    const m = Array.isArray(bomRows) ? bomRows[0] : undefined;
    if (!m) return null;
    return this.toMaterial(m, 'bom_row');
  }

  private toMaterial(
    m: MaterialRow,
    source: ResolvedMaterial['source'],
  ): ResolvedMaterial {
    const fa = m.format_a == null ? null : Number(m.format_a);
    const fb = m.format_b == null ? null : Number(m.format_b);
    return {
      materialCardId: Number(m.id),
      kod: String(m.kod),
      name: String(m.xom_ashyo),
      formatAmm: fa != null && Number.isFinite(fa) ? fa : null,
      formatBmm: fb != null && Number.isFinite(fb) ? fb : null,
      source,
    };
  }

  /**
   * Translate DB layer rows into the pure engine's GrammageLayer[] + a per-flute
   * take-up config, recording where each flute's factor came from. Layer-row
   * `take_up_factor` (a measured per-material override) wins over pp_flute_types;
   * if neither is present, the flute is left unset (no 1.0 guess).
   */
  private buildLayers(
    rows: LayerRow[],
    fluteFactors: FluteFactorConfig,
  ): {
    resolved: ResolvedLayer[];
    engineLayers: GrammageLayer[];
    perFluteConfig: FluteFactorConfig;
  } {
    const resolved: ResolvedLayer[] = [];
    const engineLayers: GrammageLayer[] = [];
    const perFluteConfig: FluteFactorConfig = {};

    for (const row of rows) {
      const gsm = Number(row.gsm);
      const role = String(row.role);
      const rawFlute = row.flute_type == null ? null : String(row.flute_type);
      const fluteType = rawFlute && VALID_FLUTES.has(rawFlute) ? (rawFlute as FluteType) : null;

      if (role === 'flute') {
        // Resolve the take-up: layer-row override → pp_flute_types → unset.
        const layerOverride =
          row.take_up_factor == null ? null : Number(row.take_up_factor);
        const masterFactor =
          fluteType != null && fluteFactors[fluteType] != null
            ? Number(fluteFactors[fluteType])
            : null;

        let used: number | null = null;
        let usedSource: ResolvedLayer['takeUpSource'] = 'unset';
        if (layerOverride != null && Number.isFinite(layerOverride) && layerOverride > 0) {
          used = layerOverride;
          usedSource = 'layer_row';
        } else if (masterFactor != null && Number.isFinite(masterFactor) && masterFactor > 0) {
          used = masterFactor;
          usedSource = 'flute_types';
        }

        // Feed the engine: set the per-flute config to the resolved value so
        // computeCorrugatedGrammage uses exactly what we recorded. If unset, we
        // leave it absent so the engine Errs (honest) rather than guessing.
        if (fluteType != null && used != null) {
          perFluteConfig[fluteType] = used;
        }
        engineLayers.push({
          role: 'flute',
          gsm,
          // If flute_type is unknown/missing, pass it through so the engine Errs
          // with a clear "fluteType kerak" message rather than silently treating
          // the row as a liner.
          fluteType: fluteType ?? (rawFlute as FluteType | undefined),
        });
        resolved.push({
          layerIndex: Number(row.layer_index),
          role,
          gsm,
          fluteType: rawFlute,
          takeUpFactorUsed: used,
          takeUpSource: fluteType == null ? 'unset' : usedSource,
        });
      } else {
        engineLayers.push({ role: 'liner', gsm });
        resolved.push({
          layerIndex: Number(row.layer_index),
          role,
          gsm,
          fluteType: rawFlute,
          takeUpFactorUsed: null,
          takeUpSource: null,
        });
      }
    }

    return { resolved, engineLayers, perFluteConfig };
  }

  /** Build an honest incomplete payload (200, numbers null, reasons populated). */
  private incomplete(
    cardId: number,
    reasons: string[],
    material: ResolvedMaterial | null,
    layers: ResolvedLayer[],
    _card: CardRow,
  ): TechCardGrammageResult {
    return {
      technologyCardId: cardId,
      complete: false,
      reasons,
      material,
      layers,
      effectiveGrammageGsm: null,
      kgPerSheet: null,
      sheetSpecUsed: null,
      conversions: { sheetsPerKg: null, kgPerSheet: null },
    };
  }
}
