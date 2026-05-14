/**
 * WarehouseKirimWizard.tsx
 * ERP — 5 bosqichli kirim wizard.
 * Har ombor uchun o'ziga xos form: sarlavha, maydon label, ko'rsatma.
 * URL: /wms/kirim-new?warehouseId=ID
 */
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";

import {
  type Warehouse, type Material, type LineItem,
  KIRIM_CONFIG, DEFAULT_CFG, STEPS, mkLine,
} from "./WarehouseKirimWizardTypes";
import { Step1, Step2, Step3, Step4, Step5 } from "./WarehouseKirimWizardSteps";
import { WizardHeader, StepIndicator, NavigationBar } from "./WarehouseKirimWizardSections";

export default function WarehouseKirimWizard() {
  const [location, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ id: number; movementNumber: string } | null>(null);

  const [header, setHeader] = useState({
    toWarehouseId: "", supplierName: "", supplierTin: "",
    contractNumber: "", waybillNumber: "",
    arrivalDate: new Date().toISOString().slice(0, 10),
    currency: "UZS", notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([mkLine()]);

  const urlWarehouseId = useMemo(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    return new URLSearchParams(search).get("warehouseId") ?? "";
  }, [location]);

  const activeWarehouse = useMemo(() =>
    warehouses.find(w => String(w.id) === header.toWarehouseId) ?? null,
  [warehouses, header.toWarehouseId]);

  const cfg = useMemo(() => {
    if (!activeWarehouse?.code) return DEFAULT_CFG;
    return KIRIM_CONFIG[activeWarehouse.code] ?? DEFAULT_CFG;
  }, [activeWarehouse]);

  useEffect(() => {
    (async () => {
      try {
        const whs = await apiRequest<Warehouse[]>("GET", "/api/pos/wms/warehouses");
        const list = Array.isArray(whs) ? whs : [];
        setWarehouses(list);

        if (header.toWarehouseId) return;

        if (urlWarehouseId) {
          const ctx = list.find(w => String(w.id) === urlWarehouseId);
          if (ctx) { setHeader(p => ({ ...p, toWarehouseId: String(ctx.id) })); return; }
        }
        const qc = list.find(w => w.code === "QC-HOLD") ?? list.find(w => (w.type ?? "").toLowerCase() === "quarantine");
        if (qc) setHeader(p => ({ ...p, toWarehouseId: String(qc.id) }));

        const mats = await apiRequest<Material[]>("GET", "/api/pos/wms/materials?limit=500");
        setMaterials(Array.isArray(mats) ? mats : []);
      } catch { /* noop */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalValue  = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const totalQty    = lines.reduce((s, l) => s + l.quantity, 0);
  const totalWeight = lines.reduce((s, l) => s + l.weightKg, 0);

  function addLine() { setLines([...lines, mkLine()]); }
  function removeLine(key: string) { setLines(lines.filter(l => l._key !== key)); }
  function updateLine(key: string, field: keyof LineItem, value: string | number | null) {
    setLines(lines.map(l => l._key === key ? { ...l, [field]: value } : l));
  }
  function selectMaterial(key: string, matId: number) {
    const m = materials.find(x => x.id === matId);
    if (!m) return;
    setLines(lines.map(l => l._key === key ? {
      ...l, materialCardId: m.id, materialName: m.name,
      batchNumber: l.batchNumber || `${m.code}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`,
    } : l));
  }

  function canNext() {
    if (step === 1) {
      if (!header.toWarehouseId) return false;
      if (cfg.supplierRequired && !header.supplierName.trim()) return false;
      if (cfg.contractRequired && !header.contractNumber.trim()) return false;
      return true;
    }
    if (step === 2) return lines.length > 0 && lines.every(l => l.materialCardId && l.quantity > 0);
    return true;
  }

  function backTarget() {
    if (urlWarehouseId) return `/warehouse/hub/${activeWarehouse?.code ?? ""}`;
    return "/warehouse/hub";
  }

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        movementTypeCode: "EXTERNAL_IN",
        toWarehouseId: header.toWarehouseId,
        supplierName: header.supplierName,
        documentNumber: header.contractNumber || undefined,
        documentDate: header.arrivalDate,
        notes: header.notes || undefined,
        lines: lines.filter(l => l.materialCardId && l.quantity > 0).map(l => ({
          materialCardId: l.materialCardId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          batchNumber: l.batchNumber || undefined,
          expiryDate: l.expiryDate || undefined,
        })),
        submit: true,
      };
      const result = await apiRequest<{ id: number; movementNumber?: string }>("POST", "/api/pos/movements", payload);
      if (result?.id) {
        await apiRequest("POST", "/api/pos/inventory-passport", {
          movementId: result.id,
          supplierName: header.supplierName,
          contractNumber: header.contractNumber || undefined,
          waybillNumber: header.waybillNumber || undefined,
          quantity: totalQty,
          weightKg: totalWeight > 0 ? totalWeight : undefined,
          certificateNumber: lines[0]?.certificateNumber || undefined,
        }).catch(() => null);
      }
      setCreated({ id: result.id, movementNumber: result.movementNumber ?? `#${result.id}` });
      setStep(5);
    } catch (e) {
      alert("Xato: " + String((e as Error).message));
    } finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <WizardHeader cfg={cfg} activeWarehouse={activeWarehouse} onBack={() => navigate(backTarget())} />
      <StepIndicator step={step} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bosqich {step}: {STEPS[step-1].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Step1 header={header} setHeader={setHeader} warehouses={warehouses} cfg={cfg} />
          )}
          {step === 2 && (
            <Step2
              lines={lines} materials={materials} cfg={cfg}
              currency={header.currency} totalQty={totalQty} totalValue={totalValue}
              onAddLine={addLine} onRemoveLine={removeLine}
              onUpdateLine={updateLine} onSelectMaterial={selectMaterial}
            />
          )}
          {step === 3 && (
            <Step3 lines={lines} cfg={cfg} onUpdateLine={updateLine} />
          )}
          {step === 4 && (
            <Step4
              lines={lines} header={header} activeWarehouse={activeWarehouse}
              cfg={cfg} totalQty={totalQty} totalValue={totalValue}
            />
          )}
          {step === 5 && created && (
            <Step5
              created={created} cfg={cfg}
              onNavigate={navigate}
              onReset={() => { setStep(1); setCreated(null); setLines([mkLine()]); }}
            />
          )}

          <NavigationBar
            step={step}
            saving={saving}
            canNext={canNext()}
            cfg={cfg}
            onBack={() => setStep(Math.max(1, step - 1))}
            onNext={() => setStep(step + 1)}
            onSubmit={submit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
