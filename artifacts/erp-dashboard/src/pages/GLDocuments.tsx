import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText,
  Download,
  ArrowUpDown,
  Calendar,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

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


function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Qoralama</Badge>;
    case "posted":
      return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Tasdiqlangan</Badge>;
    case "reversed":
      return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Bekor qilingan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function GLDocuments() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortField, setSortField] = useState<string>("documentDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const { data: documents = [], isLoading, refetch, isError} = useQuery<GLDocument[]>({
    queryKey: ["/api/accounting/gl-documents", { status: statusFilter, startDate, endDate }],
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
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
      <div className="flex-1 overflow-auto bg-surface p-6" data-testid="gl-documents-loading">
        <h1 className="text-4xl font-light tracking-tight text-on-surface mb-8">
          GL <span className="font-bold text-primary">Hujjatlar</span>
        </h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="gl-documents-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            GL <span className="font-bold text-primary">Hujjatlar</span>
          </h1>
          <p className="text-muted-foreground mt-1">Bosh jurnal yozuvlari va hujjatlar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yangilash
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              const rows = documents?.map(d => [d.documentNumber, d.documentDate, d.documentType, d.description, d.status, d.totalDebit, d.totalCredit].join(",")) || [];
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
            Excel
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-filters">
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filterlar
            </h3>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="draft">Qoralama</SelectItem>
                  <SelectItem value="posted">Tasdiqlangan</SelectItem>
                  <SelectItem value="reversed">Bekor qilingan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Boshlanish sanasi</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Tugash sanasi</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[180px]"
                data-testid="input-end-date"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              Tozalash
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-total-documents">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami hujjatlar</p>
            <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-total-documents">{documents.length}</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-total-debit">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami Debet</p>
            <p className="text-4xl font-bold tracking-tight text-primary mt-1" data-testid="text-total-debit">
              {formatCurrency(totalDebit)}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-total-credit">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami Kredit</p>
            <p className="text-4xl font-bold tracking-tight text-error mt-1" data-testid="text-total-credit">
              {formatCurrency(totalCredit)}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-documents-table">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              GL Hujjatlar ro'yxati
            </h3>
          </div>
          {sortedDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Hujjatlar topilmadi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("documentNumber")}
                      data-testid="th-id"
                    >
                      <div className="flex items-center gap-1">
                        ID
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("documentDate")}
                      data-testid="th-date"
                    >
                      <div className="flex items-center gap-1">
                        Sana
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6" data-testid="th-description">Tavsif</TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("totalDebit")}
                      data-testid="th-debit"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Debet
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("totalCredit")}
                      data-testid="th-credit"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Kredit
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6" data-testid="th-status">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(sortedDocuments) ? sortedDocuments : []).map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-surface-container-low transition-colors" data-testid={`row-document-${doc.id}`}>
                      <TableCell className="font-medium py-3 px-6">{doc.documentNumber}</TableCell>
                      <TableCell className="py-3 px-6">{formatDate(doc.documentDate)}</TableCell>
                      <TableCell className="max-w-[300px] truncate py-3 px-6">{doc.description || "-"}</TableCell>
                      <TableCell className="text-right text-primary font-semibold py-3 px-6">{formatCurrency(doc.totalDebit)}</TableCell>
                      <TableCell className="text-right text-error font-semibold py-3 px-6">{formatCurrency(doc.totalCredit)}</TableCell>
                      <TableCell className="py-3 px-6">{getStatusBadge(doc.status)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-surface-container-low font-bold">
                    <TableCell colSpan={3} className="py-3 px-6">JAMI</TableCell>
                    <TableCell className="text-right text-primary py-3 px-6">{formatCurrency(totalDebit)}</TableCell>
                    <TableCell className="text-right text-error py-3 px-6">{formatCurrency(totalCredit)}</TableCell>
                    <TableCell className="py-3 px-6"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
