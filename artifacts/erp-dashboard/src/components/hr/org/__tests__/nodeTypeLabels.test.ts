/**
 * 2026-07-14 (egasi spec): the org-chart tier taxonomy is now a single canonical 6-tier
 * bilingual (UZ/RU) map — ORG_TIERS (L0 Egasi..L5 Sektsiya/Sektor) — instead of the old
 * separate depth-based LEVEL_LABELS (5 entries, UZ-only) and per-value NODE_TYPE_LABELS
 * (8 entries, UZ-only). Every existing node_type string is preserved (no backend/DB change,
 * no card gets reclassified) — only labels + tier-grouping + color changed. This test also
 * proves components/hr/orgnode/types.ts now RE-EXPORTS from this file (not a hand-synced
 * second copy) — the historical drift bug (its LEVEL_COLORS had only 5 of the sibling's 7
 * entries) is now structurally impossible.
 */
import { describe, it, expect } from "vitest";
import {
  ORG_TIERS,
  NODE_TYPE_LABELS as ORG_LABELS,
  resolveNodeTypeLabel,
  resolveLevelLabel,
  resolveTierColor,
} from "../types";
import {
  ORG_TIERS as ORGNODE_TIERS,
  NODE_TYPE_LABELS as ORGNODE_LABELS,
} from "../../orgnode/types";

describe("ORG_TIERS — 6-tier bilingual canonical taxonomy (owner spec 2026-07-14)", () => {
  it("has exactly 6 tiers, L0-L5, each with a non-empty UZ and RU name", () => {
    expect(ORG_TIERS).toHaveLength(6);
    ORG_TIERS.forEach((tier, i) => {
      expect(tier.level).toBe(i);
      expect(tier.uz.length).toBeGreaterThan(0);
      expect(tier.ru.length).toBeGreaterThan(0);
    });
  });

  it("matches the owner's exact 6-tier list", () => {
    expect(ORG_TIERS.map((t) => t.uz)).toEqual([
      "Egasi",
      "Bosh Direktor",
      "Yo'nalish direktorlari",
      "Departament",
      "Bo'lim/Otdel",
      "Sektsiya/Sektor",
    ]);
    expect(ORG_TIERS.map((t) => t.ru)).toEqual([
      "Владелец",
      "Генеральный директор",
      "Директора направлений",
      "Департамент",
      "Отдел",
      "Секция/Сектор",
    ]);
  });

  it("every pre-existing node_type value (owner/top_director/director/department/otdeleniye/otdel/sektsiya/sektor) still resolves to a tier — no card is reclassified", () => {
    const allTypes = ORG_TIERS.flatMap((t) => t.types);
    for (const type of ["owner", "top_director", "director", "department", "otdeleniye", "otdel", "sektsiya", "sektor"]) {
      expect(allTypes).toContain(type);
    }
  });

  it("legacy off-map values (ceo, section) still resolve to a tier for color/label fallback, even though they're not offered in the create-dropdown", () => {
    expect(resolveNodeTypeLabel("ceo", "uz")).toBe("Bosh Direktor");
    expect(resolveNodeTypeLabel("section", "uz")).toBe("Sektsiya/Sektor");
    expect(ORG_LABELS.ceo).toBeUndefined();
    expect(ORG_LABELS.section).toBeUndefined();
  });

  it("components/hr/orgnode/types.ts re-exports the SAME reference (no more hand-synced second copy)", () => {
    expect(ORGNODE_TIERS).toBe(ORG_TIERS);
    expect(ORGNODE_LABELS).toBe(ORG_LABELS);
  });
});

describe("resolveNodeTypeLabel — per-value dropdown/badge text", () => {
  it("returns the UZ or RU label per language for every creatable value", () => {
    expect(resolveNodeTypeLabel("owner", "uz")).toBe("Egasi");
    expect(resolveNodeTypeLabel("owner", "ru")).toBe("Владелец");
    expect(resolveNodeTypeLabel("otdeleniye", "uz")).toBe("Departament");
    expect(resolveNodeTypeLabel("otdeleniye", "ru")).toBe("Департамент");
  });

  it("no two node_type keys share the same display label within a language (would be indistinguishable in the dropdown)", () => {
    for (const lang of ["uz", "ru"] as const) {
      const seen = new Map<string, string>();
      for (const type of Object.keys(ORG_LABELS)) {
        const label = resolveNodeTypeLabel(type, lang)!;
        expect(seen.has(label)).toBe(false);
        seen.set(label, type);
      }
    }
  });

  it("returns undefined for an unknown node_type (caller falls back to the raw string)", () => {
    expect(resolveNodeTypeLabel("totally-unknown-type", "uz")).toBeUndefined();
  });
});

describe("resolveLevelLabel — legend / depth-fallback text", () => {
  it("resolves levels 0-5 to the tier name, and returns a D{n} fallback beyond that", () => {
    expect(resolveLevelLabel(0, "uz")).toBe("Egasi");
    expect(resolveLevelLabel(5, "ru")).toBe("Секция/Сектор");
    expect(resolveLevelLabel(9, "uz")).toBe("D9");
  });
});

describe("resolveTierColor — card color keyed off TIER (nodeType), not raw tree depth", () => {
  it("a card's color follows its own type regardless of how deep it sits in the tree (owner: 'egasi sektorga ham qarashi mumkin')", () => {
    // A Sektor card (tier 5) reporting directly to Egasi (depth 1, skipping L1-L4) must still
    // render with the Sektor color, not the depth-1 color.
    expect(resolveTierColor("sektor", 1)).toBe(ORG_TIERS[5].color);
    expect(resolveTierColor("sektor", 1)).not.toBe(ORG_TIERS[1].color);
  });

  it("falls back to the depth-indexed color only when node_type is outside the 6-tier map", () => {
    expect(resolveTierColor("some-unmapped-type", 2)).toBe(ORG_TIERS[2].color);
  });
});
