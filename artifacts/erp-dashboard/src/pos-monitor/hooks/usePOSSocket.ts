/**
 * @module usePOSSocket
 * @description React custom hook.
 */

import { useState, useEffect, useRef } from "react";
import { getPosSocket } from "../socket/pos-socket";

// ─── Event payload types ──────────────────────────────────────────────────────

export interface MovementCreatedEvent {
  id: number;
  movementType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  movementNumber?: string;
  [key: string]: unknown;
}

export interface MovementStatusEvent {
  id: number;
  status: string;
  previousStatus?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface LowStockEvent {
  materialId: number;
  materialName: string;
  warehouseId: string;
  availableQty: number;
  minQty: number;
  unit: string;
  [key: string]: unknown;
}

export interface QuarantineEvent {
  id: number;
  movementId: number;
  materialName?: string;
  expiredAt?: string;
  [key: string]: unknown;
}

export interface RequisitionEvent {
  id: number;
  requisitionNumber?: string;
  approvedBy?: string;
  approvedAt?: string;
  [key: string]: unknown;
}

export interface GLPostedEvent {
  movementId: number;
  entryId: number;
  amount?: number;
  postedAt?: string;
  [key: string]: unknown;
}

export interface StockUpdatedEvent {
  warehouseId: string;
  materialCardId: number;
  newBalance: number;
  delta?: number;
  [key: string]: unknown;
}

export interface NotificationEvent {
  id: number;
  type: string;
  message: string;
  severity?: "info" | "warning" | "error";
  createdAt?: string;
  [key: string]: unknown;
}

// ─── Hook interfaces ──────────────────────────────────────────────────────────

export interface POSSocketState {
  isConnected:     boolean;
  lastEvent:       string | null;
  connectionError: string | null;
}

export interface POSSocketHandlers {
  onMovementCreated?:      (data: MovementCreatedEvent) => void;
  onMovementStatusChanged?: (data: MovementStatusEvent)  => void;
  onLowStockAlert?:        (data: LowStockEvent)         => void;
  onQuarantineExpired?:    (data: QuarantineEvent)       => void;
  onRequisitionApproved?:  (data: RequisitionEvent)      => void;
  onGLPosted?:             (data: GLPostedEvent)         => void;
  onStockUpdated?:         (data: StockUpdatedEvent)     => void;
  onNotification?:         (data: NotificationEvent)     => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePOSSocket(handlers: POSSocketHandlers = {}): POSSocketState {
  const [state, setState] = useState<POSSocketState>({
    isConnected:     false,
    lastEvent:       null,
    connectionError: null,
  });

  // Keep handlers up-to-date without re-running the effect
  const handlersRef = useRef<POSSocketHandlers>(handlers);
  useEffect(() => { handlersRef.current = handlers; });

  useEffect(() => {
    let sock: ReturnType<typeof getPosSocket> | null = null;

    try {
      sock = getPosSocket();

      // ── Connection lifecycle ──────────────────────────────────────────

      sock.on("connect", () =>
        setState(s => ({ ...s, isConnected: true, connectionError: null })),
      );

      sock.on("disconnect", () =>
        setState(s => ({ ...s, isConnected: false })),
      );

      sock.on("connect_error", (err: Error) =>
        setState(s => ({ ...s, connectionError: err.message })),
      );

      // ── Movement events ───────────────────────────────────────────────

      sock.on("movement.created", (data: MovementCreatedEvent) => {
        setState(s => ({ ...s, lastEvent: "movement.created" }));
        handlersRef.current.onMovementCreated?.(data);
      });

      sock.on("movement.status_changed", (data: MovementStatusEvent) => {
        setState(s => ({ ...s, lastEvent: "movement.status_changed" }));
        handlersRef.current.onMovementStatusChanged?.(data);
      });

      // ── Stock events ──────────────────────────────────────────────────

      sock.on("stock.low_alert", (data: LowStockEvent) => {
        setState(s => ({ ...s, lastEvent: "stock.low_alert" }));
        handlersRef.current.onLowStockAlert?.(data);
      });

      sock.on("warehouse.stock.updated", (data: StockUpdatedEvent) => {
        setState(s => ({ ...s, lastEvent: "warehouse.stock.updated" }));
        handlersRef.current.onStockUpdated?.(data);
      });

      // ── Quarantine & requisition events ───────────────────────────────

      sock.on("quarantine.expired", (data: QuarantineEvent) => {
        setState(s => ({ ...s, lastEvent: "quarantine.expired" }));
        handlersRef.current.onQuarantineExpired?.(data);
      });

      sock.on("requisition.approved", (data: RequisitionEvent) => {
        setState(s => ({ ...s, lastEvent: "requisition.approved" }));
        handlersRef.current.onRequisitionApproved?.(data);
      });

      // ── GL event ──────────────────────────────────────────────────────

      sock.on("gl.posted", (data: GLPostedEvent) => {
        setState(s => ({ ...s, lastEvent: "gl.posted" }));
        handlersRef.current.onGLPosted?.(data);
      });

      // ── Notification event ────────────────────────────────────────────

      sock.on("notification.new", (data: NotificationEvent) => {
        setState(s => ({ ...s, lastEvent: "notification.new" }));
        handlersRef.current.onNotification?.(data);
      });

    } catch (err) {
      setState(s => ({ ...s, connectionError: String(err) }));
    }

    return () => {
      if (!sock) return;
      sock.off("connect");
      sock.off("disconnect");
      sock.off("connect_error");
      sock.off("movement.created");
      sock.off("movement.status_changed");
      sock.off("stock.low_alert");
      sock.off("warehouse.stock.updated");
      sock.off("quarantine.expired");
      sock.off("requisition.approved");
      sock.off("gl.posted");
      sock.off("notification.new");
    };
  }, []); // Empty — handlers are accessed via stable ref

  return state;
}
