/**
 * PosMovementNew — Movement type router.
 *
 * KIRIM (EXTERNAL_IN)  = manual entry  → /pos-monitor/movements/new/kirim
 * CHIQIM (all others)  = barcode only  → /pos-monitor/movements/new/chiqim  (future)
 *
 * Shows 7 movement-type buttons. Selecting one immediately navigates to the
 * correct sub-form.
 */

import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";

import { tLabel } from '@/lib/i18n/tLabel';
interface MovementTypeConfig {
  value: string;
  icon: string;
  label: string;
  sublabel: string;
  variant: "kirim" | "chiqim";
  badge: string;
  badgeClass: string;
  description: string;
}

const MOVEMENT_TYPES: MovementTypeConfig[] = [
  {
    value:      "EXTERNAL_IN",
    icon:       "📥",
    label:      "Tashqi Kirim",
    sublabel:   "(Qo'lda)",
    variant:    "kirim",
    badge:      "QO'LDA",
    badgeClass: "pos-badge-green",
    description: tLabel('common.PosMovementNew.tsx.taminotchidanYetibKelganMateriallarBarcha', "Ta'minotchidan yetib kelgan materiallar. Barcha maydonlar qo'lda to'ldiriladi — barcode skaneri kerak emas."),
  },
  {
    value:      "EXTERNAL_OUT",
    icon:       "📤",
    label:      "Tashqi Chiqim",
    sublabel:   "(Barcode skaner)",
    variant:    "chiqim",
    badge:      "BARCODE",
    badgeClass: "pos-badge-blue",
    description: tLabel('common.PosMovementNew.tsx.ombordanTashqarigaChiqarilganMateriallarBarcode', "Ombordan tashqariga chiqarilgan materiallar. Barcode skaner orqali amalga oshiriladi."),
  },
  {
    value:      "INTERNAL_ISSUE",
    icon:       "🔄",
    label:      "Ichki Berish",
    sublabel:   "(Barcode skaner)",
    variant:    "chiqim",
    badge:      "BARCODE",
    badgeClass: "pos-badge-blue",
    description: tLabel('common.PosMovementNew.tsx.bolimgaYokiXodimgaMaterialBerish', "Bo'limga yoki xodimga material berish. Barcode skaner orqali."),
  },
  {
    value:      "INTERNAL_RETURN",
    icon:       "↩️",
    label:      tLabel('common.PosMovementNew.tsx.ichkiQaytarish', "Ichki Qaytarish"),
    sublabel:   "(Barcode skaner)",
    variant:    "chiqim",
    badge:      "BARCODE",
    badgeClass: "pos-badge-blue",
    description: tLabel('common.PosMovementNew.tsx.bolimYokiXodimdanMaterialQaytarish', "Bo'lim yoki xodimdan material qaytarish."),
  },
  {
    value:      "INTERNAL_TRANSFER",
    icon:       "🏭",
    label:      tLabel('common.PosMovementNew.tsx.ichkiKochirish', "Ichki Ko'chirish"),
    sublabel:   "(Barcode skaner)",
    variant:    "chiqim",
    badge:      "BARCODE",
    badgeClass: "pos-badge-blue",
    description: tLabel('common.PosMovementNew.tsx.omborlarOrasidaMaterialKochirish', "Omborlar orasida material ko'chirish."),
  },
  {
    value:      "DAMAGE",
    icon:       "⚠️",
    label:      tLabel('common.PosMovementNew.tsx.zararNosoz', "Zarar / Nosoz"),
    sublabel:   "(Barcode skaner)",
    variant:    "chiqim",
    badge:      "BARCODE",
    badgeClass: "pos-badge-red",
    description: tLabel('common.PosMovementNew.tsx.zararKorganYokiNosozMateriallar', "Zarar ko'rgan yoki nosoz materiallar ro'yxatdan o'tkazish."),
  },
  {
    value:      "INVENTORY_ADJ",
    icon:       "📋",
    label:      "Inventar Tuzatma",
    sublabel:   "(Barcode skaner)",
    variant:    "chiqim",
    badge:      "BARCODE",
    badgeClass: "pos-badge-yellow",
    description: tLabel('common.PosMovementNew.tsx.inventarizatsiyaAsosidaMiqdorTuzatmasi', "Inventarizatsiya asosida miqdor tuzatmasi."),
  },
];

