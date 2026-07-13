/**
 * @module EuroprintLogo
 * @description React UI component.
 */

import { useState } from "react";

import { useTranslation } from '@/lib/i18n';
interface EuroprintLogoProps {
  height?: number;
  className?: string;
}

export function EuroprintLogo({height = 28, className = "" }: EuroprintLogoProps) {
  const { t } = useTranslation('common');
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <span
        className={className}
        style={{ height: `${height}px`, display: "flex", alignItems: "center", fontWeight: 700, fontSize: `${Math.round(height * 0.6)}px`, letterSpacing: "-0.02em", userSelect: "none" }}
      >
        <span style={{ color: "var(--ep-blue)" }}>{t("euro")}</span><span style={{ color: "var(--ep-text)" }}>{t('print1')}</span>
      </span>
    );
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}europrint-doc-logo.png`}
      alt={t("europrint")}
      height={height}
      // height + width:auto + object-contain => the real logo is scaled whole, never cropped
      // or stretched (owner: "qismasdan o'zgartirmasdan").
      style={{ height: `${height}px`, width: "auto", display: "block", objectFit: "contain" }}
      className={className}
      draggable={false}
      onError={() => setImgError(true)}
    />
  );
}
