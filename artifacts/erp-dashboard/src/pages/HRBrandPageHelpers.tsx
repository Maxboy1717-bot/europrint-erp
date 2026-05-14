/** @module HRBrandPageHelpers @description Small utility UI components shared across HRBrandPage tab panels. */

import React from "react";

// ---------------------------------------------------------------------------
// CharCounter
// ---------------------------------------------------------------------------

interface CharCounterProps {
  value: string;
  max: number;
}

export function CharCounter({ value, max }: CharCounterProps) {
  const len = value?.length ?? 0;
  return (
    <span className={`text-xs ${len > max * 0.9 ? "text-[var(--ep-red)]" : "text-gray-400"}`}>
      {len}/{max}
    </span>
  );
}
