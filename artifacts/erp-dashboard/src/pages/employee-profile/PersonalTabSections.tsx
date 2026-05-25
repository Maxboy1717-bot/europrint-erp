/**
 * @module PersonalTabSections
 * @description Pure display card components for the PersonalTab page:
 * PersonalInfoCard, ContactInfoCard, WorkConditionsCard, FamilyInfoCard.
 * No dialogs, no mutations — read-only presentation only.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, MapPin, Phone, Users, Home, Cake,
  DollarSign, Building2, Briefcase,
} from "lucide-react";
import type { SectionProps } from "./PersonalTabTypes";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// PersonalInfoCard
// ---------------------------------------------------------------------------

export function PersonalInfoCard({ employee, t, tCommon }: SectionProps) {
  const genderLabel =
    employee.gender === "erkak"
      ? t("male")
      : employee.gender === "ayol"
      ? t("female")
      : tCommon("notSpecified");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("personalInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("fullName")}</p>
            <p className="font-medium">{employee.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("birthDate")}</p>
            <p className="font-medium flex items-center gap-2">
              <Cake className="h-4 w-4" />
              {employee.birthDate || tCommon("notSpecified")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("age")}</p>
            <p className="font-medium">{employee.age || tCommon("unknown")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("gender")}</p>
            <p className="font-medium">{genderLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ContactInfoCard
// ---------------------------------------------------------------------------

export function ContactInfoCard({ employee, t, tCommon }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          {t("contactInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{tCommon("phone")}</p>
              <p className="font-medium">{employee.phone || tCommon("notSpecified")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{t("address")}</p>
              <p className="font-medium">{employee.address || tCommon("notSpecified")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Home className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{t("district")}</p>
              <p className="font-medium">{employee.district || tCommon("notSpecified")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// WorkConditionsCard
// ---------------------------------------------------------------------------

const KNOWN_SALARY_TYPES = ["monthly", "hourly", "piecework", "contract", "oylik", "soatbay", "ishbay"] as const;

function SalaryTypeLabel({ salaryType }: { salaryType: string }) {
  const { t } = useTranslation("common");
  if (salaryType === "monthly" || salaryType === "oylik") {
    return (
      <div>
        <p className="font-medium">{t("oylikStavka")}</p>
        <p className="text-xs text-muted-foreground">{t("belgilanganOylikMaosh")}</p>
      </div>
    );
  }
  if (salaryType === "hourly" || salaryType === "soatbay") {
    return (
      <div>
        <p className="font-medium">{t("soatbay")}</p>
        <p className="text-xs text-muted-foreground">{t("ishSoatiSoatlikTarif")}</p>
      </div>
    );
  }
  if (salaryType === "piecework" || salaryType === "ishbay") {
    return (
      <div>
        <p className="font-medium">{t("akkordIshbay")}</p>
        <p className="text-xs text-muted-foreground">{t("miqdorTarifFormulasi")}</p>
      </div>
    );
  }
  if (salaryType === "contract") {
    return (
      <div>
        <p className="font-medium">{t("shartnomaAsosida")}</p>
        <p className="text-xs text-muted-foreground">{t("alohidaShartnomaShartlari")}</p>
      </div>
    );
  }
  // Unknown type — render as-is
  return <p className="font-medium">{salaryType}</p>;
}

export function WorkConditionsCard({ employee, t, tCommon }: SectionProps) {
  const zoneLabel = employee.workshopZone || employee.departmentName || tCommon("notSpecified");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          {t("ishShartlari")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("maoshTuri")}</p>
            {employee.salaryType ? (
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <SalaryTypeLabel salaryType={employee.salaryType} />
              </div>
            ) : (
              <p className="font-medium text-muted-foreground">{tCommon("notSpecified")}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("smena")}</p>
            <p className="font-medium">{employee.shift || tCommon("notSpecified")}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">{t("sexZona")}</p>
            <div className="flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{zoneLabel}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// FamilyInfoCard
// ---------------------------------------------------------------------------

function housingTypeLabel(raw: string | undefined | null): string {
  switch (raw) {
    case "ijara":                return "Ijaraga olingan";
    case "shaxsiy":
    case "shaxsiy uy":           return "Shaxsiy uy";
    case "kvartira":             return "Kvartira";
    case "yotoqxona":            return "Yotoqxona";
    case "qarindoshlar bilan":   return "Qarindoshlar bilan";
    default:                     return raw ?? "";
  }
}

export function FamilyInfoCard({ employee, t, tCommon }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("familyInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("maritalStatus")}</p>
            <p className="font-medium">{employee.maritalStatus || tCommon("notSpecified")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("childrenCount")}</p>
            <p className="font-medium">{employee.childrenCount || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("householdSize")}</p>
            <p className="font-medium">{employee.householdSize || tCommon("notSpecified")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("housingType")}</p>
            <p className="font-medium">
              {housingTypeLabel(employee.housingType) || tCommon("notSpecified")}
            </p>
          </div>
        </div>
        {employee.householdMembers && (
          <div>
            <p className="text-sm text-muted-foreground">{t("householdMembers")}</p>
            <p className="font-medium">{employee.householdMembers}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
