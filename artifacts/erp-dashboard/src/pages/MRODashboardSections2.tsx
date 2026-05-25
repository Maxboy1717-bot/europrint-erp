/**
 * @module MRODashboardSections2
 * @description Utilities, Building, Cleaning and Uniforms tab sections for MRODashboard.
 * Items, Requests and Equipment tabs live in MRODashboardSections.tsx.
 */

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CheckCircle, Clock, Activity, Zap, Flame, Droplets, Building2, Shirt,
} from "lucide-react";
import { TH } from "./MRODashboardSections";
import { useTranslation } from '@/lib/i18n';
import type {
  MroItem, MroUtilityReading, MroFacility, MroCleaningSchedule,
} from "./MRODashboardTypes";

// ── UtilitiesTab ──────────────────────────────────────────────────────────────
interface UtilitiesTabProps {
  utilityData: MroUtilityReading[];
  utilityLoading: boolean;
}

export function UtilitiesTab({ utilityData, utilityLoading }: UtilitiesTabProps) {
  const { t } = useTranslation("common");
  if (utilityLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={`k-${i}`} className="h-48 w-full rounded-lg" />)}
      </div>
    );
  }
  if (utilityData.length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-muted-foreground">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{t("malumotYoq")}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {(Array.isArray(utilityData) ? utilityData : []).map(u => {
        const Icon = u.utilityType === "electricity" ? Zap : u.utilityType === "gas" ? Flame : Droplets;
        const color = u.utilityType === "electricity" ? "text-[var(--ep-yellow)]" : u.utilityType === "gas" ? "text-[var(--ep-primary)]" : "text-[var(--ep-blue)]";
        const typeLabel = u.utilityType === "electricity" ? "Elektr" : u.utilityType === "gas" ? "Gaz" : "Suv";
        const monthTotal = u.monthTotal || 0;
        const monthBudget = u.monthBudget || 1;
        const trend = u.trendPercent || 0;
        return (
          <div key={u.id} className="bg-muted/40 rounded-lg p-5 border border-border" data-testid={`card-utility-${u.id}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted/60">
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="font-bold text-foreground">{typeLabel}</p>
                <p className="text-xs text-muted-foreground">{u.unit} birligida</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">{t("bugun")}</span><span className="font-mono font-bold text-foreground">{(u.todayValue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">{t("kecha")}</span><span className="font-mono text-foreground">{(u.yesterdayValue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">{t("buOy1")}</span><span className="font-mono text-foreground">{monthTotal.toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">{t("byudjet1")}</span><span className="font-mono text-foreground">{(u.monthBudget || 0).toLocaleString()}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("ozgarish1")}</span>
                <span className={`text-xs font-bold ${trend < 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                  {trend > 0 ? "+" : ""}{trend}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">{t("byudjetSarfi")}</span>
                <span className="text-foreground font-bold">{Math.round((monthTotal / monthBudget) * 100)}%</span>
              </div>
              <div className="w-full bg-muted/60 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${(monthTotal / monthBudget) > 0.9 ? "bg-[var(--ep-red)]" : (monthTotal / monthBudget) > 0.7 ? "bg-amber-500" : "bg-green-600"}`}
                  style={{ width: `${Math.min((monthTotal / monthBudget) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── BuildingTab ───────────────────────────────────────────────────────────────
interface BuildingTabProps {
  buildingRooms: MroFacility[];
  facilitiesLoading: boolean;
}

export function BuildingTab({ buildingRooms, facilitiesLoading }: BuildingTabProps) {
  const { t } = useTranslation("common");
  if (facilitiesLoading) {
    return <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}</div>;
  }
  if (buildingRooms.length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-muted-foreground">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{t("xonalarMalumotiMavjudEmas")}</p>
      </div>
    );
  }
  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow className="border-none hover:bg-transparent">
          <TH rounded="left">{t("xonaZona")}</TH>
          <TH>{t("maydonM")}</TH>
          <TH>{t("sigim")}</TH>
          <TH>{t("oxirgiTekshiruv")}</TH>
          <TH>{t("status28")}</TH>
          <TH rounded="right">{t("Izoh")}</TH>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(buildingRooms) ? buildingRooms : []).map(r => (
          <TableRow key={r.id} data-testid={`row-room-${r.id}`} className="border-none hover:bg-muted/40 transition-colors">
            <TableCell className="font-bold px-6 text-foreground">{r.name}</TableCell>
            <TableCell className="px-6 text-foreground">{r.areaM2} m²</TableCell>
            <TableCell className="px-6 text-foreground">{(r.capacity || 0) > 0 ? `${r.capacity} kishi` : "—"}</TableCell>
            <TableCell className="text-sm px-6 text-muted-foreground">{r.lastInspection ? new Date(r.lastInspection).toLocaleDateString() : "—"}</TableCell>
            <TableCell className="px-6">
              <Badge className={r.status === "active"
                ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                : "bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
              }>
                {r.status === "active" ? "Faol" : r.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm px-6 text-muted-foreground">{r.notes || "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
}

// ── CleaningTab ───────────────────────────────────────────────────────────────
export function CleaningTab({ cleaningSchedule }: { cleaningSchedule: MroCleaningSchedule[] }) {
  const { t } = useTranslation("common");
  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow className="border-none hover:bg-transparent">
          <TH rounded="left">{t("maydon1")}</TH>
          <TH>{t("chastota")}</TH>
          <TH>{t("oxirgiTozalash")}</TH>
          <TH>{t("next")}</TH>
          <TH>{t("masul")}</TH>
          <TH rounded="right">{t("status28")}</TH>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(cleaningSchedule) ? cleaningSchedule : []).map(c => (
          <TableRow key={c.id} data-testid={`row-cleaning-${c.id}`} className="border-none hover:bg-muted/40 transition-colors">
            <TableCell className="font-medium px-6 text-foreground">{c.area}</TableCell>
            <TableCell className="px-6 text-foreground">
              <Badge variant="outline" className="border-border text-muted-foreground">
                {c.frequency === "daily" ? "Kunlik" : c.frequency === "twice_daily" ? "2x Kunlik" : "3x Kunlik"}
              </Badge>
            </TableCell>
            <TableCell className="text-sm px-6 text-muted-foreground">{c.lastCleaned ? new Date(c.lastCleaned).toLocaleTimeString("uz-UZ") : "—"}</TableCell>
            <TableCell className="text-sm px-6 text-muted-foreground">{c.nextCleaning ? new Date(c.nextCleaning).toLocaleTimeString("uz-UZ") : "—"}</TableCell>
            <TableCell className="text-sm px-6 text-muted-foreground">{c.responsible}</TableCell>
            <TableCell className="px-6">
              <Badge className={c.status === "done"
                ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                : "bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
              }>
                {c.status === "done" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                {c.status === "done" ? "Bajarildi" : "Kutilmoqda"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
}

// ── UniformsTab ───────────────────────────────────────────────────────────────
export function UniformsTab({ ppeItems }: { ppeItems: MroItem[] }) {
  const { t } = useTranslation("common");
  if (ppeItems.length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-muted-foreground">
        <Shirt className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{t("malumotYoq")}</p>
      </div>
    );
  }
  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow className="border-none hover:bg-transparent">
          <TH rounded="left">{t("Mahsulot")}</TH>
          <TH>{t("unit")}</TH>
          <TH>{t("quantity")}</TH>
          <TH>{t("min1")}</TH>
          <TH rounded="right">{t("status28")}</TH>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(ppeItems) ? ppeItems : []).map(u => (
          <TableRow key={u.id} data-testid={`row-uniform-${u.id}`} className="border-none hover:bg-muted/40 transition-colors">
            <TableCell className="font-medium px-6 text-foreground">{u.name}</TableCell>
            <TableCell className="px-6 text-foreground">
              <Badge variant="outline" className="border-border text-muted-foreground">{u.unit}</Badge>
            </TableCell>
            <TableCell className="font-mono px-6 text-foreground">{u.currentStock} dona</TableCell>
            <TableCell className="font-mono px-6 text-muted-foreground">{u.minStock}</TableCell>
            <TableCell className="px-6">
              <Badge className={(u.currentStock || 0) > (u.minStock || 0)
                ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                : "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
              }>
                {(u.currentStock || 0) > (u.minStock || 0) ? "Normal" : "Kam"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
}
