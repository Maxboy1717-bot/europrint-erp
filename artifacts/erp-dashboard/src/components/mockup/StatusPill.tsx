/**
 * StatusPill — SmartHR mockup style status indicator.
 *
 *   <StatusPill variant="success">{t("active")}</StatusPill>
 */
import type { ReactNode } from "react";
import { useTranslation } from '@/lib/i18n';

type Variant = 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'purple' | 'pink' | 'dark';

interface StatusPillProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function StatusPill({ variant = 'primary', children, className = '' }: StatusPillProps) {
  const { t } = useTranslation("common");
  return (
    <span className={`status-pill sp-${variant} ${className}`}>
      {children}
    </span>
  );
}
