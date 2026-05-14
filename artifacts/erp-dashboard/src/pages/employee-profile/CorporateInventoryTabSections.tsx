/**
 * @module CorporateInventoryTabSections
 * @description KPI summary row, active-items table, and returned-items table.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Laptop, Package, Plus, CheckCircle, RotateCcw,
  FileSignature, Clock, ClipboardList,
} from "lucide-react";
import type { CorporateInventoryItem } from "./CorporateInventoryTabTypes";
import { DEVICE_TYPES, CONDITION_COLORS } from "./CorporateInventoryTabTypes";
import { useTranslation } from '@/lib/i18n';

function DeviceIcon({ type }: { type: string }) {
  const found = DEVICE_TYPES.find(d => d.value === type);
  if (!found) return <Package className="h-4 w-4" />;
  const Icon = found.icon;
  return <Icon className="h-4 w-4" />;
}

interface KpiRowProps {
  activeItems: CorporateInventoryItem[];
  returnedItems: CorporateInventoryItem[];
}

export function InventoryKpiRow({ activeItems, returnedItems }: KpiRowProps) {
  const { t } = useTranslation("common");
  const unsignedCount = (Array.isArray(activeItems) ? activeItems : []).filter(i => !i.employeeSignedAt).length;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("faolInventar")}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{activeItems.length}</p>
        <ClipboardList className="h-4 w-4 text-primary mt-1" />
      </div>
      <div className="bg-card rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("imzosiz")}</p>
        <p className="text-3xl font-bold text-[var(--ep-yellow)] mt-1">{unsignedCount}</p>
        <FileSignature className="h-4 w-4 text-[var(--ep-yellow)] mt-1" />
      </div>
      <div className="bg-card rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("qaytarilgan")}</p>
        <p className="text-3xl font-bold text-[var(--ep-green)] mt-1">{returnedItems.length}</p>
        <RotateCcw className="h-4 w-4 text-[var(--ep-green)] mt-1" />
      </div>
    </div>
  );
}

interface ActiveTableProps {
  isLoading: boolean;
  activeItems: CorporateInventoryItem[];
  isHr: boolean;
  signPending: boolean;
  returnPending: boolean;
  onAdd: () => void;
  onSign: (id: number) => void;
  onReturn: (id: number) => void;
}

export function ActiveInventoryTable({
  isLoading, activeItems, isHr,
  signPending, returnPending,
  onAdd, onSign, onReturn,
}: ActiveTableProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Laptop className="h-5 w-5" />
            {t("korporativInventar")}
          </CardTitle>
          <CardDescription>{t("xodimgaBerilganQurilmalarVaJihozlar")}</CardDescription>
        </div>
        {isHr && (
          <Button size="sm" onClick={onAdd} data-testid="button-add-inventory">
            <Plus className="h-4 w-4 mr-2" />
            {t("add")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : activeItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t("inventarYoq")}</p>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("qurilma")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("serial")}</TableHead>
                <TableHead>{t("holati")}</TableHead>
                <TableHead>{t("berilganSana")}</TableHead>
                <TableHead>{t("imzo")}</TableHead>
                {isHr && <TableHead>{t("Amallar")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(activeItems) ? activeItems : []).map(item => (
                <TableRow key={item.id} data-testid={`row-inventory-${item.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DeviceIcon type={item.deviceType} />
                      <div>
                        <p className="font-medium text-sm">{item.deviceName}</p>
                        {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.deviceTypeLabel || item.deviceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.serialNumber || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs border-none ${CONDITION_COLORS[item.condition] || "bg-muted/60 text-muted-foreground"}`}>
                      {item.conditionLabel || item.condition}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{item.issuedDate}</TableCell>
                  <TableCell>
                    {item.employeeSignedAt ? (
                      <Badge className="bg-green-100 text-green-800 border-none text-xs gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t("imzolangan")}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800 border-none text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          {t("Kutilmoqda")}
                        </Badge>
                        <Button
                          size="sm" variant="outline" className="h-6 text-xs px-2"
                          onClick={() => onSign(item.id)}
                          disabled={signPending}
                          data-testid={`button-sign-${item.id}`}
                        >
                          {t("imzolash")}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  {isHr && (
                    <TableCell>
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 text-xs text-[var(--ep-primary)] hover:text-orange-700"
                        onClick={() => onReturn(item.id)}
                        disabled={returnPending}
                        data-testid={`button-return-${item.id}`}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t("qaytarildi")}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

interface ReturnedTableProps {
  returnedItems: CorporateInventoryItem[];
}

export function ReturnedInventoryTable({ returnedItems }: ReturnedTableProps) {
  const { t } = useTranslation("common");
  if (returnedItems.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <RotateCcw className="h-4 w-4" />
          {t("qaytarilganInventar")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("qurilma")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("Berilgan")}</TableHead>
              <TableHead>{t("qaytarilgan")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(returnedItems) ? returnedItems : []).map(item => (
              <TableRow key={item.id} className="opacity-60 hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="text-sm line-through">{item.deviceName}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{item.deviceTypeLabel || item.deviceType}</Badge></TableCell>
                <TableCell className="text-sm">{item.issuedDate}</TableCell>
                <TableCell className="text-sm text-[var(--ep-green)]">{item.returnedDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}
