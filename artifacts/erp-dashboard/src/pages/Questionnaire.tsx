/**
 * @module Questionnaire
 * @description Anketa sahifasi — barcha anketalar ro'yxati.
 * Route: /questionnaire
 */

import { useQuery } from "@tanstack/react-query";
import { FileQuestion, Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types ────────────────────────────────────────────────────────────────────

interface Questionnaire {
  id: number | string;
  title: string;
  description?: string;
  questions_count: number;
  category?: string;
  status: string;
  created_at: string;
  responses_count?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(
  status: string
): "success" | "neutral" | "info" {
  if (status === "active") return "success";
  if (status === "archived") return "info";
  return "neutral";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "Faol",
    draft: "Qoralama",
    archived: "Arxivlangan",
  };
  return map[status] ?? status;
}

function fmtDate(d: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  loading: boolean;
}

function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        {loading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function LoadingRows({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function QuestionnairePage() {
  const { t } = useTranslation("common");

  const { data: raw, isLoading, isError } = useQuery<Questionnaire[]>({
    queryKey: ["/api/questionnaire"],
    retry: false,
  });

  // Gracefully handle 501 / 404 — treat as empty
  const items: Questionnaire[] = Array.isArray(raw) ? raw : [];

  const total = items.length;
  const activeCount = items.filter((q) => q.status === "active").length;
  const completedCount = items.filter((q) => q.status === "archived").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileQuestion className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Anketa</h1>
            <p className="text-sm text-muted-foreground">
              Xodimlar anketalari va javoblari
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Yangi anketa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jami" value={total} loading={isLoading} />
        <StatCard label="Faol" value={activeCount} loading={isLoading} />
        <StatCard label="Tugallangan" value={completedCount} loading={isLoading} />
      </div>

      {/* Error state */}
      {isError && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Ma'lumotlarni yuklashda xatolik yuz berdi.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Anketa moduli hali ishga tushirilmagan bo'lishi mumkin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isError && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sarlavha</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead className="text-right">Savollar</TableHead>
                <TableHead className="text-right">Javoblar</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Yaratilgan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <LoadingRows cols={6} />}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-14 text-muted-foreground"
                  >
                    <FileQuestion className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    Hozircha anketalar yo'q.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                items.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.title}</TableCell>
                    <TableCell>
                      {q.category ? (
                        <Badge variant="neutral">{q.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {q.questions_count ?? 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {q.responses_count ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(q.status)}>
                        {statusLabel(q.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {fmtDate(q.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
