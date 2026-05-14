/**
 * @module camera-alerts-sections
 * @description Section and table components for camera-alerts page.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle,
  Clock,
  Filter,
  Search,
} from "lucide-react";
import { Link } from "wouter";
import type { AlertTranslations, CameraAlert, Language } from "./camera-alerts-types";
import { alertTypeIcons, alertTypeLabels, severityLabels } from "./camera-alerts-types";
import { EPPageHeader } from "@/components/ep";

interface StatCardsProps {
  totalAlerts: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  t: AlertTranslations;
}

export function AlertStatCards({ totalAlerts, unresolvedAlerts, criticalAlerts, t }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card rounded-lg p-5" data-testid="card-total-alerts">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.total}</span>
          <Bell className="h-5 w-5 text-[var(--ep-blue)]" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-total-alerts">{totalAlerts}</div>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-unresolved-alerts">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.unresolved}</span>
          <AlertTriangle className="h-5 w-5 text-[var(--ep-primary)]" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-[var(--ep-primary)]" data-testid="text-unresolved-alerts">{unresolvedAlerts}</div>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-critical-alerts">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.critical}</span>
          <AlertTriangle className="h-5 w-5 text-[var(--ep-red)]" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-[var(--ep-red)]" data-testid="text-critical-alerts">{criticalAlerts}</div>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  t: AlertTranslations;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function AlertPageHeader({ t, language, onLanguageChange }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/camera-dashboard">
            <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:bg-muted/40" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t.back}
            </Button>
          </Link>
        </div>
        <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Kamera Ogohlantirishlari</b></>}
        title="Kamera Ogohlantirishlari"
        subtitle={t.subtitle}
      />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <Button
            variant={language === "uz" ? "default" : "ghost"}
            size="sm"
            className="rounded-none px-4"
            onClick={() => onLanguageChange("uz")}
          >
            UZ
          </Button>
          <Button
            variant={language === "ru" ? "default" : "ghost"}
            size="sm"
            className="rounded-none px-4"
            onClick={() => onLanguageChange("ru")}
          >
            RU
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AlertsTableProps {
  filteredAlerts: CameraAlert[];
  language: Language;
  t: AlertTranslations;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterType: string;
  onFilterTypeChange: (v: string) => void;
  filterSeverity: string;
  onFilterSeverityChange: (v: string) => void;
  filterStatus: string;
  onFilterStatusChange: (v: string) => void;
  onAcknowledge: (id: number) => void;
  onResolve: (id: number) => void;
  isAcknowledgePending: boolean;
  isResolvePending: boolean;
}

export function AlertsTable({
  filteredAlerts, language, t,
  searchTerm, onSearchChange,
  filterType, onFilterTypeChange,
  filterSeverity, onFilterSeverityChange,
  filterStatus, onFilterStatusChange,
  onAcknowledge, onResolve,
  isAcknowledgePending, isResolvePending,
}: AlertsTableProps) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg h-9"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterType} onValueChange={onFilterTypeChange}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background border-border rounded-lg h-9" data-testid="select-type">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.type} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="safety">{language === "uz" ? "Xavfsizlik" : "Безопасность"}</SelectItem>
                <SelectItem value="quality">{language === "uz" ? "Sifat" : "Качество"}</SelectItem>
                <SelectItem value="machine">{language === "uz" ? "Mashina" : "Машина"}</SelectItem>
                <SelectItem value="productivity">{language === "uz" ? "Samaradorlik" : "Производительность"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={onFilterSeverityChange}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background border-border rounded-lg h-9" data-testid="select-severity">
                <SelectValue placeholder={t.severity} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="low">{language === "uz" ? "Past" : "Низкий"}</SelectItem>
                <SelectItem value="medium">{language === "uz" ? "O'rta" : "Средний"}</SelectItem>
                <SelectItem value="high">{language === "uz" ? "Yuqori" : "Высокий"}</SelectItem>
                <SelectItem value="critical">{language === "uz" ? "Kritik" : "Критический"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={onFilterStatusChange}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background border-border rounded-lg h-9" data-testid="select-status">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="acknowledged">{t.acknowledged}</SelectItem>
                <SelectItem value="resolved">{t.resolved}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.type}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.severity}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.message}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.status}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.time}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length > 0 ? (
                (Array.isArray(filteredAlerts) ? filteredAlerts : []).map((alert) => {
                  const IconComponent = alertTypeIcons[alert.alertType] || AlertTriangle;
                  const typeLabel = alertTypeLabels[alert.alertType]?.[language] || alert.alertType;
                  const severityLabel = severityLabels[alert.severity]?.[language] || alert.severity;
                  let rowClass = "hover:bg-muted/40 transition-colors border-none";
                  if ((alert.severity === "critical" || alert.severity === "KRITIK") && !alert.isResolved) {
                    rowClass += " bg-[var(--ep-red)]/10/20 border-l-4 border-error";
                  }
                  return (
                    <TableRow key={alert.id} className={rowClass} data-testid={`row-alert-${alert.id}`}>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            alert.alertType === "safety" ? "bg-orange-100 text-[var(--ep-primary)]" :
                            alert.alertType === "quality" ? "bg-blue-100 text-[var(--ep-blue)]" :
                            alert.alertType === "machine" ? "bg-purple-100 text-[var(--ep-purple)]" :
                            "bg-green-100 text-[var(--ep-green)]"
                          }`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-foreground">{typeLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge className={`${
                          alert.severity === "critical" ? "bg-red-100 text-red-800" :
                          alert.severity === "high" ? "bg-orange-100 text-orange-800" :
                          alert.severity === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                          {severityLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div>
                          <p className="font-bold text-foreground">{language === "uz" ? alert.title : (alert.titleRu || alert.title)}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">{alert.message}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {alert.isResolved ? (
                          <Badge className="bg-green-100 text-green-800 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle className="h-3 w-3 mr-1" />{t.resolved}
                          </Badge>
                        ) : alert.isAcknowledged ? (
                          <Badge className="bg-blue-100 text-blue-800 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <Check className="h-3 w-3 mr-1" />{t.acknowledged}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted/60 text-muted-foreground border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <Clock className="h-3 w-3 mr-1" />{t.pending}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(alert.createdAt).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          {!alert.isAcknowledged && (
                            <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)} disabled={isAcknowledgePending} className="rounded-lg border-border hover:bg-muted" data-testid={`button-acknowledge-${alert.id}`}>
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          {!alert.isResolved && (
                            <Button size="sm" variant="default" onClick={() => onResolve(alert.id)} disabled={isResolvePending} className="bg-primary text-white hover:bg-primary/90 rounded-lg" data-testid={`button-resolve-${alert.id}`}>
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-[13px] text-muted-foreground">
                    <Bell className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <p className="font-bold uppercase tracking-widest text-sm">{t.noAlerts}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table></div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
