# Loop Open-Questions / Skipped Items — 2026-07-11

> Single running file for the combined Design-System + 1,163-item build loop.
> Sections: (a) owner-gated items, (b) safety-skipped items, (c) scope/naming ambiguities.
> All raised TOGETHER at the very end — never mid-loop.

---

## (a) Owner-gated items (need data / decision / credential / schema approval)

_(none yet)_

---

## (b) Items skipped for a genuine safety concern (regression / wrong premise / collision)

_(none yet)_

---

## (c) Scope / naming ambiguities needing a quick owner call

### Q-C1 — Phase-1 modal fix: proposal has 3 parts, only 1 is in the D-item queue
The design proposal's "peach modal" remedy is three coordinated fixes (Part 3.1 + sizing table
Fix #1/#2/#3):
- **Fix #1** = correct `--ep-bg`/`--background`/`--ep-border`/`--border` tokens in
  `europrint-mockup-theme.css`. → **This is Phase-1 Item D1. DONE.**
- **Fix #2** = change shared `components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx` default
  from `bg-background` → `bg-card` (#FFFFFF), so modals get a pure-white surface that separates
  from the now-#FAFAF9 page. **NOT present as any D1–D6 item.** After D1, page and modal are both
  #FAFAF9 (peach is gone — D1's goal met — but modal↔page surface separation is lost until Fix #2).
- **Fix #3** = retire the `kit.css` blush sub-palette (`--bg-blush*`, `--line-warm*`) + its
  `badge.tsx`/`button.tsx` hover consumers. **NOT present as any D1–D6 item.** Peach can still
  resurface on badge/button hover states until this lands.

**Question:** Do you want Fix #2 and Fix #3 built too (each as its own commit, same discipline)?
They're low-risk shared-component corrections but were not enumerated in the D1–D6 list, so per
no-scope-creep I did not build them. D1 alone already removes the peach page/modal background.
