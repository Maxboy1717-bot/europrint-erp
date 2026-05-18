import { lazy } from "react";

const Stub = lazy(() => import("@/pages/StubPage"));

/**
 * STUB_ROUTES — frontend routes that still render the generic `<StubPage />`.
 *
 * After Wave 11 cleanup (2026-05-18), this list was reduced from 69 entries
 * to 17. Every remaining entry is referenced from at least one sidebar menu
 * item (see `src/components/sidebar/constants*.ts`). The removed entries had
 * no sidebar link and no other route consumer, so they were unreachable.
 *
 * When you implement a real page for one of these routes, add it to the
 * appropriate `routes/*Routes.tsx` file (HR, Finance, IoT, etc.) and remove
 * the entry from this array.
 */
export const STUB_ROUTES: [string, React.ComponentType][] = [
  ['/3way-match',                Stub], // sidebar: 3way-match (mirrors /mm/3way-match)
  ['/ai',                        Stub], // sidebar: ai (AI hub landing)
  ['/ai/crm',                    Stub], // sidebar: ai/crm
  ['/ai/finance',                Stub], // sidebar: ai/finance
  ['/employee-zone-history',     Stub], // sidebar: employee-zone-history
  ['/gl',                        Stub], // sidebar: gl (general ledger)
  ['/iot-enhanced',              Stub], // sidebar: iot-enhanced
  ['/iot-sensors',               Stub], // sidebar: iot-sensors
  ['/machine-status-current',    Stub], // sidebar: machine-status-current
  ['/pos/movements',             Stub], // sidebar: pos/movements
  ['/pos/requests',              Stub], // sidebar: pos/requests
  ['/production-facts',          Stub], // sidebar: production-facts
  ['/production/shift-reports',  Stub], // sidebar: production/shift-reports
  ['/quality-defects-camera',    Stub], // sidebar: quality-defects-camera
  ['/users',                     Stub], // sidebar: users (admin)
  ['/waste',                     Stub], // sidebar: waste
  ['/weekly-plans',              Stub], // sidebar: weekly-plans
];
