/**
 * @module TechCardsMaster
 * @description Phase 1 texkarta MASTER pieces (EP design, --mod-pp):
 *  - GatePills        — 3 traffic-light gates (maket / lab / material)
 *  - VersionHistory   — version snapshot list
 *  - BomRoutesPanel   — BOM + marshrut lists with compact add-forms
 *  - CreateCardDialog — manual master-create form
 * No async state of its own; handlers come from the TechCards orchestrator.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FlaskConical, Image as ImageIcon, Boxes, GitBranch } from "lucide-react";
import { EPCard, EPStatusPill, EPEmptyState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import type { TechCard, BomRow, RouteRow, VersionRow, CreateCardForm } from "./TechCardsTypes";

// ── GatePills ────────────────────────────────────────────────────────────────
export function GatePills({ card, hasBom }: { card: TechCard; hasBom: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="gate-pills">
      <EPStatusPill tone={card.maketApproved ? "success" : "warning"} data-testid="gate-maket">
        <ImageIcon className="h-3 w-3 mr-1" />
        {card.maketApproved
          ? tLabel("common.TechCardsMaster.maketTasdiq", "Maket tasdiqlangan")
          : tLabel("common.TechCardsMaster.maketKutil", "Maket kutilmoqda")}
      </EPStatusPill>
      <EPStatusPill tone={card.labApproved ? "success" : "warning"} data-testid="gate-lab">
        <FlaskConical className="h-3 w-3 mr-1" />
        {card.labApproved
          ? tLabel("common.TechCardsMaster.labTasdiq", "Lab tasdiqlangan")
          : tLabel("common.TechCardsMaster.labKutil", "Lab kutilmoqda")}
      </EPStatusPill>
      <EPStatusPill tone={hasBom ? "success" : "neutral"} data-testid="gate-material">
        <Boxes className="h-3 w-3 mr-1" />
        {hasBom
          ? tLabel("common.TechCardsMaster.materialBor", "Material (BOM) bor")
          : tLabel("common.TechCardsMaster.materialYoq", "Material kiritilmagan")}
      </EPStatusPill>
    </div>
  );
}

// ── VersionHistory ───────────────────────────────────────────────────────────
export function VersionHistory({ versions }: { versions: VersionRow[] }) {
  if (!versions.length) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="versions-empty">
        {tLabel("common.TechCardsMaster.versiyaYoq", "Versiya tarixi hali yo'q")}
      </p>
    );
  }
  return (
    <ul className="space-y-1.5" data-testid="versions-list">
      {versions.map((v) => (
        <li key={v.id} className="flex items-center gap-2 text-sm">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">v{v.version}</span>
          <span className="text-muted-foreground">
            {v.changedAt ? new Date(v.changedAt).toLocaleString("uz-UZ") : "-"}
          </span>
          {v.changedBy != null && (
            <span className="text-muted-foreground">· #{v.changedBy}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// ── BomRoutesPanel ───────────────────────────────────────────────────────────
interface BomRoutesPanelProps {
  bom: BomRow[];
  routes: RouteRow[];
  isBusy: boolean;
  onAddBom: (item: { materialCode: string; quantity: number; unit: string; layer?: string }) => void;
  onAddRoute: (route: { opSeq: number; operation: string; normPerHour?: number; minRazryad?: number }) => void;
}

export function BomRoutesPanel({ bom, routes, isBusy, onAddBom, onAddRoute }: BomRoutesPanelProps) {
  const [mat, setMat] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [op, setOp] = useState("");
  const [opSeq, setOpSeq] = useState("");
  const [norm, setNorm] = useState("");

  const addBom = () => {
    if (!mat.trim() || !qty) return;
    onAddBom({ materialCode: mat.trim(), quantity: Number(qty), unit: unit.trim() || "kg" });
    setMat(""); setQty(""); setUnit("kg");
  };
  const addRoute = () => {
    if (!op.trim() || !opSeq) return;
    onAddRoute({ opSeq: Number(opSeq), operation: op.trim(), normPerHour: norm ? Number(norm) : undefined });
    setOp(""); setOpSeq(""); setNorm("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* BOM */}
      <EPCard module="pp" padding={14}>
        <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
          <Boxes className="h-4 w-4" /> {tLabel("common.TechCardsMaster.bom", "Materiallar (BOM)")}
        </p>
        {bom.length === 0 ? (
          <EPEmptyState icon={Boxes} variant="inline" title={tLabel("common.TechCardsMaster.bomYoq", "BOM qatori yo'q")} />
        ) : (
          <ul className="space-y-1 mb-3" data-testid="bom-list">
            {bom.map((b) => (
              <li key={b.id} className="flex justify-between text-sm border-b last:border-0 py-1">
                <span className="font-medium">{b.materialCode}</span>
                <span className="text-muted-foreground">{b.quantity} {b.unit}{b.layer ? ` · ${b.layer}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-1.5 flex-wrap">
          <Input className="h-8 flex-1 min-w-[90px]" placeholder={tLabel("common.TechCardsMaster.materialKodi", "Material kodi")} value={mat} onChange={(e) => setMat(e.target.value)} data-testid="input-bom-material" />
          <Input className="h-8 w-20" type="number" placeholder={tLabel("common.TechCardsMaster.miqdor", "Miqdor")} value={qty} onChange={(e) => setQty(e.target.value)} data-testid="input-bom-qty" />
          <Input className="h-8 w-16" placeholder="kg" value={unit} onChange={(e) => setUnit(e.target.value)} data-testid="input-bom-unit" />
          <Button size="sm" className="h-8" onClick={addBom} disabled={isBusy} data-testid="btn-add-bom">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </EPCard>

      {/* Routes */}
      <EPCard module="pp" padding={14}>
        <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
          <GitBranch className="h-4 w-4" /> {tLabel("common.TechCardsMaster.marshrut", "Marshrut (operatsiyalar)")}
        </p>
        {routes.length === 0 ? (
          <EPEmptyState icon={GitBranch} variant="inline" title={tLabel("common.TechCardsMaster.marshrutYoq", "Marshrut qatori yo'q")} />
        ) : (
          <ul className="space-y-1 mb-3" data-testid="routes-list">
            {routes.map((r) => (
              <li key={r.id} className="flex justify-between text-sm border-b last:border-0 py-1">
                <span><span className="text-muted-foreground mr-1">{r.opSeq}.</span><span className="font-medium">{r.operation}</span></span>
                <span className="text-muted-foreground">{r.normPerHour ? `${r.normPerHour}/soat` : ""}{r.isCore ? " · core" : ""}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-1.5 flex-wrap">
          <Input className="h-8 w-16" type="number" placeholder="№" value={opSeq} onChange={(e) => setOpSeq(e.target.value)} data-testid="input-route-seq" />
          <Input className="h-8 flex-1 min-w-[90px]" placeholder={tLabel("common.TechCardsMaster.operatsiya", "Operatsiya")} value={op} onChange={(e) => setOp(e.target.value)} data-testid="input-route-op" />
          <Input className="h-8 w-24" type="number" placeholder={tLabel("common.TechCardsMaster.norma", "Norma/soat")} value={norm} onChange={(e) => setNorm(e.target.value)} data-testid="input-route-norm" />
          <Button size="sm" className="h-8" onClick={addRoute} disabled={isBusy} data-testid="btn-add-route">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </EPCard>
    </div>
  );
}

// ── CreateCardDialog ─────────────────────────────────────────────────────────
interface CreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateCardForm;
  setForm: (f: CreateCardForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}

const DIRECTIONS = ["ofs-kar", "ofs-gof", "flx-gof"];

export function CreateCardDialog({ open, onOpenChange, form, setForm, onSubmit, isPending }: CreateCardDialogProps) {
  const set = (k: keyof CreateCardForm, v: string) => setForm({ ...form, [k]: v });
  const valid = form.name.trim().length > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle data-testid="create-card-title">
            {tLabel("common.TechCardsMaster.yangiTexkarta", "Yangi texkarta (master)")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={tLabel("common.TechCardsMaster.kod", "Kod")}>
            <Input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="TC-001" data-testid="input-card-code" />
          </Field>
          <Field label={tLabel("common.TechCardsMaster.nomi", "Nomi *")}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="input-card-name" />
          </Field>
          <Field label={tLabel("common.TechCardsMaster.yonalish", "Yo'nalish")}>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.direction}
              onChange={(e) => set("direction", e.target.value)}
              data-testid="select-card-direction"
            >
              <option value="">—</option>
              {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label={tLabel("common.TechCardsMaster.materialTuri", "Material turi")}>
            <Input value={form.materialType} onChange={(e) => set("materialType", e.target.value)} data-testid="input-card-material" />
          </Field>
          <Field label={tLabel("common.TechCardsMaster.mahsulotTuri", "Mahsulot turi")}>
            <Input value={form.productType} onChange={(e) => set("productType", e.target.value)} data-testid="input-card-product" />
          </Field>
          <Field label={tLabel("common.TechCardsMaster.formatKodi", "Format kodi")}>
            <Input value={form.formatCode} onChange={(e) => set("formatCode", e.target.value)} placeholder="105" data-testid="input-card-format-code" />
          </Field>
          <Field label={tLabel("common.TechCardsMaster.formatA", "Format A (mm)")}>
            <Input type="number" value={form.formatA} onChange={(e) => set("formatA", e.target.value)} data-testid="input-card-format-a" />
          </Field>
          <Field label={tLabel("common.TechCardsMaster.formatB", "Format B (mm)")}>
            <Input type="number" value={form.formatB} onChange={(e) => set("formatB", e.target.value)} data-testid="input-card-format-b" />
          </Field>
          <Field label={tLabel("common.TechCardsMaster.gofraProfil", "Gofra profil")}>
            <Input value={form.gofraProfile} onChange={(e) => set("gofraProfile", e.target.value)} placeholder="E / B / C" data-testid="input-card-gofra" />
          </Field>
          <Field label={tLabel("common.TechCardsMaster.chiqindiFoiz", "Chiqindi %")}>
            <Input type="number" value={form.scrapPct} onChange={(e) => set("scrapPct", e.target.value)} data-testid="input-card-scrap" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tLabel("common.cancel", "Bekor qilish")}
          </Button>
          <Button onClick={onSubmit} disabled={!valid || isPending} data-testid="btn-create-card-submit">
            <Plus className="h-4 w-4 mr-1" />
            {tLabel("common.TechCardsMaster.saqlash", "Saqlash")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
