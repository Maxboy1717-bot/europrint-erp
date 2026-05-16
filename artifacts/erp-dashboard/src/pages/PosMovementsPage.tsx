/**
 * @module PosMovementsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, ArrowDownToLine, ArrowUpFromLine, RefreshCw, SlidersHorizontal } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface StockMovement {
  id: number;
  date: string;
  type: string;
  productName: string;
  quantity: number;
  warehouseFrom?: string;
  warehouseTo?: string;
  createdBy?: string;
}

interface MovementsResponse {
  data: StockMovement[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 20;

export default function PosMovementsPage() {
  const { t } = useTranslation("common");
  const [page, setPage] = useState(1);
  const [type, setType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (type !== "all") params.set("type", type);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const { data, isLoading } = useQuery<MovementsResponse>({
    queryKey: [`/api/pos/stock/movements?${params.toString()}`],
  });

  const movements: StockMovement[] = Array.isArray(data)
    ? (data as unknown as StockMovement[])
    : (data?.data ?? []);
  const total: number = Array.isArray(data) ? movements.length : (data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleFilterChange = () => {
    setPage(1);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "incoming":
        return <EPStatusPill tone="success">{t("kirim")}</EPStatusPill>;
      case "outgoing":
        return <EPStatusPill tone="danger">{t("chiqim")}</EPStatusPill>;
      case "transfer":
        return <EPStatusPill tone="info">{t("move")}</EPStatusPill>;
      case "adjustment":
        return <Badge className="bg-amber-100 text-amber-800">{t("tuzatish")}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return <ArrowDownToLine className="h-3.5 w-3.5 text-[var(--ep-green)]" />;
      case "outgoing":
        return <ArrowUpFromLine className="h-3.5 w-3.5 text-[var(--ep-red)]" />;
      case "transfer":
        return <RefreshCw className="h-3.5 w-3.5 text-[var(--ep-blue)]" />;
      default:
        return <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--ep-yellow)]" />;
    }
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <h1 className="text-2xl font-bold">{t("posHarakatlarTarixi")}</h1>

      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs mb-1 block">{t("tur")}</Label>
              <Select value={type} onValueChange={(v) => { setType(v); handleFilterChange(); }}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Barchasi")}</SelectItem>
                  <SelectItem value="incoming">{t("kirim")}</SelectItem>
                  <SelectItem value="outgoing">{t("chiqim")}</SelectItem>
                  <SelectItem value="transfer">{t("move")}</SelectItem>
                  <SelectItem value="adjustment">{t("tuzatish")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">{t("startDate")}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
                className="w-40"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">{t("endDate")}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : movements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t("noData")}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("tur")}</TableHead>
                  <TableHead>{t("Mahsulot")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead>{t("ombordan")}</TableHead>
                  <TableHead>{t("omborgacha")}</TableHead>
                  <TableHead>{t("yaratdi")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {m.date ? new Date(m.date).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(m.type)}
                        {getTypeBadge(m.type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{m.productName}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      <span className={
                        m.type === "incoming" ? "text-[var(--ep-green)]" :
                        m.type === "outgoing" ? "text-[var(--ep-red)]" : ""
                      }>
                        {m.type === "outgoing" ? "-" : "+"}{Math.abs(m.quantity).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.warehouseFrom || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.warehouseTo || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.createdBy || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Sahifa {page} / {totalPages}
          {total > 0 && ` · Jami ${total} ta`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            {t("nextBtn")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
