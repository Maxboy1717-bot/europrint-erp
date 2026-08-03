/**
 * @module sd-order-status
 * @description Canonical SD sales-order status vocabulary — mirrors backend
 *   `SoStatusType` (apps/api/src/modules/sd/domain/value-objects/so-status.vo.ts).
 *   These are the ONLY status strings that actually reach
 *   `OrderStatusChangedEvent.newStatus` (apps/api/src/modules/sd/domain/events/
 *   order-status-changed.event.ts) — the event `KanbanCardsRepository
 *   .moveOrderCardByStatusMap` matches against `kanban_status_column_map.sd_status`.
 *   Use this list for anything that must line up with that live mechanism
 *   (e.g. the Kanban status->column mapping admin page).
 *
 *   NOTE (drift, pre-existing, not touched here): this codebase already has at
 *   least two OTHER "order status" vocabularies that do NOT match this one —
 *   `ORDER_STATUS_LABELS` in `@/lib/sd-helpers` (new/advance_pending/design/...)
 *   and `ALL_STATUSES` in `@/pages/OrderStatusPage` (incomplete/pending_design/...).
 *   Those back different/legacy workflows; do not conflate them with this list.
 */

export const SD_ORDER_STATUSES = [
  "draft", "pending_approval", "approved", "confirmed", "pending_advance",
  "pending_material", "ready_for_planning", "in_planning", "completed_planning",
  "ready_for_production", "in_production", "in_progress", "ready_for_shipment",
  "shipped", "delivered", "closed", "cancelled", "on_hold",
] as const;

export type SdOrderStatus = typeof SD_ORDER_STATUSES[number];

export const SD_ORDER_STATUS_LABELS: Record<SdOrderStatus, string> = {
  draft:                "Qoralama",
  pending_approval:     "Tasdiq kutilmoqda",
  approved:             "Tasdiqlangan",
  confirmed:            "Buyurtma tasdiqlandi",
  pending_advance:      "Avans kutilmoqda",
  pending_material:     "Material kutilmoqda",
  ready_for_planning:   "Rejaga tayyor",
  in_planning:          "Rejalashtirilmoqda",
  completed_planning:   "Reja yakunlandi",
  ready_for_production: "Ishlab chiqarishga tayyor",
  in_production:        "Ishlab chiqarishda",
  in_progress:          "Jarayonda",
  ready_for_shipment:   "Jo'natishga tayyor",
  shipped:              "Jo'natildi",
  delivered:            "Yetkazildi",
  closed:               "Yopilgan",
  cancelled:            "Bekor qilingan",
  on_hold:              "To'xtatilgan",
};
