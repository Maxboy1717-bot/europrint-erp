/**
 * @module WarehouseMaterialKitsSections
 * @description Section components for WarehouseMaterialKits page.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Barcode, CheckCircle, Clock, Truck, RefreshCw, Search } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { MaterialKit, PapkaOrder } from "./WarehouseMaterialKitsTypes";
import { STATUS_BADGES } from "./WarehouseMaterialKitsTypes";

interface SummaryCardsProps {
  kits: MaterialKit[];
  t: (uz: string, ru: string) => string;
}

export function SummaryCards({ kits, t }: SummaryCardsProps) {
  const safeKits = Array.isArray(kits) ? kits : [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card data-testid="card-pending-count">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--ep-yellow)]" />{t("Kutilmoqda", "Ожидает")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{safeKits.filter(k => k.status === "pending").length}</p>
        </CardContent>
      </Card>
      <Card data-testid="card-preparing-count">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-[var(--ep-blue)]" />{t("Tayyorlanmoqda", "Готовится")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{safeKits.filter(k => k.status === "preparing").length}</p>
        </CardContent>
      </Card>
      <Card data-testid="card-ready-count">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />{t("Tayyor", "Готов")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{safeKits.filter(k => k.status === "ready").length}</p>
        </CardContent>
      </Card>
      <Card data-testid="card-delivered-count">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Truck className="h-4 w-4 text-[var(--ep-purple)]" />{t("Yetkazildi", "Доставлен")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{safeKits.filter(k => k.status === "delivered").length}</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface KitsTableProps {
  kits: MaterialKit[];
  filteredKits: MaterialKit[];
  kitsLoading: boolean;
  selectedTab: string;
  setSelectedTab: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  lang: "uz" | "ru";
  onPrepare: (kitId: number) => void;
  onMarkReady: (kitId: number) => void;
  onOpenDetails: (kit: MaterialKit) => void;
  preparePending: boolean;
  markReadyPending: boolean;
  t: (uz: string, ru: string) => string;
}

export function KitsTable({
  filteredKits, kitsLoading, selectedTab, setSelectedTab,
  searchQuery, setSearchQuery, lang, onPrepare, onMarkReady, onOpenDetails,
  preparePending, markReadyPending, t,
}: KitsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="pending" data-testid="tab-pending">{t("Kutilmoqda", "Ожидает")}</TabsTrigger>
              <TabsTrigger value="preparing" data-testid="tab-preparing">{t("Tayyorlanmoqda", "Готовится")}</TabsTrigger>
              <TabsTrigger value="ready" data-testid="tab-ready">{t("Tayyor", "Готов")}</TabsTrigger>
              <TabsTrigger value="delivered" data-testid="tab-delivered">{t("Yetkazildi", "Доставлен")}</TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">{t("Barchasi", "Все")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Qidirish...", "Поиск...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {kitsLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredKits.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("To'plamlar topilmadi", "Комплекты не найдены")}</p>
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("To'plam raqami", "Номер комплекта")}</TableHead>
                <TableHead>{t("Buyurtma", "Заказ")}</TableHead>
                <TableHead>{t("Mahsulot", "Продукция")}</TableHead>
                <TableHead>{t("Tiraj", "Тираж")}</TableHead>
                <TableHead>{t("Holat", "Статус")}</TableHead>
                <TableHead>{t("Yaratilgan", "Создан")}</TableHead>
                <TableHead className="text-right">{t("Amallar", "Действия")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(filteredKits) ? filteredKits : []).map(kit => {
                const statusInfo = STATUS_BADGES[kit.status] || STATUS_BADGES.pending;
                return (
                  <TableRow key={kit.id} data-testid={`kit-row-${kit.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{kit.kitNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{kit.order?.papkaNo || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{kit.order?.naimenovanie || "-"}</TableCell>
                    <TableCell>{kit.order?.tiraj?.toLocaleString() || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {lang === "uz" ? statusInfo.label : statusInfo.labelRu}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(kit.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {kit.status === "pending" && (
                          <Button size="sm" onClick={() => onPrepare(kit.id)} disabled={preparePending} data-testid={`button-prepare-${kit.id}`}>
                            {t("Tayyorlash", "Готовить")}
                          </Button>
                        )}
                        {kit.status === "preparing" && (
                          <Button size="sm" onClick={() => onMarkReady(kit.id)} disabled={markReadyPending} data-testid={`button-ready-${kit.id}`}>
                            <CheckCircle className="h-4 w-4 mr-1" />{t("Tayyor", "Готов")}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => onOpenDetails(kit)} data-testid={`button-details-${kit.id}`}>
                          {t("Batafsil", "Подробнее")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
