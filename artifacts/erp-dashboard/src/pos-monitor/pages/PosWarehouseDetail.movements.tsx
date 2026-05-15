/**
 * @module PosWarehouseDetail.movements
 * @description Reusable movements table and employees table for
 *   PosWarehouseDetail. Split out so the parent stays under 300 lines.
 */

import { useTranslation } from "@/lib/i18n";
import type { Movement, WarehouseEmployee } from "./PosWarehouseDetail.types";
import { STATUS_BADGE, MOVEMENT_TYPE_LABELS, fmt, fmtDate } from "./PosWarehouseDetail.types";

export function MovementsTable({
  movements,
  title,
  color,
  onClick,
  emptyMessage,
}: {
  movements: Movement[];
  title: string;
  color: string;
  onClick: (id: number) => void;
  emptyMessage: string;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="pos-card" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #E5E7EB",
          fontWeight: 600,
          fontSize: 14,
          borderLeft: `4px solid ${color}`,
        }}
      >
        {title} ({movements.length})
      </div>
      {movements.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="pos-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>{t("hujjatRaqami")}</th>
                <th>{t("harakatTuri1")}</th>
                <th>{t("status28")}</th>
                <th style={{ textAlign: "right" }}>{t("summa")}</th>
                <th>{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => onClick(m.id)}>
                  <td className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>
                    {m.movementNumber ?? `#${m.id}`}
                  </td>
                  <td>
                    <span className="pos-badge pos-badge-blue" style={{ fontSize: 10 }}>
                      {MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`pos-badge ${STATUS_BADGE[m.status] ?? "pos-badge-gray"}`}
                      style={{ fontSize: 10 }}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="pos-mono" style={{ textAlign: "right" }}>
                    {m.totalAmount != null ? fmt(m.totalAmount, 0) : "—"}
                  </td>
                  <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>
                    {fmtDate(m.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function EmployeesTable({
  employees,
  t,
}: {
  employees: WarehouseEmployee[];
  t: (k: string) => string;
}) {
  return (
    <div className="pos-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #E5E7EB",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        👥 Omborga biriktirilgan xodimlar ({employees.length})
      </div>
      {employees.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>
          {t("hechKimBiriktirilmagan")}
        </div>
      ) : (
        <table className="pos-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>{t("foydalanuvchi")}</th>
              <th>{t("common.login")}</th>
              <th>{t("role")}</th>
              <th>{t("primary")}</th>
              <th>{t("biriktirilganSana")}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>
                  <b>{(e.fullName ?? "").trim() || `User #${e.userId}`}</b>
                </td>
                <td className="pos-mono" style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
                  {e.username}
                </td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 6,
                      background:
                        e.role === "manager"
                          ? "#FEF3C7"
                          : e.role === "qc_inspector"
                            ? "#F0FDF4"
                            : "#EFF6FF",
                      color:
                        e.role === "manager"
                          ? "#92400E"
                          : e.role === "qc_inspector"
                            ? "#14532D"
                            : "#1E40AF",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {e.role === "manager"
                      ? "👔 Menejer"
                      : e.role === "staff"
                        ? "👷 Xodim"
                        : e.role === "keeper"
                          ? "🔑 Saqlovchi"
                          : e.role === "qc_inspector"
                            ? "🔬 QC nazoratchi"
                            : "👁️ Kuzatuvchi"}
                  </span>
                </td>
                <td>{e.isPrimary ? "⭐ Ha" : ""}</td>
                <td>{fmtDate(e.assignedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
