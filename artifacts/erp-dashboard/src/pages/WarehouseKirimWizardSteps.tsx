/**
 * WarehouseKirimWizardSteps.tsx
 * Wizard step components: Step1–Step5.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import type { KirimConfig, LineItem, Warehouse, Material } from "./WarehouseKirimWizardTypes";

import { useTranslation } from '@/lib/i18n';
// ─── Step 1: Asosiy ma'lumotlar ───────────────────────────────────────────────
interface Step1Props {
  header: {
    toWarehouseId: string; supplierName: string; supplierTin: string;
    contractNumber: string; waybillNumber: string; arrivalDate: string;
    currency: string; notes: string;
  };
  setHeader: (h: Step1Props["header"]) => void;
  warehouses: Warehouse[];
  cfg: KirimConfig;
}
export function Step1({header, setHeader, warehouses, cfg }: Step1Props) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      <div className={`p-3 rounded text-sm ${cfg.bannerClass}`}>
        ℹ️ {cfg.bannerText}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Manzil ombori *</Label>
          <select value={header.toWarehouseId}
                  onChange={e => setHeader({...header, toWarehouseId: e.target.value})}
                  className="w-full mt-1 p-2 border rounded text-sm">
            <option value="">Tanlang</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}{w.code === "QC-HOLD" ? " 🔒" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Kelish sanasi *</Label>
          <Input type="date" value={header.arrivalDate}
                 onChange={e => setHeader({...header, arrivalDate: e.target.value})} />
        </div>
        <div>
          <Label>{cfg.supplierLabel}{cfg.supplierRequired ? " *" : ""}</Label>
          <Input value={header.supplierName}
                 onChange={e => setHeader({...header, supplierName: e.target.value})}
                 placeholder={cfg.supplierPlaceholder} />
        </div>
        {cfg.showTin && (
          <div>
            <Label>Ta'minotchi STIR/INN</Label>
            <Input value={header.supplierTin}
                   onChange={e => setHeader({...header, supplierTin: e.target.value})}
                   placeholder="123456789" />
          </div>
        )}
        <div>
          <Label>{cfg.contractLabel}{cfg.contractRequired ? " *" : " (ixtiyoriy)"}</Label>
          <Input value={header.contractNumber}
                 onChange={e => setHeader({...header, contractNumber: e.target.value})}
                 placeholder={cfg.contractRequired ? "SH-2026/001" : "Ixtiyoriy..."} />
        </div>
        {cfg.showWaybill && (
          <div>
            <Label>Yuk xati raqami</Label>
            <Input value={header.waybillNumber}
                   onChange={e => setHeader({...header, waybillNumber: e.target.value})}
                   placeholder="YX-2026/001" />
          </div>
        )}
        {cfg.showCurrency && (
          <div>
            <Label>Valyuta</Label>
            <select value={header.currency}
                    onChange={e => setHeader({...header, currency: e.target.value})}
                    className="w-full mt-1 p-2 border rounded text-sm">
              <option value="UZS">UZS — O'zbek so'mi</option>
              <option value="USD">USD — AQSh dollari</option>
              <option value="EUR">EUR — Yevro</option>
            </select>
          </div>
        )}
        <div className="col-span-2">
          <Label>Izoh</Label>
          <textarea value={header.notes}
                    onChange={e => setHeader({...header, notes: e.target.value})}
                    className="w-full mt-1 p-2 border rounded text-sm" rows={2}
                    placeholder="Qo'shimcha izoh..." />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Materiallar ──────────────────────────────────────────────────────
interface Step2Props {
  lines: LineItem[];
  materials: Material[];
  cfg: KirimConfig;
  currency: string;
  totalQty: number;
  totalValue: number;
  onAddLine: () => void;
  onRemoveLine: (key: string) => void;
  onUpdateLine: (key: string, field: keyof LineItem, value: string | number | null) => void;
  onSelectMaterial: (key: string, matId: number) => void;
}
export function Step2({ lines, materials, cfg, currency, totalQty, totalValue, onAddLine, onRemoveLine, onUpdateLine, onSelectMaterial }: Step2Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className={`text-sm px-3 py-2 rounded flex-1 mr-3 ${cfg.bannerClass}`}>
          💡 {cfg.step2Hint}
        </div>
        <Button onClick={onAddLine} size="sm"><Plus className="h-4 w-4 mr-1" /> Qator qo'shish</Button>
      </div>
      {lines.map((l, i) => (
        <Card key={l._key} className="border-2 border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Qator #{i + 1}</div>
              {lines.length > 1 && (
                <Button onClick={() => onRemoveLine(l._key)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4 text-[var(--ep-red)]" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>{"Material *"}</Label>
                <select value={l.materialCardId ?? ""}
                        onChange={e => onSelectMaterial(l._key, parseInt(e.target.value, 10))}
                        className="w-full mt-1 p-2 border rounded text-sm">
                  <option value="">Material tanlang</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Miqdor *</Label>
                <Input type="number" min="0" step="any"
                       value={l.quantity || ""}
                       onChange={e => onUpdateLine(l._key, "quantity", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Birlik narxi</Label>
                <Input type="number" min="0" step="any"
                       value={l.unitPrice || ""}
                       onChange={e => onUpdateLine(l._key, "unitPrice", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Partiya № (avto)</Label>
                <Input value={l.batchNumber}
                       onChange={e => onUpdateLine(l._key, "batchNumber", e.target.value)}
                       placeholder="Avto" />
              </div>
              <div>
                <Label>Yaroqlilik muddati</Label>
                <Input type="date" value={l.expiryDate}
                       onChange={e => onUpdateLine(l._key, "expiryDate", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="bg-blue-50 p-3 rounded text-sm">
        <b>Jami:</b> {lines.length} qator · {totalQty.toLocaleString("uz-UZ")} miqdor · {totalValue.toLocaleString("uz-UZ")} {currency || "UZS"}
      </div>
    </div>
  );
}

// ─── Step 3: Inventar pasporti ────────────────────────────────────────────────
interface Step3Props {
  lines: LineItem[];
  cfg: KirimConfig;
  onUpdateLine: (key: string, field: keyof LineItem, value: string | number | null) => void;
}
export function Step3({ lines, cfg, onUpdateLine }: Step3Props) {
  return (
    <div className="space-y-4">
      <div className={`text-sm p-3 rounded ${cfg.bannerClass}`}>
        💡 {cfg.step3Hint}
      </div>
      {lines.map((l, i) => (
        <Card key={l._key}>
          <CardContent className="pt-4">
            <div className="text-sm font-semibold mb-3">Qator #{i + 1} — {l.materialName}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Og'irlik (kg)</Label>
                <Input type="number" min="0" step="any"
                       value={l.weightKg || ""}
                       onChange={e => onUpdateLine(l._key, "weightKg", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Sertifikat / Seriya raqami</Label>
                <Input value={l.certificateNumber}
                       onChange={e => onUpdateLine(l._key, "certificateNumber", e.target.value)}
                       placeholder="CERT-..." />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Step 4: Ko'rib chiqish ───────────────────────────────────────────────────
interface Step4Props {
  lines: LineItem[];
  header: Step1Props["header"];
  activeWarehouse: Warehouse | null;
  cfg: KirimConfig;
  totalQty: number;
  totalValue: number;
}
export function Step4({ lines, header, activeWarehouse, cfg, totalQty, totalValue }: Step4Props) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded space-y-2 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><span className="text-gray-500">Ombor:</span> <b>{activeWarehouse?.name ?? "—"}</b></div>
          <div><span className="text-gray-500">Sana:</span> <b>{header.arrivalDate}</b></div>
          <div><span className="text-gray-500">{cfg.supplierLabel}:</span> <b>{header.supplierName || "—"}</b></div>
          <div><span className="text-gray-500">{cfg.contractLabel}:</span> <b>{header.contractNumber || "—"}</b></div>
          {cfg.showWaybill && <div><span className="text-gray-500">Yuk xati:</span> <b>{header.waybillNumber || "—"}</b></div>}
          {cfg.showCurrency && <div><span className="text-gray-500">Valyuta:</span> <b>{header.currency}</b></div>}
        </div>
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">{"Material"}</th>
              <th className="text-right p-2">Miqdor</th>
              <th className="text-right p-2">Narx</th>
              <th className="text-right p-2">Summa</th>
              <th className="text-left p-2">Partiya №</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(l => (
              <tr key={l._key} className="border-t">
                <td className="p-2">{l.materialName}</td>
                <td className="p-2 text-right font-mono">{l.quantity}</td>
                <td className="p-2 text-right font-mono">{l.unitPrice.toLocaleString("uz-UZ")}</td>
                <td className="p-2 text-right font-mono font-bold">{(l.quantity * l.unitPrice).toLocaleString("uz-UZ")}</td>
                <td className="p-2 font-mono text-xs">{l.batchNumber || "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-gray-50 font-bold">
              <td className="p-2">JAMI</td>
              <td className="p-2 text-right">{totalQty.toLocaleString("uz-UZ")}</td>
              <td />
              <td className="p-2 text-right">{totalValue.toLocaleString("uz-UZ")} {header.currency}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className={`p-3 rounded text-sm ${cfg.bannerClass}`}>
        ℹ️ {cfg.bannerText}
      </div>
    </div>
  );
}

// ─── Step 5: Tasdiqlash (muvaffaqiyat) ────────────────────────────────────────
interface Step5Props {
  created: { id: number; movementNumber: string };
  cfg: KirimConfig;
  onNavigate: (path: string) => void;
  onReset: () => void;
}
export function Step5({ created, cfg, onNavigate, onReset }: Step5Props) {
  return (
    <div className="text-center py-10">
      <CheckCircle2 className="h-20 w-20 text-[var(--ep-green)] mx-auto mb-4" />
      <div className="text-2xl font-bold mb-2">Muvaffaqiyatli yaratildi!</div>
      <div className="text-gray-600 mb-1">Hujjat raqami:</div>
      <div className="text-2xl font-mono font-bold text-[var(--ep-blue)] mb-6">{created.movementNumber}</div>
      <div className="flex gap-3 justify-center flex-wrap">
        <Button onClick={() => onNavigate("/warehouse/hub")} variant="outline">Ombor Hub ga</Button>
        {cfg.successNext === "quarantine" && (
          <Button onClick={() => onNavigate("/wms/quarantine")} className="bg-amber-500 hover:bg-[var(--ep-yellow)]/90">Karantinga →</Button>
        )}
        {cfg.successNext === "fg" && (
          <Button onClick={() => onNavigate("/warehouse/hub/FG-MAIN")} className="bg-emerald-600 hover:bg-[var(--ep-green)]/90">FG Omborga →</Button>
        )}
        {cfg.successNext === "wip" && (
          <Button onClick={() => onNavigate("/warehouse/hub/WIP-MAIN")} className="bg-violet-600 hover:bg-[var(--ep-purple)]/90">WIP Omborga →</Button>
        )}
        <Button onClick={onReset} variant="outline">Yana yaratish</Button>
      </div>
    </div>
  );
}
