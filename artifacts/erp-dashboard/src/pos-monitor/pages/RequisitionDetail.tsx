/**
 * @module RequisitionDetail
 * @description Route-level page. Composes header, details, actions, materials,
 *   timeline and reject modal. Split companion files keep each under 300 lines.
 */

import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { requestsApi } from "../api/pos-monitor.api";
import type { Requisition } from "./RequisitionDetail.types";
import { getPosUserId, getPosRole } from "./RequisitionDetail.types";
import { RejectModal, StatusTimeline } from "./RequisitionDetail.modals";
import {
  HeaderBar,
  DetailsCard,
  ActionsCard,
  MaterialsTable,
} from "./RequisitionDetail.sections";

export default function RequisitionDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/pos-monitor/requests/:id");
  const { t } = usePosI18n();
  const id = match ? parseInt(params?.id ?? "0", 10) : 0;

  const [req, setReq] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [toast, setToast] = useState("");

  const myUserId = getPosUserId();
  const myRole = getPosRole();
  const isManager =
    myRole.includes("manager") || myRole.includes("department_head") || myRole.includes("admin");
  const isWarehouse =
    myRole.includes("warehouse") || myRole.includes("storekeeper") || myRole.includes("admin");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await requestsApi.getOne(id);
      setReq(data as Requisition);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleSubmit() {
    if (!req) return;
    setActionBusy(true);
    try {
      await requestsApi.submit(req.id);
      showToast("So'rov yuborildi");
      void load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleApprove() {
    if (!req) return;
    setActionBusy(true);
    try {
      await requestsApi.approve({ requestId: req.id });
      showToast("So'rov tasdiqlandi");
      void load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReject(reason: string) {
    if (!req) return;
    await requestsApi.reject({ requestId: req.id, reason });
    setShowReject(false);
    showToast("So'rov rad etildi");
    void load();
  }

  function handleFulfill() {
    if (!req) return;
    navigate(`/pos-monitor/movements/new/chiqim?reqId=${req.id}`);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="pos-card"
            style={{
              height: i === 0 ? 72 : 160,
              background: "var(--ep-primary)",
              animation: "pos-pulse 1.4s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (error || !req) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: "var(--pos-danger)", fontWeight: 600, marginBottom: 16 }}>
          {error || "So'rov topilmadi"}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="pos-btn pos-btn-ghost" onClick={() => navigate("/pos-monitor/requests")}>
            ← {t("common.back")}
          </button>
          <button className="pos-btn pos-btn-primary" onClick={() => void load()}>
            🔄 {t("common.refresh")}
          </button>
        </div>
      </div>
    );
  }

  const isCreator = req.createdById === myUserId;
  const isDraft = req.status === "DRAFT";
  const isPending = req.status === "SUBMITTED" || req.status === "PENDING";
  const isApproved = req.status === "APPROVED";
  const canSubmit = isDraft && isCreator;
  const canApproveReject = isPending && isManager;
  const canFulfill = isApproved && isWarehouse;

  return (
    <div className="pos-fade-in">
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 72,
            right: 24,
            background: "var(--pos-text)",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            animation: "slideIn 0.3s ease",
          }}
        >
          {toast}
        </div>
      )}

      <HeaderBar req={req} t={t} onBack={() => navigate("/pos-monitor/requests")} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <DetailsCard req={req} t={t} />
        <ActionsCard
          canSubmit={canSubmit}
          canApproveReject={canApproveReject}
          canFulfill={canFulfill}
          actionBusy={actionBusy}
          t={t}
          onSubmit={() => void handleSubmit()}
          onApprove={() => void handleApprove()}
          onReject={() => setShowReject(true)}
          onFulfill={handleFulfill}
        />
      </div>

      <MaterialsTable req={req} t={t} />

      <div className="pos-card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t("holatTarixi1")}</div>
        <StatusTimeline currentStatus={req.status} statusHistory={req.statusHistory} />
      </div>

      {showReject && (
        <RejectModal
          onClose={() => setShowReject(false)}
          onSubmit={handleReject}
          t={t}
        />
      )}
    </div>
  );
}
