/**
 * @module ComingSoonPage
 * @description Canonical route-level "coming soon" placeholder (Qoida 17/19).
 *   Replaces the legacy Construction-icon StubPage for routes whose backend /
 *   data is not built yet. Wraps the design-system <EPComingSoon /> so deferred
 *   routes share the same EP look instead of an ad-hoc placeholder.
 */

import { useLocation } from "wouter";
import { EPComingSoon } from "@/components/ep";

export default function ComingSoonPage() {
  const [location] = useLocation();
  const module = location.replace(/^\//, "");
  return (
    <div className="py-10">
      <EPComingSoon
        description={
          <>
            <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{module}</code>{" "}
            moduli hali ishlab chiqilmoqda. Yaqin orada ishga tushiriladi.
          </>
        }
      />
    </div>
  );
}
