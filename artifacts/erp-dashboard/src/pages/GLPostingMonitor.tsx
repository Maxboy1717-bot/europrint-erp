/**
 * @module GLPostingMonitor
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from '@/lib/i18n';
import { BookOpen, CheckCircle, XCircle, Clock, DollarSign, FileText, ArrowUpDown } from "lucide-react";
import { EPErrorState } from "@/components/ep";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

/**
 * pos_gl_posting_log kolonlariga mos interfeys.
 * Backend NestJS camelCase qaytaradi (snake_case emas).
 */
interface GLPosting {
  id: number;
  movementId: number | null;
  stage: number | null;
  stageName: string | null;
  status: 'AWAITING_REVIEW' | 'POSTED' | 'REJECTED' | 'PROCESSING' | string;
  glEntries: Record<string, unknown>[] | null;
  aiConfidence: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  errorMessage: string | null;
  processedAt: string | null;
}

export default function GLPostingMonitor() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  /** AWAITING_REVIEW yozuvlar — /api/pos/gl/pending */
  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError,
    error,
    refetch,
  } = useQuery<GLPosting[]>({
    queryKey: ['/api/pos/gl/pending'],
  });

  /** Tasdiqlangan (POSTED) yozuvlar — /api/pos/gl/journal */
  const { data: journalData, isLoading: journalLoading } = useQuery<GLPosting[]>({
    queryKey: ['/api/pos/gl/journal'],
  });

  /** Approve mutation — POST /api/pos/gl/entry/:id/approve */
  const approveMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/pos/gl/entry/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pos/gl/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pos/gl/journal'] });
      toast({ title: t('muvaffaqiyatliTasdiqlandi') || 'Tasdiqlandi' });
    },
    onError: () => {
      toast({ title: t('xatolik') || 'Xatolik', variant: 'destructive' });
    },
  });

  /** Reject mutation — POST /api/pos/gl/entry/:id/reject */
  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/pos/gl/entry/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pos/gl/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pos/gl/journal'] });
      toast({ title: t('radEtildi') || 'Rad etildi' });
    },
    onError: () => {
      toast({ title: t('xatolik') || 'Xatolik', variant: 'destructive' });
    },
  });

  const pending = Array.isArray(pendingData) ? pendingData : [];
  const journal = Array.isArray(journalData) ? journalData : [];

  /** Barcha yozuvlar (pending + journal) birlashtiriladi — statusFilter uchun */
  const allPostings: GLPosting[] = [...pending, ...journal];

  const filtered = statusFilter === 'all'
    ? allPostings
    : allPostings.filter(p => p.status === statusFilter.toUpperCase());

  const totalPosted = journal.length;
  const totalPending = pending.length;
  const totalRejected = allPostings.filter((p) => p.status === 'REJECTED').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'POSTED':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />{t("joylangan") || 'Joylangan'}
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />{t("radEtildi") || 'Rad etildi'}
          </Badge>
        );
      case 'AWAITING_REVIEW':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />{t("Kutilmoqda") || 'Kutilmoqda'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />{status}
          </Badge>
        );
    }
  };

  if (isError) {
    return <EPErrorState onRetry={refetch} error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="page-gl-posting-monitor">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {t("omborMoliyaGlPosting") || 'GL Posting Monitor'}
          </h1>
          <p className="text-muted-foreground">
            {t("avtomatikBuxgalteriyaYozuvlariMonitoring") || 'Avtomatik buxgalteriya yozuvlari monitoring'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetch(); }}>
          {t("refresh") || 'Yangilash'}
        </Button>
      </div>

      {/* Statistika kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card data-testid="card-stat-posted">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
                <CheckCircle className="w-5 h-5 text-[var(--ep-green)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("joylangan") || 'Joylangan'}</p>
                <p className="text-2xl font-bold">{journalLoading ? '...' : totalPosted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-pending">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900">
                <Clock className="w-5 h-5 text-[var(--ep-yellow)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Kutilmoqda") || 'Kutilmoqda'}</p>
                <p className="text-2xl font-bold">{pendingLoading ? '...' : totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-rejected">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-100 dark:bg-red-900">
                <XCircle className="w-5 h-5 text-[var(--ep-red)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("radEtilgan") || 'Rad etilgan'}</p>
                <p className="text-2xl font-bold">{totalRejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jadval */}
      <Card data-testid="card-postings-table">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-[14px] font-semibold">
            <FileText className="w-4 h-4 inline mr-2" />
            {t("glPostinglar") || 'GL Posting yozuvlar'}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-9" data-testid="select-status-filter">
                <SelectValue placeholder={t("status28") || 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Barchasi") || 'Barchasi'}</SelectItem>
                <SelectItem value="awaiting_review">{t("Kutilmoqda") || 'Kutilmoqda'}</SelectItem>
                <SelectItem value="posted">{t("joylangan") || 'Joylangan'}</SelectItem>
                <SelectItem value="rejected">{t("radEtilgan") || 'Rad etilgan'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {(pendingLoading || journalLoading) ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {t("Yuklanmoqda...") || 'Yuklanmoqda...'}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowUpDown className="w-12 h-12 mb-3 opacity-30" />
              <p>{t("haliGlPostingMavjudEmas") || 'Hali GL posting mavjud emas'}</p>
              <p className="text-sm">
                {t("omborOperatsiyalariAmalgaOshirilgandaAvtomatik") || 'Ombor operatsiyalari bajarilganda avtomatik yaratiladi'}
              </p>
            </div>
          ) : (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{t("harakatId") || 'Harakat ID'}</TableHead>
                    <TableHead>{t("bosqich") || 'Bosqich'}</TableHead>
                    <TableHead>{t("aiIshonch") || 'AI ishonch'}</TableHead>
                    <TableHead>{t("status28") || 'Status'}</TableHead>
                    <TableHead>{t("date") || 'Sana'}</TableHead>
                    <TableHead>{t("amallar") || 'Amallar'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      data-testid={`row-posting-${p.id}`}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="font-mono text-sm">{p.id}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {p.movementId ?? '-'}
                      </TableCell>
                      <TableCell>
                        {p.stageName ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {p.stageName}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {p.aiConfidence != null
                          ? `${(parseFloat(p.aiConfidence) * 100).toFixed(0)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.processedAt
                          ? new Date(p.processedAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {p.status === 'AWAITING_REVIEW' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              data-testid={`btn-approve-${p.id}`}
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate(p.id)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t("tasdiqlash") || 'Tasdiqlash'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              data-testid={`btn-reject-${p.id}`}
                              disabled={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate(p.id)}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              {t("radEtish") || 'Rad etish'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {p.approvedBy
                              ? `${t("tasdiqlagan") || 'Tasdiqlagan'}: #${p.approvedBy}`
                              : '-'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GL Entries detail card (agar AWAITING_REVIEW bo'lsa, gl_entries ko'rsatish) */}
      {pending.some((p) => Array.isArray(p.glEntries) && p.glEntries.length > 0) && (
        <Card data-testid="card-gl-entries-detail">
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-semibold">
              <BookOpen className="w-4 h-4 inline mr-2" />
              {t("glYozuvlarTafsiloti") || 'GL yozuvlar tafsiloti (AWAITING_REVIEW)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pending
                .filter((p) => Array.isArray(p.glEntries) && p.glEntries.length > 0)
                .map((p) => (
                  <div key={p.id} className="p-3 rounded-md border">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground">
                      {t("harakatId") || 'Harakat'} #{p.movementId} — {p.stageName}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(p.glEntries as Record<string, unknown>[]).map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs font-mono"
                        >
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span>
                            DR:{String(entry.accountCode ?? entry.debitAccountCode ?? '-')} /
                            CR:{String(entry.creditAccountCode ?? '-')}
                            {entry.debit != null && ` | ${Number(entry.debit).toLocaleString()} UZS`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
