/**
 * @module material-code.constants
 * @description T18-C4 master-data: canonical material code format validation.
 *
 * Vision (MASTER_DATA_STANDARTLARI.md §material kod formati):
 *   material_cards.code = [YO'NALISH]-[KAT]-[XUS]-[N]
 *   Misollar:
 *     GF-CARTO-B-001   (gofra · karton · B-profil · #001)
 *     INK-CYAN-001     (siyoh · cyan · #001)         ← XUS bo'limi ixtiyoriy
 *     FG-BOX-GF-001    (tayyor mahsulot · quti · gofra · #001)
 *     OFF-A4-001       (offset · A4 · #001)
 *
 * Qoida 1 (Result<T>), Qoida 12 (no magic regex inline — named here).
 * Q-40: a graceful validator — empty/absent code is accepted (skip), only a
 * NON-EMPTY code that violates the format is rejected; never fabricates a code.
 */

import { Result, Ok, Err } from '@common/result';

/**
 * Canonical code regex:
 *   - 2..4 segments separated by '-'
 *   - each non-final segment: UPPERCASE letters/digits, 1..6 chars (YO'NALISH/KAT/XUS)
 *   - final segment: 1..6 digits (the running number N)
 * Examples matched: GF-CARTO-B-001, INK-CYAN-001, FG-BOX-GF-001, OFF-A4-001, RM-001
 */
export const MATERIAL_CODE_REGEX = /^[A-Z0-9]{1,6}(?:-[A-Z0-9]{1,6}){0,2}-\d{1,6}$/;

/** Human-readable format hint surfaced in validation errors (UZ). */
export const MATERIAL_CODE_FORMAT_HINT =
  "Material kodi [YO'NALISH]-[KAT]-[XUS]-[N] ko'rinishida bo'lishi kerak " +
  '(masalan GF-CARTO-B-001, INK-CYAN-001, FG-BOX-GF-001). ' +
  "Bo'limlar katta harf/raqam, oxirgi bo'lim — tartib raqami.";

/**
 * Validate a material code against the canonical format.
 *
 * Graceful contract (Q-40, xavfsizlik-rels #2):
 *   - empty / null / undefined  → Ok (skip — code optional at this layer; the
 *     DB UNIQUE + create flow handle absence; we do not fabricate a code)
 *   - non-empty + matches regex → Ok
 *   - non-empty + violates      → Err VALIDATION with the format hint
 *
 * @param code raw material code string (may be empty)
 */
export function validateMaterialCode(code: string | null | undefined): Result<void> {
  const trimmed = (code ?? '').trim();
  if (trimmed === '') return Ok(undefined); // absent → graceful skip
  if (!MATERIAL_CODE_REGEX.test(trimmed)) {
    return Err({
      code: 'VALIDATION',
      message: `Noto'g'ri material kod formati: "${trimmed}". ${MATERIAL_CODE_FORMAT_HINT}`,
    });
  }
  return Ok(undefined);
}
