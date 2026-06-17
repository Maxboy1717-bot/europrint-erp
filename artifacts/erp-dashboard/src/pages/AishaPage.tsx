/**
 * AishaPage — #15 P1/P2. Dedicated immersive surface for the AIsha assistant, decoupled from
 * DirectorDashboard. A large reactive "core" (orb) is the focal point; its animation changes with the
 * real assistant state (idle / listening / thinking / speaking) from the Aisha store. The functional
 * panels (chat, wake-word/voice, transparency/provenance) live here too. Owner design-exception (Q-41):
 * bespoke futuristic theme in aisha-immersive.css — the rest of the ERP keeps EP tokens.
 */

import { useAishaStore } from "@/aisha/store";
import { AishaChatPanel } from "@/components/aisha/AishaChatPanel";
import { AishaPanel } from "@/components/aisha/AishaPanel";
import { TransparencyPanel } from "@/components/aisha/TransparencyPanel";
import "@/components/aisha/aisha-immersive.css";

// Expose Zustand store for Playwright E2E tests (non-production only). Allows test helpers to call
// window.__AISHA_STORE__.setState({...}) to simulate AIsha voice-command results without a real mic.
// (Moved here from DirectorDashboard in #15 P1 — the assistant now lives on this page.)
if (typeof window !== "undefined" && import.meta.env.MODE !== "production") {
  (window as Window & { __AISHA_STORE__?: typeof useAishaStore }).__AISHA_STORE__ = useAishaStore;
}

const STATUS_LABEL: Record<string, string> = {
  idle:      "Tayyor",
  listening: "Tinglayapman",
  thinking:  "O'ylayapman",
  speaking:  "Javob beryapman",
  muted:     "O'chirilgan",
  error:     "Xatolik",
};

export default function AishaPage() {
  const status = useAishaStore((s) => s.status);
  return (
    <div className="aisha-immersive" data-testid="aisha-page">
      {/* ── living core (reacts to assistant state) ── */}
      <div className="aisha-core" data-status={status} data-testid="aisha-core">
        <span className="aisha-core__ring" />
        <span className="aisha-core__ring r2" />
        <span className="aisha-core__ring r3" />
        <span className="aisha-core__bulb" />
      </div>
      <div className="aisha-immersive__title">AIsha</div>
      <div className="aisha-immersive__status" data-testid="aisha-core-status">{STATUS_LABEL[status] ?? status}</div>
      <div className="aisha-immersive__hint">Gapiring yoki pastdagi oynaga yozing — &quot;Aisha&quot; deb chaqiring</div>

      {/* ── functional panels (chat + wake-word/voice + provenance) ── */}
      <AishaChatPanel isDirector />
      <AishaPanel isDirector />
      <TransparencyPanel />
    </div>
  );
}
