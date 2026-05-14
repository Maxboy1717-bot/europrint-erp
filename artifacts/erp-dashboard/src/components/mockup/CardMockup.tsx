/**
 * CardMockup — sahifaga ramka beradigan card komponent (mockup uslubi).
 *
 *   <CardMockup title={t("yangiXodimlar")} action={<button>{t("hammasi")}</button>}>
 *     ...
 *   </CardMockup>
 */
import type { ReactNode } from "react";
import { useTranslation } from '@/lib/i18n';

interface CardMockupProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
}

export function CardMockup({ title, action, children, className = '', bodyClass = '' }: CardMockupProps) {
  const { t } = useTranslation("common");
  return (
    <div className={`ep-card ${className}`}>
      {(title || action) && (
        <div className="ep-card-header">
          {title && <h6>{title}</h6>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`ep-card-body ${bodyClass}`}>{children}</div>
    </div>
  );
}
