import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Package, Archive, AlertTriangle } from "lucide-react";
import { MaterialBatchData, Translations } from "./types";

interface BatchesTabProps {
  t: Translations;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: string;
  setTypeFilter: (f: string) => void;
  statusFilter: string;
  setStatusFilter: (f: string) => void;
  materialTypes: string[];
  setIsAddBatchOpen: (open: boolean) => void;
  filteredBatches: MaterialBatchData[];
  isLoading: boolean;
  STATUS_COLORS: Record<string, string>;
  GRADE_COLORS: Record<string, string>;
}

export function BatchesTab({
  t,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  materialTypes,
  setIsAddBatchOpen,
  filteredBatches,
  isLoading,
  STATUS_COLORS,
  GRADE_COLORS,
}: BatchesTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5" />
          {t.batches.title}
        </CardTitle>
        <Button size="sm" onClick={() => setIsAddBatchOpen(true)} className="gap-2" data-testid="button-add-batch">
          <Plus className="w-4 h-4" />
          {t.batches.addBatch}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-batches"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
                <SelectValue placeholder={t.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                {(Array.isArray(materialTypes) ? materialTypes : []).map((mt) => (
                  <SelectItem key={mt} value={mt}>
                    {mt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder={t.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="available">{t.statuses.available}</SelectItem>
                <SelectItem value="depleted">{t.statuses.depleted}</SelectItem>
                <SelectItem value="expired">{t.statuses.expired}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <div key={`k-${i}`} className="h-12 w-full bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[500px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.batches.batchNum}</TableHead>
                  <TableHead>{t.batches.material}</TableHead>
                  <TableHead>{t.batches.total}</TableHead>
                  <TableHead>{t.batches.available}</TableHead>
                  <TableHead>{t.batches.expiry}</TableHead>
                  <TableHead>{t.batches.location}</TableHead>
                  <TableHead>{t.batches.status}</TableHead>
                  <TableHead className="text-right">{t.batches.grade}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(filteredBatches) ? filteredBatches : []).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.batchNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{b.materialName}</span>
                        <span className="text-xs text-muted-foreground">{b.materialType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.quantity} {b.unit}
                    </TableCell>
                    <TableCell className="font-bold">
                      {b.availableQuantity} {b.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "-"}
                        {b.expiryDate && new Date(b.expiryDate) < new Date() && (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{b.location || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[b.status] || ""}>
                        {t.statuses[b.status as keyof typeof t.statuses] || b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={GRADE_COLORS[b.qualityGrade || "A"]}>
                        {b.qualityGrade}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Archive className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">{t.batches.noBatches}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
