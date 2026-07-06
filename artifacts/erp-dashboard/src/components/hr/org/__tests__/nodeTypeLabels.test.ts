/**
 * G3 (ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06, finding B4): the create-node dropdown
 * (AddNodeDialog.tsx, driven by NODE_TYPE_LABELS) offered only 5 node_type values — no
 * otdeleniye/otdel/sektsiya/sektor, so HR could nest the Vysotskiy-7 tree's 4 lower tiers but
 * couldn't label them with the owner's wall-chart names. This proves both NODE_TYPE_LABELS maps
 * (components/hr/org/types.ts drives AddNodeDialog's create dropdown; components/hr/orgnode/
 * types.ts drives the detail/edit views) now carry all four new values, kept in sync.
 */
import { describe, it, expect } from "vitest";
import { NODE_TYPE_LABELS as ORG_LABELS } from "../types";
import { NODE_TYPE_LABELS as ORGNODE_LABELS } from "../../orgnode/types";

const NEW_TIERS = {
  otdeleniye: "Otdeleniye",
  otdel: "Otdel",
  sektsiya: "Sektsiya",
  sektor: "Sektor",
};

describe("NODE_TYPE_LABELS — G3 Vysotskiy-7 tier vocabulary", () => {
  it("AddNodeDialog's create-dropdown map (components/hr/org/types.ts) includes all four new tiers", () => {
    for (const [type, label] of Object.entries(NEW_TIERS)) {
      expect(ORG_LABELS[type]).toBe(label);
    }
  });

  it("the detail/edit-view map (components/hr/orgnode/types.ts) is kept in sync", () => {
    for (const [type, label] of Object.entries(NEW_TIERS)) {
      expect(ORGNODE_LABELS[type]).toBe(label);
    }
  });

  it("pre-existing tiers are untouched (no regression on owner/top_director/director/department/section)", () => {
    expect(ORG_LABELS).toMatchObject({
      owner: "Egasi", top_director: "Bosh Direktor", director: "Direktor",
      department: "Bo'lim", section: "Sektor",
    });
  });
});
