/**
 * @module org-structure/cascade/ckp-cascade.constants
 * @description T18-C2 (ЦКП KASKAD-AGREGAT) own-module configuration. The ЦКП
 *   roll-up event name + the source-tag a roll-up writes are defined here (NOT
 *   hardcoded across the listener / repository) — Q-12 (no magic strings).
 *
 * Vision (egasi, EP-ORG-014..018): ЦКП oqib chiqadi — operator/ishchi kartasidan
 *   yuqoriga (sex → bo'lim → otdeleniye → CEO). Bir kun bola-kartaga fakt yozilsa,
 *   o'sha kun ota-kartaning subtree o'rtacha/yig'indi achievement'i qayta hisoblanadi
 *   (VERTIKAL kaskad). Bu fabrikatsiya emas — har bola-karta REAL fakt-qiymatidan
 *   o'rtacha/yig'indi olinadi; bola fakti yo'q kunda ota agregati yozilmaydi.
 */

/** EventEmitter2 event name for the post-commit ЦКП-reported signal. */
export const CKP_REPORTED_EVENT = 'org.ckp.reported';

/**
 * `source` tag written on a ROLLED-UP (parent) ckp_fact_values row so a roll-up
 * aggregate is distinguishable from a leaf fact (MANUAL/MES/AI_CHAT/IOT). The
 * roll-up never overwrites a leaf fact: it only writes the parent's own daily
 * aggregate row keyed on (parent_card, fact_date, employee=NULL, product=NULL).
 */
export const CKP_ROLLUP_SOURCE = 'ROLLUP';

/**
 * Roll-up aggregate mode. The parent card's daily achievement is the AVG of its
 * direct+descendant leaf facts' achievement% for that day (vision: "o'rtacha
 * bajarish"). actual/target are SUMmed so the parent shows total throughput.
 * Kept as an explicit constant so the owner can switch AVG↔SUM-only without
 * touching the SQL shape.
 */
export const CKP_ROLLUP_ACHIEVEMENT_MODE = 'AVG' as const;
