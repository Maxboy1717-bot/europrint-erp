/**
 * @module AssetsTab
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { ArrowRightLeft, Building2, Filter, Plus, Search, ShieldCheck, Trash2, TrendingDown, Wrench } from "lucide-react";
import {
  assetTypeLabels, getAssetStatusBadge, getAssetTypeIcon, getConditionBadge,
} from "@/components/assets/helpers";
import type { AssetInventoryItem } from "@/components/assets/types";

interface AssetsTabProps {
  assets: AssetInventoryItem[];
  assetSummary: { byType: Record<string, { count: number; value: number }> } | null | undefined;
  filteredAssets: AssetInventoryItem[];
  assetsLoading: boolean;
  searchQuery: string; setSearchQuery: (v: string) => void;
  typeFilter: string; setTypeFilter: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
  setIsCreateAssetOpen: (v: boolean) => void;
  handleDepreciateClick: (a: AssetInventoryItem) => void;
  handleMaintenanceClick: (a: AssetInventoryItem) => void;
  handleTransferClick: (a: AssetInventoryItem) => void;
  handleInsuranceClick: (a: AssetInventoryItem) => void;
  handleDisposalClick: (a: AssetInventoryItem) => void;
}

export function AssetsTab({
  assets, assetSummary, filteredAssets, assetsLoading,
  searchQuery, setSearchQuery, typeFilter, setTypeFilter, statusFilter, setStatusFilter,
  setIsCreateAssetOpen, handleDepreciateClick, handleMaintenanceClick,
  handleTransferClick, handleInsuranceClick, handleDisposalClick,
}: AssetsTabProps) {
  const { t } = useTranslation('mro');
  const { t: tCommon } = useTranslation('common');

  return (
    <TabsContent value="assets" className="space-y-4 mt-4">
      {assetSummary?.byType && Object.keys(assetSummary.byType).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(assetSummary.byType).map(([type, data]) => (
            <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeFilter(type)}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  {getAssetTypeIcon(type)}
                  <span className="text-sm font-medium">{t(assetTypeLabels[type] || type)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{data.count} {t("unitCount")}</p>
                <p className="text-xs font-medium">{formatCurrency(data.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1 flex-wrap">
          <div>
            <CardTitle>{t('assetList')}</CardTitle>
            <CardDescription>{t('allAssetsStatus')}</CardDescription>
          </div>
          <Button onClick={() => setIsCreateAssetOpen(true)} data-testid="button-create-asset">
            <Plus className="h-4 w-4 mr-1" />{t('newAsset')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">{tCommon("search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("assetSearchPlaceholder")} className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="input-search-assets" />
              </div>
            </div>
            <div className="w-full sm:w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1 block">{tCommon("type")}</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter" className="h-9"><SelectValue placeholder={tCommon("all")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  {Object.entries(assetTypeLabels).map(([val, key]) => (
                    <SelectItem key={val} value={val}>{t(key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[150px]">
              <Label className="text-xs text-muted-foreground mb-1 block">{tCommon("status")}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter" className="h-9"><SelectValue placeholder={tCommon("all")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon("all")}</SelectItem>
                  <SelectItem value="active">{tCommon("active")}</SelectItem>
                  <SelectItem value="under_repair">{t("underRepair")}</SelectItem>
                  <SelectItem value="disposed">{t("disposed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setSearchQuery(""); }} data-testid="button-clear-filters">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          {assetsLoading ? (
            <div className="space-y-2">{([...Array(5)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("noAssetsFound")}</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/40 transition-colors">
                    <TableHead>{tCommon("code")}</TableHead>
                    <TableHead>{tCommon("name")}</TableHead>
                    <TableHead>{tCommon("type")}</TableHead>
                    <TableHead>{tCommon("status")}</TableHead>
                    <TableHead>{tCommon("condition")}</TableHead>
                    <TableHead className="text-right">{t("cardPurchaseValue")}</TableHead>
                    <TableHead className="text-right">{t("colCurrentValue2")}</TableHead>
                    <TableHead className="text-right">{t("tabDepreciation")}</TableHead>
                    <TableHead>{tCommon("location")}</TableHead>
                    <TableHead className="text-center">{t("colActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(filteredAssets) ? filteredAssets : []).map((asset, index) => (
                    <TableRow key={asset.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"} data-testid={`row-asset-${asset.id}`}>
                      <TableCell className="font-mono text-sm font-medium">{asset.assetCode}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{asset.assetName}</p>
                          {asset.serialNumber && <p className="text-xs text-muted-foreground">S/N: {asset.serialNumber}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getAssetTypeIcon(asset.assetType)}
                          <span className="text-sm">{t(assetTypeLabels[asset.assetType] || asset.assetType)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getAssetStatusBadge(asset.status, t)}</TableCell>
                      <TableCell>{getConditionBadge(asset.condition, t)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(asset.purchaseValue)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(asset.currentValue)}</TableCell>
                      <TableCell className="text-right text-[var(--ep-red)]">-{formatCurrency(asset.accumulatedDepreciation)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{asset.location || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          {asset.status === "active" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDepreciateClick(asset)} title={t("calcDepreciation")} data-testid={`button-depreciate-${asset.id}`}>
                                <TrendingDown className="h-3.5 w-3.5 text-[var(--ep-red)]" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMaintenanceClick(asset)} title={t("addMaintenanceRecord")} data-testid={`button-maintenance-${asset.id}`}>
                                <Wrench className="h-3.5 w-3.5 text-[var(--ep-yellow)]" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTransferClick(asset)} title={t("transferAsset")} data-testid={`button-transfer-${asset.id}`}>
                                <ArrowRightLeft className="h-3.5 w-3.5 text-[var(--ep-blue)]" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleInsuranceClick(asset)} title={t("addInsurance")} data-testid={`button-insurance-${asset.id}`}>
                                <ShieldCheck className="h-3.5 w-3.5 text-[var(--ep-green)]" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDisposalClick(asset)} title={t("disposeAsset")} data-testid={`button-dispose-${asset.id}`}>
                                <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{filteredAssets.length} ta aktiv ko'rsatilmoqda</p>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
