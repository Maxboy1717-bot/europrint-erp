/**
 * @module PosMovementChiqimModal.fields
 * @description Context fields (warehouse, return reason, damage notes, notes)
 *   for PosMovementChiqimModal. Split so the sibling sections file stays
 *   under 300 lines.
 */

export function ContextFields({
  fromWarehouseId,
  toWarehouseId,
  notes,
  returnReason,
  needsToWarehouse,
  needsReturnReason,
  needsDamageDesc,
  setFromWarehouseId,
  setToWarehouseId,
  setNotes,
  setReturnReason,
  t,
}: {
  fromWarehouseId: string;
  toWarehouseId: string;
  notes: string;
  returnReason: string;
  needsToWarehouse: boolean;
  needsReturnReason: boolean;
  needsDamageDesc: boolean;
  setFromWarehouseId: (v: string) => void;
  setToWarehouseId: (v: string) => void;
  setNotes: (v: string) => void;
  setReturnReason: (v: string) => void;
  t: (k: string) => string;
}) {
  const labelStyle = {
    fontSize: 11,
    color: "var(--pos-text-muted)",
    fontWeight: 600,
    display: "block",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  };
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={labelStyle}>{t("manbaOmbori")}</label>
          <input
            className="pos-input"
            value={fromWarehouseId}
            onChange={(e) => setFromWarehouseId(e.target.value)}
            placeholder={t("omborId")}
          />
        </div>
        {needsToWarehouse && (
          <div>
            <label style={labelStyle}>{t("manzilOmbori")}</label>
            <input
              className="pos-input"
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              placeholder={t("omborId")}
            />
          </div>
        )}
      </div>
      {needsReturnReason && (
        <div>
          <label style={labelStyle}>{t("qaytarishSababi")}</label>
          <textarea
            className="pos-input"
            rows={2}
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder={t("qaytarishSababi1")}
            style={{ resize: "vertical" }}
          />
        </div>
      )}
      {needsDamageDesc && (
        <div>
          <label style={labelStyle}>{t("zararTavsifi")}</label>
          <textarea
            className="pos-input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("zararTuriVaSababi")}
            style={{ resize: "vertical" }}
          />
        </div>
      )}
      {!needsDamageDesc && !needsReturnReason && (
        <div>
          <label style={labelStyle}>{t("Izoh")}</label>
          <input
            className="pos-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("qoshimchaIzoh")}
          />
        </div>
      )}
    </>
  );
}
