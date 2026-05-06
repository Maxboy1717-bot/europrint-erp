/**
 * StatusPill — SmartHR mockup style status indicator.
 *
 *   <StatusPill variant="success">Faol</StatusPill>
 */
import type { ReactNode } from "react";

type Variant = 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'purple' | 'pink' | 'dark';

interface StatusPillProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function StatusPill({ variant = 'primary', children, className = '' }: StatusPillProps) {
  return (
    <span className={`status-pill sp-${variant} ${className}`}>
      {children}
    </span>
  );
}