export default function PosMovementNew() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();

  function handleSelect(mt: MovementTypeConfig) {
    if (mt.variant === "kirim") {
      navigate("/pos-monitor/movements/new/kirim");
    } else {
      navigate("/pos-monitor/movements/new/chiqim");
    }
  }

  return (
    <div className="pos-fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          className="pos-btn pos-btn-ghost"
          style={{ padding: "6px 12px" }}
          onClick={() => navigate("/pos-monitor/movements")}
        >
          ← {t("common.back")}
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("movements.newMovement")}</h2>
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 2 }}>
            {t("harakatTuriniTanlang")}
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap",
      }}>
        <div style={{
          flex: 1, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)",
          borderRadius: 10, padding: "10px 16px", display: "flex", gap: 10, alignItems: "center", fontSize: 13,
        }}>
          <span style={{ fontSize: 20 }}>📥</span>
          <div>
            <div style={{ fontWeight: 700, color: "#065F46", marginBottom: 2 }}>{t("tashqiKirimQolda")}</div>
            <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
              {t("operatorBarchaMaydonlarniQoldaToldiradi")}
            </div>
          </div>
        </div>
        <div style={{
          flex: 1, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.20)",
          borderRadius: 10, padding: "10px 16px", display: "flex", gap: 10, alignItems: "center", fontSize: 13,
        }}>
          <span style={{ fontSize: 20 }}>📤</span>
          <div>
            <div style={{ fontWeight: 700, color: "#1E40AF", marginBottom: 2 }}>{t("chiqimTurlarBarcode")}</div>
            <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
              {t("barcodeSkanerOrqaliAmalgaOshiriladi")}
            </div>
          </div>
        </div>
      </div>

      {/* Movement type grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {MOVEMENT_TYPES.map(mt => (
          <button
            key={mt.value}
            onClick={() => handleSelect(mt)}
            style={{
              background: mt.variant === "kirim"
                ? "linear-gradient(135deg,rgba(16,185,129,0.06),rgba(16,185,129,0.02))"
                : "var(--pos-card)",
              border: mt.variant === "kirim"
                ? "1px solid rgba(16,185,129,0.30)"
                : "1px solid var(--pos-border)",
              borderRadius: 14,
              padding: "20px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.18s",
              boxShadow: "4px 4px 12px rgba(163,177,198,0.20),-2px -2px 8px rgba(255,255,255,0.70)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "6px 6px 18px rgba(163,177,198,0.35),-3px -3px 10px rgba(255,255,255,0.85)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "4px 4px 12px rgba(163,177,198,0.20),-2px -2px 8px rgba(255,255,255,0.70)";
            }}
          >
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>{mt.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--pos-text)" }}>
                    {mt.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 1 }}>
                    {mt.sublabel}
                  </div>
                </div>
              </div>
              <span className={`pos-badge ${mt.badgeClass}`} style={{ fontSize: 10, flexShrink: 0 }}>
                {mt.badge}
              </span>
            </div>

            {/* Description */}
            <div style={{ fontSize: 12, color: "var(--pos-text-muted)", lineHeight: 1.5 }}>
              {mt.description}
            </div>

            {/* CTA */}
            <div style={{
              marginTop: 4,
              fontSize: 12, fontWeight: 600,
              color: mt.variant === "kirim" ? "#059669" : "var(--pos-accent)",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {mt.variant === "kirim" ? "Qo'lda to'ldirish →" : "Barcode skan →"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
