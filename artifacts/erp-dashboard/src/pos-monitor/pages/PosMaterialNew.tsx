/**
 * PosMaterialNew.tsx
 * Yangi material yaratish formasi.
 * URL: /pos-monitor/materials/new
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from '@/lib/queryClient';

import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
const CATEGORY_OPTIONS = [
  { value: "PAPER",      label: "📄 Qog'oz" },
  { value: "CARDBOARD",  label: "📦 Karton" },
  { value: "INK",        label: "🖋️ Bo'yoq" },
  { value: "PLATE",      label: "🟫 Plastina" },
  { value: "FILM",       label: "🎞️ Plyonka" },
  { value: "CHEMICAL",   label: "⚗️ Kimyo" },
  { value: "ASSET",      label: "🧰 Aktiv" },
  { value: "OFFICE",     label: "📎 Ofis" },
  { value: "GLUE",       label: "🧴 Yelim" },
  { value: "SOLVENT",    label: "🧪 Erituvchi" },
  { value: "TOOL",       label: "🔧 Asbob" },
  { value: "SPARE",      label: "⚙️ Ehtiyot qism" },
  { value: "PACKAGING",  label: "📮 Qadoqlash" },
];

const UNIT_OPTIONS = [
  { value: "dona",  label: "📦 Dona (pcs)" },
  { value: "kg",    label: "⚖️ Kilogramm" },
  { value: "g",     label: "⚖️ Gramm" },
  { value: "l",     label: "💧 Litr" },
  { value: "ml",    label: "💧 Millilitr" },
  { value: "m",     label: "📏 Metr" },
  { value: "cm",    label: "📏 Santimetr" },
  { value: "m2",    label: "🟦 Kv. metr" },
  { value: "m3",    label: "🟪 Kub. metr" },
  { value: "rulon", label: "🧻 Rulon" },
  { value: "tonna", label: "🏋️ Tonna" },
];

const MATERIAL_TYPE_OPTIONS = [
  { value: "raw_material", label: "Xom ashyo" },
  { value: "finished",     label: "Tayyor mahsulot" },
  { value: "consumable",   label: "Iste'mol" },
  { value: "asset",        label: "Aktiv" },
  { value: "spare",        label: "Ehtiyot qism" },
];

export default function PosMaterialNew() {
  const { t } = useTranslation('common');
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    kod:               "",
    xom_ashyo:         "",
    xom_ashyo_ru:      "",
    category:          "PAPER",
    unit_of_measure:   "dona",
    material_type:     "raw_material",
    min_stock:         "",
    max_stock:         "",
    unit_price:        "",
    currency:          "UZS",
    description:       "",
    supplier_name:     "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.kod || !form.xom_ashyo || !form.unit_of_measure) {
      setError("Kod, nom va o'lchov birligi to'ldirilishi shart");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = JSON.parse(localStorage.getItem("pos_session") ?? "{}")?.token ?? "";
      const res = await apiRequest('POST', "/api/material-cards", {
        kod:             form.kod,
        xom_ashyo:       form.xom_ashyo,
        xom_ashyo_ru:    form.xom_ashyo_ru || undefined,
        category:        form.category,
        unit_of_measure: form.unit_of_measure,
        material_type:   form.material_type,
        min_stock:       form.min_stock ? parseFloat(form.min_stock) : undefined,
        max_stock:       form.max_stock ? parseFloat(form.max_stock) : undefined,
        unit_price:      form.unit_price ? parseFloat(form.unit_price) : undefined,
        currency:        form.currency,
        description:     form.description || undefined,
        supplier_name:   form.supplier_name || undefined,
        token,
      });
      const data = res as { id?: number; message?: string };
      alert(`✅ Material yaratildi! ID: ${data.id}`);
      navigate(`/pos-monitor/materials/360/${data.id}`);
    } catch (e) {
      setError(String((e as Error).message));
    } finally { setSaving(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate("/pos-monitor/materials")} style={{ padding: "6px 12px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          {t("orqaga")}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>YANGI MATERIAL</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t("materialQoshish")}</h1>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, color: "#991B1B", marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label={t('materialKodi1')} required>
            <input
              value={form.kod}
              onChange={e => setForm({...form, kod: e.target.value.toUpperCase()})}
              placeholder="PAPER-006"
              style={inputStyle}
            />
          </Field>

          <Field label={t("olchovBirligi1")} required>
            <select value={form.unit_of_measure} onChange={e => setForm({...form, unit_of_measure: e.target.value})} style={inputStyle}>
              {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </Field>

          <Field label={tLabel('common.PosMaterialNew.materialNomiOzbekcha', "Material nomi (o'zbekcha) *")} required>
            <input
              value={form.xom_ashyo}
              onChange={e => setForm({...form, xom_ashyo: e.target.value})}
              placeholder={tLabel('common.PosMaterialNew.qogoz300gM', "Qog'oz 300g/m²")}
              style={inputStyle}
            />
          </Field>

          <Field label={tLabel('common.PosMaterialNew.materialNomiRuscha', "Material nomi (ruscha)")}>
            <input
              value={form.xom_ashyo_ru}
              onChange={e => setForm({...form, xom_ashyo_ru: e.target.value})}
              placeholder={tLabel('common.PosMaterialNew.300', "Бумага 300г/м²")}
              style={inputStyle}
            />
          </Field>

          <Field label={t("category")}>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}>
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>

          <Field label={t("materialTuri")}>
            <select value={form.material_type} onChange={e => setForm({...form, material_type: e.target.value})} style={inputStyle}>
              {MATERIAL_TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label={t("minimalQoldiq")}>
            <input
              type="number" min="0" step="any"
              value={form.min_stock}
              onChange={e => setForm({...form, min_stock: e.target.value})}
              placeholder="100"
              style={inputStyle}
            />
          </Field>

          <Field label={t("maksimalQoldiq")}>
            <input
              type="number" min="0" step="any"
              value={form.max_stock}
              onChange={e => setForm({...form, max_stock: e.target.value})}
              placeholder="5000"
              style={inputStyle}
            />
          </Field>

          <Field label={t("birlikNarxi")}>
            <input
              type="number" min="0" step="any"
              value={form.unit_price}
              onChange={e => setForm({...form, unit_price: e.target.value})}
              placeholder="1500"
              style={inputStyle}
            />
          </Field>

          <Field label={t("valyuta")}>
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} style={inputStyle}>
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>

          <Field label={t("asosiyTaminotchi")}>
            <input
              value={form.supplier_name}
              onChange={e => setForm({...form, supplier_name: e.target.value})}
              placeholder={t("alfaTexLlc")}
              style={inputStyle}
            />
          </Field>

          <Field label={t("progress.description")} colSpan={2}>
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder={t("qoshimchaIzoh")}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => navigate("/pos-monitor/materials")} style={{ padding: "10px 20px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer" }}>
            {t("cancel")}
          </button>
          <button onClick={submit} disabled={saving} style={{ padding: "10px 24px", background: "#10B981", color: "#FFF", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontWeight: 700 }}>
            {saving ? "⏳ Saqlanmoqda..." : "💾 Yaratish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required, colSpan }: { label: string; children: React.ReactNode; required?: boolean; colSpan?: number }) {
  return (
    <div style={{ gridColumn: colSpan ? `span ${colSpan}` : undefined }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8,
  fontSize: 13, outline: "none", background: "#FFF",
};
