/** @module CoordinationDocsSections @description Tab-content section components for CoordinationPage: PrikazSection (приказ registry) and ProtocolSection (council minutes). Receive data and callbacks as props; own no state or queries. Mirrors CoordinationPageSections (DoklaSection / RaspoSection) structure. */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { FileText, Gavel, Search, PenLine, Ban, Pencil, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { EPLoader } from "@/components/ep";
import { PrikazStatusBadge, ProtocolStatusBadge } from "./CoordinationPageHelpers";
import { shortDate, type Prikaz, type Protocol } from "./CoordinationPageTypes";
import type { UseMutateFunction } from "@tanstack/react-query";

// ─── PrikazSection ─────────────────────────────────────────────────────────
interface PrikazSectionProps {
  prikazes: Prikaz[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  onCreate: () => void;
  onEdit: (p: Prikaz) => void;
  onSign: UseMutateFunction<unknown, unknown, number>;
  onCancel: (p: Prikaz) => void;
}

export function PrikazSection({
  prikazes, loading, search, setSearch, onCreate, onEdit, onSign, onCancel,
}: PrikazSectionProps) {
  const { language } = useTranslation("coordination");
  const isRu = language === "ru";

  const filtered = prikazes.filter(p =>
    !search
    || p.title.toLowerCase().includes(search.toLowerCase())
    || String(p.prikaz_number ?? "").includes(search),
  );

  return (
    <TabsContent value="prikaz" className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder={isRu ? "Поиск по заголовку / номеру..." : "Sarlavha / raqam bo'yicha qidirish..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-prikaz-search"
          />
        </div>
        <Button size="sm" onClick={onCreate} data-testid="btn-open-create-prikaz">
          <FileText className="w-3.5 h-3.5 mr-1.5" />{isRu ? "Новый приказ" : "Yangi приказ"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {loading && (
            <div className="flex justify-center py-8"><EPLoader tone="muted" className="w-5 h-5" /></div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isRu ? "Приказов нет" : "Приказлар yo'q"}
            </p>
          )}
          {!loading && filtered.map(p => {
            const isDraft = p.status === "draft";
            const isSigned = p.status === "signed";
            const isCancelled = p.status === "cancelled";
            return (
              <div key={p.id} className={cn("flex items-start gap-3 p-3.5 hover:bg-muted/30 transition-colors", isCancelled && "bg-red-50/40")} data-testid={`prikaz-row-${p.id}`}>
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--ep-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.prikaz_number != null && (
                      <span className="text-[10px] font-bold text-[var(--ep-primary)] bg-orange-50 px-1.5 py-0.5 rounded">№{p.prikaz_number}</span>
                    )}
                    <span className="text-sm font-medium">{p.title}</span>
                  </div>
                  {p.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.content}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isSigned && p.signed_at
                      ? `${isRu ? "Подписан" : "Imzolandi"}: ${shortDate(p.signed_at)}`
                      : `${isRu ? "Создан" : "Yaratildi"}: ${shortDate(p.created_at)}`}
                  </p>
                  {isCancelled && p.cancel_reason && (
                    <p className="text-[11px] text-[var(--ep-red)] mt-0.5">
                      {isRu ? "Причина отмены" : "Bekor sababi"}: {p.cancel_reason}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <PrikazStatusBadge status={p.status} />
                  <div className="flex gap-1">
                    {isDraft && (
                      <>
                        <button
                          className="text-[10px] text-[var(--ep-blue)] hover:text-blue-800 font-semibold border border-blue-200 rounded px-1.5 py-0.5 flex items-center gap-0.5"
                          onClick={() => onEdit(p)}
                          data-testid={`btn-edit-prikaz-${p.id}`}
                        >
                          <Pencil className="w-2.5 h-2.5" />{isRu ? "Изменить" : "Tahrir"}
                        </button>
                        <button
                          className="text-[10px] text-[var(--ep-green)] hover:text-emerald-800 font-semibold border border-emerald-200 rounded px-1.5 py-0.5 flex items-center gap-0.5"
                          onClick={() => onSign(p.id)}
                          data-testid={`btn-sign-prikaz-${p.id}`}
                        >
                          <PenLine className="w-2.5 h-2.5" />{isRu ? "Подписать" : "Imzolash"}
                        </button>
                      </>
                    )}
                    {!isCancelled && (
                      <button
                        className="text-[10px] text-[var(--ep-red)] hover:text-red-800 font-semibold border border-red-200 rounded px-1.5 py-0.5 flex items-center gap-0.5"
                        onClick={() => onCancel(p)}
                        data-testid={`btn-cancel-prikaz-${p.id}`}
                      >
                        <Ban className="w-2.5 h-2.5" />{isRu ? "Отменить" : "Bekor"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── ProtocolSection ───────────────────────────────────────────────────────
interface ProtocolSectionProps {
  protocols: Protocol[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  onCreate: () => void;
  onEdit: (p: Protocol) => void;
  onSign: UseMutateFunction<unknown, unknown, number>;
  onAmend: (p: Protocol) => void;
}

export function ProtocolSection({
  protocols, loading, search, setSearch, onCreate, onEdit, onSign, onAmend,
}: ProtocolSectionProps) {
  const { language } = useTranslation("coordination");
  const isRu = language === "ru";

  const filtered = protocols.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <TabsContent value="protocols" className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder={isRu ? "Поиск по теме..." : "Mavzu bo'yicha qidirish..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-protocol-search"
          />
        </div>
        <Button size="sm" onClick={onCreate} data-testid="btn-open-create-protocol">
          <Gavel className="w-3.5 h-3.5 mr-1.5" />{isRu ? "Новый протокол" : "Yangi протокол"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {loading && (
            <div className="flex justify-center py-8"><EPLoader tone="muted" className="w-5 h-5" /></div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isRu ? "Протоколов нет" : "Протоколлар yo'q"}
            </p>
          )}
          {!loading && filtered.map(p => {
            const isDraft = p.status === "draft";
            const isSigned = p.status === "signed";
            return (
              <div key={p.id} className="flex items-start gap-3 p-3.5 hover:bg-muted/30 transition-colors" data-testid={`protocol-row-${p.id}`}>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Gavel className="w-3.5 h-3.5 text-[var(--ep-blue)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{p.title}</span>
                    {p.parent_protocol_id != null && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {isRu ? "исправляет" : "tuzatish"} №{p.parent_protocol_id}
                      </span>
                    )}
                  </div>
                  {p.agenda && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.agenda}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isSigned && p.signed_at
                      ? `${isRu ? "Подписан" : "Imzolandi"}: ${shortDate(p.signed_at)}`
                      : `${isRu ? "Создан" : "Yaratildi"}: ${shortDate(p.created_at)}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <ProtocolStatusBadge status={p.status} />
                  <div className="flex gap-1">
                    {isDraft && (
                      <>
                        <button
                          className="text-[10px] text-[var(--ep-blue)] hover:text-blue-800 font-semibold border border-blue-200 rounded px-1.5 py-0.5 flex items-center gap-0.5"
                          onClick={() => onEdit(p)}
                          data-testid={`btn-edit-protocol-${p.id}`}
                        >
                          <Pencil className="w-2.5 h-2.5" />{isRu ? "Изменить" : "Tahrir"}
                        </button>
                        <button
                          className="text-[10px] text-[var(--ep-green)] hover:text-emerald-800 font-semibold border border-emerald-200 rounded px-1.5 py-0.5 flex items-center gap-0.5"
                          onClick={() => onSign(p.id)}
                          data-testid={`btn-sign-protocol-${p.id}`}
                        >
                          <PenLine className="w-2.5 h-2.5" />{isRu ? "Подписать" : "Imzolash"}
                        </button>
                      </>
                    )}
                    {isSigned && (
                      <button
                        className="text-[10px] text-[var(--ep-yellow)] hover:text-amber-800 font-semibold border border-amber-200 rounded px-1.5 py-0.5 flex items-center gap-0.5"
                        onClick={() => onAmend(p)}
                        data-testid={`btn-amend-protocol-${p.id}`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />{isRu ? "Исправить" : "Tuzatish"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
