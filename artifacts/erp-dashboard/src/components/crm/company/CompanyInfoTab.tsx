/**
 * @module CompanyInfoTab
 * @description React UI component.
 */

import { Users, Phone, Mail, Globe, MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Company, formatAmount } from "./types";
import { useTranslation } from '@/lib/i18n';

interface CompanyInfoTabProps {
  company: Company;
}

export function CompanyInfoTab({ company }: CompanyInfoTabProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-3">
        {company.employees ? (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid="text-employees">
              {company.employees.toLocaleString()} xodim
            </span>
          </div>
        ) : null}
        {company.revenue ? (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid="text-revenue">
              {formatAmount(company.revenue)} UZS yillik daromad
            </span>
          </div>
        ) : null}
        {company.openDebt ? (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />
            <span className="text-sm text-[var(--ep-primary)]" data-testid="text-open-debt">
              Ochiq qarz: {formatAmount(company.openDebt)} UZS
            </span>
          </div>
        ) : null}
      </div>

      {(company.phones?.length > 0 || company.emails?.length > 0 || company.websites?.length > 0) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{t("boglanish")}</h3>
          {company.phones?.map((p, i) => (
            <div key={`k-${i}`} className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${p.value}`} className="text-sm hover:underline">{p.value}</a>
              <Badge variant="outline" className="text-xs">{p.type}</Badge>
            </div>
          ))}
          {company.emails?.map((e, i) => (
            <div key={`k-${i}`} className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${e.value}`} className="text-sm hover:underline">{e.value}</a>
              <Badge variant="outline" className="text-xs">{e.type}</Badge>
            </div>
          ))}
          {company.websites?.map((w, i) => (
            <div key={`k-${i}`} className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={w.value} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">{w.value}</a>
            </div>
          ))}
        </div>
      )}

      {company.address && (
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="text-sm" data-testid="text-address">{company.address}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2 border-t">
        <div>
          <div className="text-muted-foreground">{t("Yaratilgan")}</div>
          <div>{new Date(company.dateCreate).toLocaleDateString("uz-UZ")}</div>
        </div>
        <div>
          <div className="text-muted-foreground">{t("ozgartirilgan")}</div>
          <div>{new Date(company.dateModify).toLocaleDateString("uz-UZ")}</div>
        </div>
      </div>
    </div>
  );
}
