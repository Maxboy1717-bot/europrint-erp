/**
 * @module AssetInventoryTable
 * @description React UI component.
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { AssetInventoryItem, conditionLabels, assetStatusLabels } from "./types";
import { Layers, Car, Armchair, Laptop, HardDrive } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
interface AssetInventoryTableProps {
  assets: AssetInventoryItem[];
}

export function AssetInventoryTable({assets
}: AssetInventoryTableProps) {
  const { t } = useTranslation('common');
  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case "equipment": return <Layers className="h-4 w-4" />;
      case "vehicle": return <Car className="h-4 w-4" />;
      case "building": return <Building2 className="h-4 w-4" />;
      case "furniture": return <Armchair className="h-4 w-4" />;
      case "it_equipment": return <Laptop className="h-4 w-4" />;
      default: return <HardDrive className="h-4 w-4" />;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "excellent":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">{conditionLabels[condition]}</Badge>;
      case "good":
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">{conditionLabels[condition]}</Badge>;
      case "fair":
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/40">{conditionLabels[condition]}</Badge>;
      case "poor":
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40">{conditionLabels[condition]}</Badge>;
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  const getAssetStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">{assetStatusLabels[status]}</Badge>;
      case "disposed":
        return <Badge variant="outline" className="bg-gray-500/20 text-muted-foreground border-gray-500/40">{assetStatusLabels[status]}</Badge>;
      case "under_repair":
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/40">{assetStatusLabels[status]}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{t("aktivlarMalumotlariTopilmadi")}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="ep-table-scroll"><Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/40 transition-colors">
            <TableHead>{t("code")}</TableHead>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("tur")}</TableHead>
            <TableHead>{t("location")}</TableHead>
            <TableHead className="text-right">{t("xaridQiymati")}</TableHead>
            <TableHead className="text-right">{t("joriyQiymat")}</TableHead>
            <TableHead>{t("status28")}</TableHead>
            <TableHead>{t('status2')}</TableHead>
            <TableHead>{t("oxirgiInventar")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(assets) ? assets : []).map((asset) => (
            <TableRow key={asset.id} className="hover:bg-muted/40 transition-colors">
              <TableCell className="font-medium">{asset.assetCode}</TableCell>
              <TableCell>{asset.assetName}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getAssetTypeIcon(asset.assetType)}
                  <span className="text-xs">{asset.assetType}</span>
                </div>
              </TableCell>
              <TableCell>{asset.location || "-"}</TableCell>
              <TableCell className="text-right">{formatCurrency(asset.purchaseValue)}</TableCell>
              <TableCell className="text-right">{formatCurrency(asset.currentValue)}</TableCell>
              <TableCell>{getConditionBadge(asset.condition)}</TableCell>
              <TableCell>{getAssetStatusBadge(asset.status)}</TableCell>
              <TableCell>{asset.lastInventoryDate ? formatDate(asset.lastInventoryDate) : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></div>
    </div>
  );
}
