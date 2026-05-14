/**
 * @module CompanyHeader
 * @description React UI component.
 */

import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Pencil } from "lucide-react";
import { Company } from "./types";
import { useTranslation } from '@/lib/i18n';

interface CompanyHeaderProps {
  company: Company;
  isEditMode: boolean;
  onEditClick: () => void;
}

export function CompanyHeader({ company, isEditMode, onEditClick }: CompanyHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <SheetHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <SheetTitle className="flex items-center gap-2" data-testid="text-company-name">
            <Building2 className="h-5 w-5" />
            {company.title}
          </SheetTitle>
          <SheetDescription>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {company.industry && (
                <Badge variant="secondary">{company.industry}</Badge>
              )}
              {company.stir && (
                <Badge variant="outline">STIR: {company.stir}</Badge>
              )}
              {company.customerCategory && (
                <Badge className={company.customerCategory === 'A' ? 'bg-green-100 text-[var(--ep-green)]' : company.customerCategory === 'B' ? 'bg-blue-100 text-[var(--ep-blue)]' : 'bg-gray-100 text-gray-700'}>
                  {company.customerCategory} kategoriya
                </Badge>
              )}
              {company.segment && (
                <Badge variant="outline">{company.segment}</Badge>
              )}
            </div>
          </SheetDescription>
        </div>
        {!isEditMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditClick}
            data-testid="button-edit"
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t("edit")}
          </Button>
        )}
      </div>
    </SheetHeader>
  );
}
