/**
 * @module AishaHudCorners
 * @description Four decorative corner brackets that give a glass panel the
 * sci-fi "instrument frame" silhouette (see aisha-immersive.css .aisha-hud-corner*).
 * Purely visual — render as the first child of any `position: relative|fixed|absolute`
 * container. aria-hidden since it carries no information.
 */

export function AishaHudCorners() {
  return (
    <>
      <span className="aisha-hud-corner aisha-hud-corner--tl" aria-hidden="true" />
      <span className="aisha-hud-corner aisha-hud-corner--tr" aria-hidden="true" />
      <span className="aisha-hud-corner aisha-hud-corner--bl" aria-hidden="true" />
      <span className="aisha-hud-corner aisha-hud-corner--br" aria-hidden="true" />
    </>
  );
}
