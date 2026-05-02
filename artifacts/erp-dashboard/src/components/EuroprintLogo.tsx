import { useState } from "react";

interface EuroprintLogoProps {
  height?: number;
  className?: string;
}

export function EuroprintLogo({ height = 28, className = "" }: EuroprintLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <span
        className={className}
        style={{ height: `${height}px`, display: "flex", alignItems: "center", fontWeight: 700, fontSize: `${Math.round(height * 0.6)}px`, letterSpacing: "-0.02em", userSelect: "none" }}
      >
        <span style={{ color: "#1a56db" }}>Euro</span><span style={{ color: "#111827" }}>print</span>
      </span>
    );
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}europrint-logo.svg`}
      alt="Europrint"
      height={height}
      style={{ height: `${height}px`, width: "auto", display: "block" }}
      className={className}
      draggable={false}
      onError={() => setImgError(true)}
    />
  );
}
