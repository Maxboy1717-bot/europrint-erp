/**
 * PosMovementKirimSteps — Five wizard step render components.
 * All state lives in the parent (PosMovementKirim); these receive it as props.
 */
import type { HeaderForm, LineItem, KirimConfig, CreatedMovement } from "./PosMovementKirimTypes";
import { generateBatchNumber, fmt } from "./PosMovementKirimTypes";
import { MaterialSearch, PassportRow, ReviewField, SumItem } from "./PosMovementKirimHelpers";

import { useTranslation } from '@/lib/i18n';
// ─── Step 1 — Header form ─────────────────────────────────────────────────────
interface Step1Props {
  header: HeaderForm;
  errors: Record<string, string>;
  warehouses: Array<{ id: string; code: string | null; name: string | null; type: string | null; isActive: boolean }>;
  warehousesLoading: boolean;
  kirimCfg: KirimConfig;
  setH: <K extends keyof HeaderForm>(key: K, val: HeaderForm[K]) => void;
  goNext: () => void;
}

export function Step1Header({header, errors, warehouses, warehousesLoading, kirimCfg, setH, goNext }: Step1Props) {
  const { t } = useTranslation('common');
  return (
    <div className="pos-card pos-fade-in">
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--pos-accent)" }}>
        {t("bosqich1AsosiyMalumotlar")}
      </div>
      <div style={{ background: kirimCfg.bannerBg, border: `1px solid ${kirimCfg.bannerBorder}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: kirimCfg.bannerTextColor, marginBottom: 20, lineHeight: 1.5 }}>
        ℹ️ {kirimCfg.bannerText}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label className="_lbl">{t("manzilOmbori")}</label>
          <select className={`pos-input${errors.toWarehouseId ? " _err" : ""}`} value={header.toWarehouseId} onChange={e => setH("toWarehouseId", e.target.value)} disabled={warehousesLoading}>
            <option value="">{warehousesLoading ? "Yuklanmoqda..." : "Ombor tanlang"}</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.code ? `${w.code} — ${w.name ?? ""}` : (w.name ?? w.id)}
                {(w.type ?? "").toLowerCase() === "quarantine" ? "  🔒 (tavsiya etilgan)" : ""}
              </option>
            ))}
          </select>
          {errors.toWarehouseId && <div className="_errmsg">{errors.toWarehouseId}</div>}
        </div>
        <div>
          <label className="_lbl">{t("kelishSanasi1")}</label>
          <input className={`pos-input${errors.arrivalDate ? " _err" : ""}`} type="date" value={header.arrivalDate} onChange={e => setH("arrivalDate", e.target.value)} />
          {errors.arrivalDate && <div className="_errmsg">{errors.arrivalDate}</div>}
        </div>
        <div>
          <label className="_lbl">{kirimCfg.supplierLabel}{kirimCfg.supplierRequired ? " *" : ""}</label>
          <input className={`pos-input${errors.supplierName ? " _err" : ""}`} value={header.supplierName} onChange={e => setH("supplierName", e.target.value)} placeholder={`Masalan: ${kirimCfg.supplierLabel}...`} />
          {errors.supplierName && <div className="_errmsg">{errors.supplierName}</div>}
        </div>
        <div>
          <label className="_lbl">{kirimCfg.contractLabel}{kirimCfg.contractRequired ? " *" : ""}</label>
          <input className={`pos-input${errors.contractNumber ? " _err" : ""}`} value={header.contractNumber} onChange={e => setH("contractNumber", e.target.value)} placeholder={kirimCfg.contractRequired ? "Masalan: SH-2026/001" : "Ixtiyoriy..."} />
          {errors.contractNumber && <div className="_errmsg">{errors.contractNumber}</div>}
        </div>
        {kirimCfg.showWaybill && (
          <div>
            <label className="_lbl">{t("yukXatiRaqami")}</label>
            <input className="pos-input" value={header.waybillNumber} onChange={e => setH("waybillNumber", e.target.value)} placeholder="Masalan: YX-2026/001" />
          </div>
        )}
        {kirimCfg.showCurrency && (
          <div>
            <label className="_lbl">{t("valyuta")}</label>
            <select className="pos-input" value={header.currency} onChange={e => setH("currency", e.target.value as "UZS" | "USD" | "EUR")}>
              <option value="UZS">{t("uzsOzbekSomi1")}</option>
              <option value="USD">USD — AQSh dollari</option>
              <option value="EUR">{t("eurYevro")}</option>
            </select>
          </div>
        )}
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="_lbl">{t("Izoh")}</label>
          <textarea className="pos-input" rows={3} value={header.notes} onChange={e => setH("notes", e.target.value)} placeholder={t("qoshimchaIzoh")} style={{ resize: "vertical" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <button className="pos-btn pos-btn-primary" onClick={goNext}>{t("keyingiMateriallar")}</button>
      </div>
    </div>
  );
}

// ─── Step 2 — Materials lines ─────────────────────────────────────────────────
interface Step2Props {
  lines: LineItem[];
  lineErrors: Record<string, Record<string, string>>;
  header: HeaderForm;
  kirimCfg: KirimConfig;
  totalQty: number;
  totalValue: number;
  totalWeight: number;
  addLine: () => void;
  removeLine: (i: number) => void;
  updateLine: (i: number, key: Exclude<keyof LineItem, "_key">, val: string) => void;
  goBack: () => void;
  goNext: () => void;
}

export function Step2Lines({ lines, lineErrors, header, kirimCfg, totalQty, totalValue, totalWeight, addLine, removeLine, updateLine, goBack, goNext }: Step2Props) {
  return (
    <div className="pos-fade-in">
      <div className="pos-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pos-accent)" }}>{t("bosqich2MateriallarRoyxati")}</div>
          <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={addLine}>{t("qatorQoshish1")}</button>
        </div>
        <div style={{ fontSize: 11, color: kirimCfg.bannerTextColor, background: kirimCfg.bannerBg, border: `1px solid ${kirimCfg.bannerBorder}`, borderRadius: 6, padding: "6px 10px", marginBottom: 14 }}>
          💡 {kirimCfg.step2Hint}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.2fr 1fr 1fr 1fr auto", gap: 6, marginBottom: 8 }}>
          {["Material", "Miqdor*", "Narx*", "Partiya", "Muddat", "Og'irlik kg", "Sertifikat", "Izoh", ""].map(h => (
            <div key={h} style={{ fontSize: 10, color: "var(--pos-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {lines.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--pos-text-muted)", fontSize: 13 }}>
            {t("hozirchaMateriallarYoqQatorQoshish")}
          </div>
        )}
        {lines.map((line, i) => {
          const le = lineErrors[i] ?? {};
          return (
            <div key={line._key} style={{ marginBottom: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1.2fr 1fr 1fr 1fr auto", gap: 6, alignItems: "flex-start" }}>
                <div>
                  <MaterialSearch value={line.materialCardId} name={line.materialName} onChange={(id, name, materialType, category) => {
                    updateLine(i, "materialCardId", id);
                    updateLine(i, "materialName", name);
                    if (!line.batchNumber) updateLine(i, "batchNumber", generateBatchNumber(materialType, category));
                  }} />
                  {le.materialCardId && <div className="_errmsg">{le.materialCardId}</div>}
                </div>
                <div>
                  <input className={`pos-input pos-mono${le.quantity ? " _err" : ""}`} value={line.quantity} onChange={e => updateLine(i, "quantity", e.target.value)} placeholder="0" type="number" min="0" step="any" />
                  {le.quantity && <div className="_errmsg">{le.quantity}</div>}
                </div>
                <div>
                  <input className={`pos-input pos-mono${le.unitPrice ? " _err" : ""}`} value={line.unitPrice} onChange={e => updateLine(i, "unitPrice", e.target.value)} placeholder="0.00" type="number" min="0" step="any" />
                  {le.unitPrice && <div className="_errmsg">{le.unitPrice}</div>}
                </div>
                <input className="pos-input" value={line.batchNumber} onChange={e => updateLine(i, "batchNumber", e.target.value)} placeholder="LOT-001" />
                <input className="pos-input" type="date" value={line.expiryDate} onChange={e => updateLine(i, "expiryDate", e.target.value)} />
                <input className="pos-input pos-mono" value={line.weightKg} onChange={e => updateLine(i, "weightKg", e.target.value)} placeholder="0.00" type="number" min="0" step="any" />
                <input className="pos-input" value={line.certificateNumber} onChange={e => updateLine(i, "certificateNumber", e.target.value)} placeholder="SERT-001" />
                <input className="pos-input" value={line.notes} onChange={e => updateLine(i, "notes", e.target.value)} placeholder={t("Izoh")} />
                <button className="pos-btn pos-btn-ghost" style={{ padding: "9px 10px", color: "var(--pos-danger)", flexShrink: 0 }} onClick={() => removeLine(i)} title={t("qatorniOchirish")}>✕</button>
              </div>
              {(parseFloat(line.quantity) > 0 && parseFloat(line.unitPrice) > 0) && (
                <div style={{ textAlign: "right", fontSize: 11, color: "var(--pos-text-muted)", marginTop: 2, paddingRight: 36 }}>
                  {t("jami")}<span className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>{fmt(parseFloat(line.quantity) * parseFloat(line.unitPrice), header.currency)}</span>
                </div>
              )}
            </div>
          );
        })}
        {lines.length > 0 && (
          <div style={{ borderTop: "1px solid var(--pos-border)", paddingTop: 12, marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 24 }}>
            <span style={{ fontSize: 13, color: "var(--pos-text-muted)" }}>{t("jamiQatorlar")}<strong className="pos-mono">{lines.length}</strong></span>
            <span style={{ fontSize: 13, color: "var(--pos-text-muted)" }}>{t("jamiMiqdor1")}<strong className="pos-mono">{totalQty.toLocaleString("uz-UZ")}</strong></span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{t("jamiSumma1")}<span className="pos-mono" style={{ color: "var(--pos-accent)" }}>{fmt(totalValue, header.currency)}</span></span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="pos-btn pos-btn-ghost" onClick={goBack}>{t("orqaga")}</button>
        <button className="pos-btn pos-btn-primary" onClick={goNext}>{t("keyingiInventarPasporti")}</button>
      </div>
    </div>
  );
}

// ─── Step 3 — Passport preview ────────────────────────────────────────────────
interface Step3Props { header: HeaderForm; lines: LineItem[]; totalQty: number; totalWeight: number; totalValue: number; goBack: () => void; goNext: () => void; }

export function Step3Passport({ header, lines, totalQty, totalWeight, totalValue, goBack, goNext }: Step3Props) {
  return (
    <div className="pos-fade-in">
      <div className="pos-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pos-accent)", marginBottom: 18 }}>{t("bosqich3InventarPasporti")}</div>
        <div style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#1E40AF", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <span>{t("barchaTashqiKirimlarAvval")}<strong>karantinga</strong> {t("tushadiQcBolimiTekshirgandanSong")}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "10px 20px", fontSize: 13 }}>
          <PassportRow label={t("taminotchi")}   value={header.supplierName} />
          <PassportRow label={t("shartnoma1")}     value={header.contractNumber} />
          {header.waybillNumber && <PassportRow label={t("yukXati1")} value={header.waybillNumber} />}
          <PassportRow label={t("kelishSanasi")} value={header.arrivalDate} />
          <PassportRow label={t("manzilOmbori1")} value={header.toWarehouseId} />
          <PassportRow label={t("valyuta")}       value={header.currency} />
          {header.notes && <PassportRow label={t("Izoh")} value={header.notes} />}
        </div>
        <div style={{ height: 1, background: "var(--pos-border)", margin: "16px 0" }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--pos-text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{t("Materiallar")}</div>
        <table className="pos-table" style={{ marginBottom: 16 }}>
          <thead><tr><th>#</th><th>{"Material ID"}</th><th>{t("quantity")}</th><th>{t("price")}</th><th>{t("partiya1")}</th><th>{t("muddat")}</th><th>{t("total")}</th></tr></thead>
          <tbody>{lines.map((l, i) => (
            <tr key={l._key}>
              <td className="pos-mono">{i + 1}</td>
              <td>{l.materialName || l.materialCardId}</td>
              <td className="pos-mono">{l.quantity}</td>
              <td className="pos-mono">{l.unitPrice ? fmt(parseFloat(l.unitPrice), header.currency) : "—"}</td>
              <td>{l.batchNumber || "—"}</td>
              <td>{l.expiryDate || "—"}</td>
              <td className="pos-mono" style={{ fontWeight: 600 }}>{l.quantity && l.unitPrice ? fmt(parseFloat(l.quantity) * parseFloat(l.unitPrice), header.currency) : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 32, fontSize: 14 }}>
          {totalWeight > 0 && <span style={{ color: "var(--pos-text-muted)" }}>{t("jamiOgirlik1")}<strong className="pos-mono">{totalWeight.toLocaleString("uz-UZ")} kg</strong></span>}
          <span style={{ fontWeight: 700, fontSize: 16 }}>{t("jamiQiymat")}<span className="pos-mono" style={{ color: "var(--pos-accent)" }}>{fmt(totalValue, header.currency)}</span></span>
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="pos-badge pos-badge-yellow">⏳ KARANTIN boshlangan ✓</span>
          <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{t("saqlagandanSongQcTekshiruviBoshlanadi")}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="pos-btn pos-btn-ghost" onClick={goBack}>{t("orqaga")}</button>
        <button className="pos-btn pos-btn-primary" onClick={goNext}>{t("keyingiKoribChiqish")}</button>
      </div>
    </div>
  );
}

// ─── Step 4 — Review ──────────────────────────────────────────────────────────
interface Step4Props { header: HeaderForm; lines: LineItem[]; totalQty: number; totalWeight: number; totalValue: number; goBack: () => void; goNext: () => void; setStep: (n: number) => void; }

export function Step4Review({ header, lines, totalQty, totalWeight, totalValue, goBack, goNext, setStep }: Step4Props) {
  return (
    <div className="pos-fade-in">
      <div className="pos-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pos-accent)", marginBottom: 18 }}>{t("bosqich4KoribChiqish")}</div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--pos-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("asosiyMalumotlar")}</span>
            <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setStep(1)}>{t("tahrirlash")}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px 20px", fontSize: 13 }}>
            <ReviewField label={t("manzilOmbori1")}    value={header.toWarehouseId} />
            <ReviewField label={t("taminotchi")}      value={header.supplierName} />
            <ReviewField label={t("shartnomaRaqami")} value={header.contractNumber} />
            {header.waybillNumber && <ReviewField label={t("yukXati1")} value={header.waybillNumber} />}
            <ReviewField label={t("kelishSanasi")}    value={header.arrivalDate} />
            <ReviewField label={t("valyuta")}          value={header.currency} />
            {header.notes && <ReviewField label={t("Izoh")} value={header.notes} />}
          </div>
        </div>
        <div style={{ height: 1, background: "var(--pos-border)", margin: "16px 0" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--pos-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Materiallar ({lines.length} ta)</span>
          <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setStep(2)}>{t("tahrirlash")}</button>
        </div>
        <table className="pos-table" style={{ marginBottom: 12 }}>
          <thead><tr><th>#</th><th>{"Material"}</th><th>{t("quantity")}</th><th>{t("birlikNarx")}</th><th>{t("partiya1")}</th><th>{t("sertifikat")}</th><th>{t("total")}</th></tr></thead>
          <tbody>{lines.map((l, i) => {
            const lineTotal = (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0);
            return (
              <tr key={l._key}>
                <td className="pos-mono">{i + 1}</td>
                <td>{l.materialName || <span className="pos-mono" style={{ fontSize: 11 }}>{l.materialCardId}</span>}</td>
                <td className="pos-mono">{l.quantity}</td>
                <td className="pos-mono">{l.unitPrice ? fmt(parseFloat(l.unitPrice), header.currency) : "—"}</td>
                <td>{l.batchNumber || "—"}</td>
                <td>{l.certificateNumber || "—"}</td>
                <td className="pos-mono" style={{ fontWeight: 700, color: "var(--pos-accent)" }}>{lineTotal > 0 ? fmt(lineTotal, header.currency) : "—"}</td>
              </tr>
            );
          })}</tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 32 }}>
          <span style={{ fontSize: 13, color: "var(--pos-text-muted)" }}>{t("jamiMiqdor1")}<strong className="pos-mono">{totalQty.toLocaleString("uz-UZ")}</strong></span>
          {totalWeight > 0 && <span style={{ fontSize: 13, color: "var(--pos-text-muted)" }}>{t("ogirlik")}<strong className="pos-mono">{totalWeight.toLocaleString("uz-UZ")} kg</strong></span>}
          <div style={{ background: "var(--pos-accent-soft)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 10, padding: "10px 18px", fontSize: 16, fontWeight: 700 }}>
            {t("jamiSumma1")}<span className="pos-mono" style={{ color: "var(--pos-accent)" }}>{fmt(totalValue, header.currency)}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="pos-btn pos-btn-ghost" onClick={goBack}>{t("orqaga")}</button>
        <button className="pos-btn pos-btn-primary" onClick={goNext} style={{ minWidth: 200, justifyContent: "center" }}>{t("tasdiqlashgaOtish")}</button>
      </div>
    </div>
  );
}

// ─── Step 5 — Submit / Success ────────────────────────────────────────────────
interface Step5Props {
  created: CreatedMovement | null;
  saving: boolean;
  header: HeaderForm;
  lines: LineItem[];
  totalValue: number;
  handleSave: (submitToKarantin: boolean) => void;
  downloadPdf: () => void;
  goBack: () => void;
  navigate: (path: string) => void;
}

export function Step5Submit({ created, saving, header, lines, totalValue, handleSave, downloadPdf, goBack, navigate }: Step5Props) {
  return (
    <div className="pos-fade-in">
      {created ? (
        <div className="pos-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "var(--pos-success)" }}>{t("hujjatYaratildi")}</h3>
          {created.documentNumber && (
            <div className="pos-mono" style={{ fontSize: 16, color: "var(--pos-text-muted)", marginBottom: 16 }}>
              {t("hujjatRaqami1")}<strong style={{ color: "var(--pos-text)" }}>{created.documentNumber}</strong>
            </div>
          )}
          <div className="pos-badge pos-badge-yellow" style={{ fontSize: 13, padding: "6px 16px", marginBottom: 24 }}>⏳ KARANTIN — QC tekshiruvi kutilmoqda</div>
          <p style={{ color: "var(--pos-text-muted)", fontSize: 13, maxWidth: 420, margin: "0 auto 24px" }}>{t("materiallarKarantingaJoylashtirildiQcBolimi")}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="pos-btn pos-btn-ghost" onClick={downloadPdf}>{t("pdfYuklabOlish1")}</button>
            <button className="pos-btn pos-btn-primary" onClick={() => navigate("/pos-monitor/movements")}>{t("harakatlarRoyxatiga1")}</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="pos-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pos-accent)", marginBottom: 18 }}>{t("bosqich5Tasdiqlash")}</div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", background: "rgba(59,130,246,0.05)", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 13 }}>
              <SumItem label={t("taminotchi")}  value={header.supplierName} />
              <SumItem label={t("shartnoma1")}    value={header.contractNumber} />
              <SumItem label={t("Materiallar")}  value={`${lines.length} ta qator`} />
              <SumItem label={t("jamiSumma")}   value={fmt(totalValue, header.currency)} mono />
            </div>
            <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#92400E", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <span>{t("barchaTashqiKirimlarAvvalKarantinga")}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
              <button className="pos-btn pos-btn-ghost" style={{ justifyContent: "center", padding: "12px 24px", fontSize: 14 }} onClick={() => handleSave(false)} disabled={saving}>
                {saving ? "⏳ Saqlanmoqda..." : "💾 Qoralama saqlash"}
              </button>
              <button className="pos-btn pos-btn-success" style={{ justifyContent: "center", padding: "14px 24px", fontSize: 15 }} onClick={() => handleSave(true)} disabled={saving}>
                {saving ? "⏳ Yuborilmoqda..." : "🚀 Karantinga yuborish"}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="pos-btn pos-btn-ghost" onClick={goBack}>{t("orqaga")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
