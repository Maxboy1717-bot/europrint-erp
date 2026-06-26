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
import { useTranslation } from "@/lib/i18n";
import "@/components/aisha/aisha-immersive.css";

// Expose Zustand store for Playwright E2E tests (non-production only). Allows test helpers to call
// window.__AISHA_STORE__.setState({...}) to simulate AIsha voice-command results without a real mic.
// (Moved here from DirectorDashboard in #15 P1 — the assistant now lives on this page.)
if (typeof window !== "undefined" && import.meta.env.MODE !== "production") {
  (window as Window & { __AISHA_STORE__?: typeof useAishaStore }).__AISHA_STORE__ = useAishaStore;
}

const STATUS_KEYS: Record<string, string> = {
  idle:      "status.idle",
  listening: "status.listening",
  thinking:  "status.thinking",
  speaking:  "status.speaking",
  muted:     "status.muted",
  error:     "status.error",
};

export default function AishaPage() {
  const { t } = useTranslation("aisha");
  const status = useAishaStore((s) => s.status);
  const statusKey = STATUS_KEYS[status];
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
      <div className="aisha-immersive__status" data-testid="aisha-core-status">{statusKey ? t(statusKey) : status}</div>
      <div className="aisha-immersive__hint">{t("immersiveHint")}</div>

      {/* ── functional panels (chat + wake-word/voice + provenance) ── */}
      <AishaChatPanel isDirector />
      <AishaPanel isDirector />
      <TransparencyPanel />
    </div>
  );
}
