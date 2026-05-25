/**
 * @module RequisitionDetail.sections
 * @description Header, details/action cards, materials table for RequisitionDetail.
 * Split out so the parent stays under 300 lines.
 */

import type { Requisition } from "./RequisitionDetail.types";
import { STATUS_BADGE, PRIORITY_BADGE } from "./RequisitionDetail.types";

export function HeaderBar({
  req,
  t,
  onBack,
}: {
  req: Requisition;
  t: (k: string) => string;
  onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      <button className="pos-btn pos-btn-ghost" onClick={onBack}>
        ← {t("common.back")}
      </button>
      <span className="pos-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--pos-accent)" }}>
        {req.requestNumber ?? `#${req.id}`}
      </span>
      <span className={`pos-badge ${STATUS_BADGE[req.status] ?? "pos-badge-gray"}`} style={{ fontSize: 12 }}>
        {t(`status.${req.status}`) || req.status}
      </span>
      {req.priority && (
        <span className={`pos-badge ${PRIORITY_BADGE[req.priority] ?? "pos-badge-gray"}`} style={{ fontSize: 11 }}>
          {req.priority}
        </span>
      )}
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
        {t("common.createdBy")}: <strong>{req.createdByName ?? "—"}</strong>
      </span>
      <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
        {new Date(req.createdAt).toLocaleDateString("uz-UZ")}
      </span>
    </div>
  );
}

export function DetailsCard({ req, t }: { req: Requisition; t: (k: string) => string }) {
  return (
    <div className="pos-card">
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{t("sorovMalumotlari")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "var(--pos-text-muted)" }}>{t("requests.priority")}</span>
          <span
            className={`pos-badge ${PRIORITY_BADGE[req.priority ?? ""] ?? "pos-badge-gray"}`}
            style={{ fontSize: 11 }}
          >
            {req.priority ?? "—"}
          </span>
        </div>
        {req.neededByDate && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--pos-text-muted)" }}>{t("kerakBolishSanasi")}</span>
            <span>{new Date(req.neededByDate).toLocaleDateString("uz-UZ")}</span>
          </div>
        )}
        {req.targetWarehouseName && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--pos-text-muted)" }}>{t("maqsadOmbori")}</span>
            <span>{req.targetWarehouseName}</span>
          </div>
        )}
        {req.justification && (
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <div style={{ color: "var(--pos-text-muted)", marginBottom: 4 }}>{t("common.notes")}</div>
            <div
              style={{
                background: "rgba(248,250,252,1)",
                borderRadius: 8,
                padding: "8px 12px",
                border: "1px solid var(--pos-border)",
                fontSize: 13,
              }}
            >
              {req.justification}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActionsCard({
  canSubmit,
  canApproveReject,
  canFulfill,
  actionBusy,
  t,
  onSubmit,
  onApprove,
  onReject,
  onFulfill,
}: {
  canSubmit: boolean;
  canApproveReject: boolean;
  canFulfill: boolean;
  actionBusy: boolean;
  t: (k: string) => string;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onFulfill: () => void;
}) {
  return (
    <div className="pos-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{t("amallar")}</div>

      {canSubmit && (
        <div>
          <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 10 }}>
            {t("sorovniBolimMenejerigaYuboring")}
          </div>
          <button className="pos-btn pos-btn-primary" disabled={actionBusy} onClick={onSubmit}>
            {actionBusy ? "…" : `📨 ${t("common.submit")}`}
          </button>
        </div>
      )}

      {canApproveReject && (
        <div style={{ display: "flex", gap: 10 }}>
          <button className="pos-btn pos-btn-success" disabled={actionBusy} onClick={onApprove}>
            {actionBusy ? "…" : `✅ ${t("requests.approve")}`}
          </button>
          <button className="pos-btn pos-btn-danger" disabled={actionBusy} onClick={onReject}>
            ✕ {t("requests.reject")}
          </button>
        </div>
      )}

      {canFulfill && (
        <div>
          <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 10 }}>
            {t("barcodeSkanerBilanMaterialniChiqarib")}
          </div>
          <button className="pos-btn pos-btn-primary" disabled={actionBusy} onClick={onFulfill}>
            📦 Bajarish (Barcode skaner)
          </button>
        </div>
      )}

      {!canSubmit && !canApproveReject && !canFulfill && (
        <div style={{ fontSize: 13, color: "var(--pos-text-muted)", textAlign: "center", padding: "20px 0" }}>
          {t("hozirchaAmalMavjudEmas")}
        </div>
      )}
    </div>
  );
}

export function MaterialsTable({ req, t }: { req: Requisition; t: (k: string) => string }) {
  if (!req.lines || req.lines.length === 0) return null;
  return (
    <div className="pos-card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{t("materiallar1")}</div>
      <div style={{ overflowX: "auto" }}>
        <table className="pos-table">
          <thead>
            <tr>
              <th>{t("common.code")}</th>
              <th>{t("common.name")}</th>
              <th>{t("common.qty")}</th>
              <th>{t("common.unit")}</th>
              <th>{t("mavjudQoldiq")}</th>
              <th>{t("common.notes")}</th>
            </tr>
          </thead>
          <tbody>
            {req.lines.map((line, idx) => (
              <tr key={idx}>
                <td>
                  <span className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                    {line.materialCode ?? line.materialCardId}
                  </span>
                </td>
                <td>{line.materialName ?? `Material #${line.materialCardId}`}</td>
                <td style={{ fontWeight: 600 }}>{line.requestedQty}</td>
                <td style={{ color: "var(--pos-text-muted)" }}>{line.unit ?? "—"}</td>
                <td>
                  {line.availableQty !== undefined ? (
                    <span
                      className={`pos-badge ${
                        (line.availableQty ?? 0) >= line.requestedQty
                          ? "pos-badge-green"
                          : "pos-badge-yellow"
                      }`}
                    >
                      {line.availableQty}
                    </span>
                  ) : (
                    <span style={{ color: "var(--pos-text-muted)" }}>—</span>
                  )}
                </td>
                <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{line.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
