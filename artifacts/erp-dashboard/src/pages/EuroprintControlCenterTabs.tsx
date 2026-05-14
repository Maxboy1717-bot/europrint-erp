/**
 * @module EuroprintControlCenterTabs
 * @description Tab panel components for the EuroprintControlCenter page:
 * BusinessRulesTab, UnitsTab, ValidationTab, KpisTab, and the wrapper ControlCenterTabs.
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Database, Lock, TrendingUp } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type {
  BusinessRule,
  KpiDefinition,
  UnitOfMeasure,
  ValidationRule,
} from "./EuroprintControlCenterTypes";

// ---------------------------------------------------------------------------
// BusinessRulesTab
// ---------------------------------------------------------------------------

interface BusinessRulesTabProps {
  businessRules: BusinessRule[];
}

function BusinessRulesTab({ businessRules }: BusinessRulesTabProps) {
  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <Lock className="h-5 w-5" />
        Biznes Qoidalari (Qattiq Nazorat)
      </h3>
      <div className="space-y-3">
        {(Array.isArray(businessRules) ? businessRules : []).map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-muted/40 transition-colors"
            data-testid={`rule-${rule.ruleCode}`}
          >
            <div className="flex items-center gap-4">
              {rule.ruleType === "block" ? (
                <AlertTriangle className="h-5 w-5 text-[var(--ep-red)]" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)]" />
              )}
              <div>
                <p className="font-bold text-foreground">{rule.ruleName}</p>
                <p className="text-sm text-muted-foreground">{rule.errorMessageUz}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  rule.ruleType === "block"
                    ? "bg-red-100 text-red-800"
                    : "bg-muted/60 text-foreground"
                )}
              >
                {rule.ruleType === "block" ? "BLOK" : "OGOHLANTIRISH"}
              </Badge>
              <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {rule.category}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UnitsTab
// ---------------------------------------------------------------------------

interface UnitsTabProps {
  units: UnitOfMeasure[];
}

function UnitsTab({ units }: UnitsTabProps) {
  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <Database className="h-5 w-5" />
        O&apos;lchov Birliklari (SSOT)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {(Array.isArray(units) ? units : []).map((unit) => (
          <div
            key={unit.id}
            className="p-4 bg-background rounded-lg text-center hover:bg-muted/40 transition-colors"
            data-testid={`unit-${unit.code}`}
          >
            <p className="font-bold text-2xl text-foreground">{unit.code}</p>
            <p className="text-xs text-muted-foreground mt-1">{unit.name}</p>
            <Badge
              variant="outline"
              className="mt-3 rounded-full text-[10px] font-bold uppercase tracking-wider border-surface-container"
            >
              {unit.category}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ValidationTab
// ---------------------------------------------------------------------------

interface ValidationTabProps {
  validationRules: ValidationRule[];
}

function ValidationTab({ validationRules }: ValidationTabProps) {
  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <CheckCircle className="h-5 w-5" />
        Tekshirish Qoidalari (ERP Validator)
      </h3>
      <div className="space-y-3">
        {(Array.isArray(validationRules) ? validationRules : []).map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-muted/40 transition-colors"
            data-testid={`validation-${rule.ruleCode}`}
          >
            <div>
              <p className="font-bold text-foreground">{rule.ruleName}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">{rule.ruleCode}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  rule.severity === "critical"
                    ? "bg-red-100 text-red-800"
                    : rule.severity === "high"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-muted/60 text-foreground"
                )}
              >
                {rule.severity}
              </Badge>
              <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {rule.category}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KpisTab
// ---------------------------------------------------------------------------

interface KpisTabProps {
  kpis: KpiDefinition[];
}

function KpisTab({ kpis }: KpisTabProps) {
  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        KPI Ko&apos;rsatkichlari
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Array.isArray(kpis) ? kpis : []).map((kpi) => (
          <div
            key={kpi.id}
            className="p-5 bg-background rounded-lg hover:bg-muted/40 transition-colors"
            data-testid={`kpi-${kpi.kpiCode}`}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {kpi.kpiName}
              </p>
              {kpi.blockOnViolation && <Lock className="h-4 w-4 text-[var(--ep-red)]" />}
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {kpi.targetValue} {kpi.unit}
            </p>
            <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold mt-4">
              {kpi.category}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ControlCenterTabs — composed tab container
// ---------------------------------------------------------------------------

interface ControlCenterTabsProps {
  businessRules: BusinessRule[];
  units: UnitOfMeasure[];
  validationRules: ValidationRule[];
  kpis: KpiDefinition[];
}

export function ControlCenterTabs({
  businessRules,
  units,
  validationRules,
  kpis,
}: ControlCenterTabsProps) {
  const { t } = useTranslation("common");
  return (
    <Tabs defaultValue="rules" className="mt-10">
      <TabsList className="bg-muted/60 p-1 rounded-xl">
        <TabsTrigger
          value="rules"
          className="rounded-lg data-[state=active]:bg-card"
          data-testid="tab-rules"
        >
          {t("biznesQoidalar")}
        </TabsTrigger>
        <TabsTrigger
          value="units"
          className="rounded-lg data-[state=active]:bg-card"
          data-testid="tab-units"
        >
          O&apos;lchov Birliklari
        </TabsTrigger>
        <TabsTrigger
          value="validation"
          className="rounded-lg data-[state=active]:bg-card"
          data-testid="tab-validation"
        >
          {t("tekshiruvlar")}
        </TabsTrigger>
        <TabsTrigger
          value="kpis"
          className="rounded-lg data-[state=active]:bg-card"
          data-testid="tab-kpis"
        >
          KPI
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rules" className="mt-6">
        <BusinessRulesTab businessRules={businessRules} />
      </TabsContent>

      <TabsContent value="units" className="mt-6">
        <UnitsTab units={units} />
      </TabsContent>

      <TabsContent value="validation" className="mt-6">
        <ValidationTab validationRules={validationRules} />
      </TabsContent>

      <TabsContent value="kpis" className="mt-6">
        <KpisTab kpis={kpis} />
      </TabsContent>
    </Tabs>
  );
}
