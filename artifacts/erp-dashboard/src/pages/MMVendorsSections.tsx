/**
 * @module MMVendorsSections
 * @description Presentational section components for the MMVendors page:
 * summary stat cards and the main vendors table (with loading / empty states).
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Mail, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import type { Vendor } from "./MMVendorsTypes";

import { useTranslation } from '@/lib/i18n';
// ---------------------------------------------------------------------------
// Stats cards
// ---------------------------------------------------------------------------

interface VendorStatsProps {
  total: number;
  active: number;
  inactive: number;
}

export function VendorStats({total, active, inactive }: VendorStatsProps) {
  const { t } = useTranslation('common');
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-card rounded-lg p-5" data-testid="text-total-vendors">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t("jamiYetkazuvchilar")}
        </p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{total}</p>
      </div>

      <div className="bg-card rounded-lg p-5" data-testid="text-active-vendors">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t("active")}
        </p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{active}</p>
        <p className="text-xs text-[var(--ep-green)] mt-2 font-medium">{t("faolYetkazuvchilar")}</p>
      </div>

      <div className="bg-card rounded-lg p-5" data-testid="text-inactive-vendors">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t("inactive")}
        </p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{inactive}</p>
        <p className="text-xs text-muted-foreground mt-2 font-medium">{t("nofaolYetkazuvchilar")}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vendors table card
// ---------------------------------------------------------------------------

interface VendorsTableCardProps {
  vendors: Vendor[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  onEditClick: (vendor: Vendor) => void;
  onDeleteClick: (vendor: Vendor) => void;
}

export function VendorsTableCard({
  vendors,
  isLoading,
  searchQuery,
  onSearchChange,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: VendorsTableCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="bg-card border-none rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("yetkazuvchilarRoyxati1")}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("Qidirish...")}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-background border-border text-foreground"
                data-testid="input-search-vendors"
              />
            </div>
            <Button onClick={onCreateClick} data-testid="button-create-vendor">
              <Plus className="h-4 w-4 mr-2" />
              {t("yangiYetkazuvchi")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : vendors.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery} />
        ) : (
          <VendorsTable
            vendors={vendors}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="text-center py-8 text-[13px] text-muted-foreground" data-testid="text-no-vendors">
      {hasSearch ? "Qidiruv bo'yicha hech narsa topilmadi" : "Yetkazuvchilar mavjud emas"}
    </div>
  );
}

interface VendorsTableProps {
  vendors: Vendor[];
  onEditClick: (vendor: Vendor) => void;
  onDeleteClick: (vendor: Vendor) => void;
}

function VendorsTable({ vendors, onEditClick, onDeleteClick }: VendorsTableProps) {
  const { t } = useTranslation("common");
  const headCls =
    "bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6";

  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
          <TableHead className={headCls}>{t("code")}</TableHead>
          <TableHead className={headCls}>{t("name")}</TableHead>
          <TableHead className={headCls}>{t("phone")}</TableHead>
          <TableHead className={headCls}>{"Email"}</TableHead>
          <TableHead className={headCls}>{t("tolovShartlari")}</TableHead>
          <TableHead className={headCls}>{t("status28")}</TableHead>
          <TableHead className={`${headCls} text-right`}>{t("Amallar")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => (
          <VendorRow
            key={vendor.id}
            vendor={vendor}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </TableBody>
    </Table></div>
  );
}

interface VendorRowProps {
  vendor: Vendor;
  onEditClick: (vendor: Vendor) => void;
  onDeleteClick: (vendor: Vendor) => void;
}

function VendorRow({ vendor, onEditClick, onDeleteClick }: VendorRowProps) {
  const cellCls = "py-3 px-6 text-foreground";

  return (
    <TableRow
      data-testid={`row-vendor-${vendor.id}`}
      className="hover:bg-muted/40 transition-colors border-none"
    >
      <TableCell className={`${cellCls} font-medium`} data-testid={`text-vendor-code-${vendor.id}`}>
        {vendor.vendorCode}
      </TableCell>

      <TableCell className={cellCls} data-testid={`text-vendor-name-${vendor.id}`}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {vendor.name}
        </div>
      </TableCell>

      <TableCell className={cellCls} data-testid={`text-vendor-phone-${vendor.id}`}>
        {vendor.phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {vendor.phone}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className={cellCls} data-testid={`text-vendor-email-${vendor.id}`}>
        {vendor.email ? (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {vendor.email}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className={cellCls} data-testid={`text-vendor-payment-terms-${vendor.id}`}>
        {vendor.paymentTerms || <span className="text-muted-foreground">-</span>}
      </TableCell>

      <TableCell className="py-3 px-6" data-testid={`badge-vendor-status-${vendor.id}`}>
        <Badge
          className={
            vendor.isActive
              ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"
              : "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"
          }
        >
          {vendor.isActive ? "Faol" : "Nofaol"}
        </Badge>
      </TableCell>

      <TableCell className="py-3 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEditClick(vendor)}
            data-testid={`button-edit-vendor-${vendor.id}`}
            className="hover:bg-muted text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDeleteClick(vendor)}
            data-testid={`button-delete-vendor-${vendor.id}`}
            className="hover:bg-red-50 text-[var(--ep-red)]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
