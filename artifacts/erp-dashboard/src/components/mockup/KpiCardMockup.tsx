/**
 * KpiCardMockup — SmartHR mockup style.
 *
 *   <KpiCardMockup icon="bi-people" iconColor="orange" label="Xodimlar" value={154} link="Hammasini ko'rish" />
 */
import type { ReactNode } from "react";

type IconColor = 'orange' | 'dark' | 'blue' | 'pink' | 'purple' | 'red' | 'green' | 'darker';

interface KpiCardProps {
  icon: ReactNode;
  iconColor?: IconColor;
  label: string;
  value: string | number;
  link?: string;
  onLinkClick?: () => void;
}

export function KpiCardMockup({ icon, iconColor = 'orange', label, value, link, onLinkClick }: KpiCardProps) {
  return (
    <div className="kpi-card-mockup">
      <div className={`kpi-icon-sq ki-${iconColor}`}>
        {icon}
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {link && (
        <a
          href="#"
          className="kpi-link"
          onClick={(e) => { e.preventDefault(); onLinkClick?.(); }}
        >
          {link} →
        </a>
      )}
    </div>
  );
}
