/**
 * @module GLDocuments
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Download, ArrowUpDown, Calendar, Filter, RefreshCw, AlertCircle, Plus } from "lucide-react";
import { EPErrorState, EPPageHeader, EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

interface GLDocument {
  id: string;
  documentNumber: string;
  documentDate: string;
  documentType: string;
  description: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

interface CreateDocumentForm {
  date: string;
  description: string;
  totalAmount: number;
}

function getStatusBadge(status: string, t: ReturnType<typeof useTranslation>["t"]) {
  switch (status) {
    case "draft":
      return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{t("draft")}</Badge>;
    case "posted":
      return <EPStatusPill tone="success">{t("approved")}</EPStatusPill>;
    case "reversed":
      return <EPStatusPill tone="danger">{t("cancelledDesc")}</EPStatusPill>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function GLDocuments() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortField, setSortField] = useState<string>("documentDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateDocumentForm>({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    totalAmount: 0,
  });

  const queryParams = new URLSearchParams();
  if (statusFilter && statusFilter !== "all") {
    queryParams.append("status", statusFilter);
  }
  if (startDate) {
    queryParams.append("startDate", startDate);
  }
  if (endDate) {
    queryParams.append("endDate", endDate);
  }

  const { data: documents = [], isLoading, refetch, isError, error} = useQuery<GLDocument[]>({
    queryKey: ["/api/accounting/gl-documents", { status: statusFilter, startDate, endDate }],
  });

  const createMutation = useMutation({
    mutationFn: (body: { documentDate: string; description: string; lines: { accountCode: string; debit: number; credit: number }[] }) =>
      apiRequest("POST", "/api/fi/gl-documents", body),
    onSuccess: () => {
      toast({ title: "Hujjat yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/gl-documents"] });
      setCreateOpen(false);
      setForm({ date: new Date().toISOString().slice(0, 10), description: "", totalAmount: 0 });
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const postDocMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/fi/gl-documents/${id}/post`, {}),
    onSuccess: () => {
      toast({ title: "Hujjat joylashtirildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/gl-documents"] });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const handleCreateSubmit = () => {
    createMutation.mutate({
      documentDate: form.date,
      description: form.description,
      lines: [
        { accountCode: "1000", debit: form.totalAmount, credit: 0 },
      ],
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedDocuments = [...(Array.isArray(documents) ? documents : [])].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";

    switch (sortField) {
      case "documentDate":
        aValue = new Date(a.documentDate).getTime();
        bValue = new Date(b.documentDate).getTime();
        break;
      case "totalDebit":
        aValue = a.totalDebit;
        bValue = b.totalDebit;
        break;
      case "totalCredit":
        aValue = a.totalCredit;
        bValue = b.totalCredit;
        break;
      case "documentNumber":
        aValue = a.documentNumber;
        bValue = b.documentNumber;
        break;
      default:
        aValue = a.documentDate;
        bValue = b.documentDate;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
  });

  const totalDebit = (Array.isArray(documents) ? documents : []).reduce((sum, doc) => sum + (doc.totalDebit || 0), 0);
  const totalCredit = (Array.isArray(documents) ? documents : []).reduce((sum, doc) => sum + (doc.totalCredit || 0), 0);

  const clearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="gl-documents-loading">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("glHujjatlar")}</b></>}
        title={t("glHujjatlar")}
      />
        <div className="flex items-center justify-center h-64">
          <EPLoader size={32} tone="muted" />
        </div>
      </div>
    );
  }


  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="space-y-6" data-testid="gl-documents-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("glHujjatlar")}</b></>}
        title={t("glHujjatlar")}
      />
          <p className="text-muted-foreground mt-1">{t("boshJurnalYozuvlariVaHujjatlar")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateOpen(true)}
            data-testid="button-create-document"
          >
            <Plus className="h-4 w-4 mr-2" />
            Hujjat yaratish
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("refresh")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const rows = (Array.isArray(documents) ? documents : []).map(d => [d.documentNumber, d.documentDate, d.documentType, d.description, d.status, d.totalDebit, d.totalCredit].join(","));
              const csv = ["Document Number,Date,Type,Description,Status,Debit,Credit", ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "gl-documents.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            {t("excel")}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-xl p-6" data-testid="card-filters">
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("filterlar")}
            </h3>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('status28')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-status-filter">
                  <SelectValue placeholder={t("Barchasi")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Barchasi")}</SelectItem>
                  <SelectItem value="draft">{t("draft")}</SelectItem>
                  <SelectItem value="posted">{t("approved")}</SelectItem>
                  <SelectItem value="reversed">{t("cancelledDesc")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t("startDate")}</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-[180px]"
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t("endDate")}</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-[180px]"
                data-testid="input-end-date"
              />
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              {t("tozalash")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-card rounded-lg p-5" data-testid="card-total-documents">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("jamiHujjatlar")}</p>
            <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-total-documents">{(Array.isArray(documents) ? documents : []).length}</p>
          </div>

          <div className="bg-card rounded-lg p-5" data-testid="card-total-debit">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("jamiDebet")}</p>
            <p className="text-4xl font-bold tracking-tight text-primary mt-1" data-testid="text-total-debit">
              {formatCurrency(totalDebit)}
            </p>
          </div>

          <div className="bg-card rounded-lg p-5" data-testid="card-total-credit">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("jamiKredit")}</p>
            <p className="text-4xl font-bold tracking-tight text-[var(--ep-red)] mt-1" data-testid="text-total-credit">
              {formatCurrency(totalCredit)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-[var(--ep-border)] p-6" data-testid="card-documents-table">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("glHujjatlarRoyxati")}
            </h3>
          </div>
          {sortedDocuments.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              {t("hujjatlarTopilmadi1")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleSort("documentNumber")}
                      data-testid="th-id"
                    >
                      <div className="flex items-center gap-1">
                        ID
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleSort("documentDate")}
                      data-testid="th-date"
                    >
                      <div className="flex items-center gap-1">
                        {t("date")}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-description">{t("progress.description")}</TableHead>
                    <TableHead
                      className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleSort("totalDebit")}
                      data-testid="th-debit"
                    >
                      <div className="flex items-center justify-end gap-1">
                        {t("debet")}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleSort("totalCredit")}
                      data-testid="th-credit"
                    >
                      <div className="flex items-center justify-end gap-1">
                        {t("loan")}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-status">{t('status27')}</TableHead>
                    <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-actions">{t('amallar', "Amallar")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(sortedDocuments) ? sortedDocuments : []).map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-document-${doc.id}`}>
                      <TableCell className="font-medium py-3 px-6">{doc.documentNumber}</TableCell>
                      <TableCell className="py-3 px-6">{formatDate(doc.documentDate)}</TableCell>
                      <TableCell className="max-w-[300px] truncate py-3 px-6">{doc.description || "-"}</TableCell>
                      <TableCell className="text-right text-primary font-semibold py-3 px-6">{formatCurrency(doc.totalDebit)}</TableCell>
                      <TableCell className="text-right text-[var(--ep-red)] font-semibold py-3 px-6">{formatCurrency(doc.totalCredit)}</TableCell>
                      <TableCell className="py-3 px-6">{getStatusBadge(doc.status, t)}</TableCell>
                      <TableCell className="py-3 px-6">
                        {doc.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => postDocMutation.mutate(doc.id)}
                            disabled={postDocMutation.isPending}
                            data-testid={`button-post-doc-${doc.id}`}
                          >
                            {t('joylashtirish', "Joylashtirish")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-bold hover:bg-muted/40 transition-colors">
                    <TableCell colSpan={3} className="py-3 px-6">JAMI</TableCell>
                    <TableCell className="text-right text-primary py-3 px-6">{formatCurrency(totalDebit)}</TableCell>
                    <TableCell className="text-right text-[var(--ep-red)] py-3 px-6">{formatCurrency(totalCredit)}</TableCell>
                    <TableCell className="py-3 px-6"></TableCell>
                    <TableCell className="py-3 px-6"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Create Document Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Hujjat yaratish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-date">{t("date")}</Label>
              <Input
                id="doc-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                data-testid="input-create-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-description">{t("progress.description")}</Label>
              <Input
                id="doc-description"
                placeholder="Hujjat tavsifi..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                data-testid="input-create-description"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-amount">Jami summa</Label>
              <Input
                id="doc-amount"
                type="number"
                min={0}
                placeholder="0"
                value={form.totalAmount === 0 ? "" : form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: Number(e.target.value) || 0 }))}
                data-testid="input-create-amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              {t("tozalash")}
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending || !form.date || !form.description}
              data-testid="button-submit-create-document"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
