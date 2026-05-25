/**
 * @module CameraMachinesHistoryTable
 * @description Status history table card for CameraMachines.
 * Extracted from camera-machines.tsx (Rule 16).
 */

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabels, stopReasonLabels, type MachineStatusLog } from "./CameraMachinesData";

interface CameraMachinesHistoryTableProps {
  safeLogs: MachineStatusLog[];
  language: "uz" | "ru";
}

const LABELS = {
  uz: { statusHistory: "Holat tarixi", machine: "Mashina", status: "Holat", duration: "Davomiylik", reason: "Sabab", lastUpdate: "Oxirgi yangilanish", minutes: "daqiqa", empty: "Tarix topilmadi" },
  ru: { statusHistory: "История статусов", machine: "Машина", status: "Статус", duration: "Длительность", reason: "Причина", lastUpdate: "Последнее обновление", minutes: "минут", empty: "История не найдена" },
};

export function CameraMachinesHistoryTable({ safeLogs, language }: CameraMachinesHistoryTableProps) {
  const l = LABELS[language];

  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-status-history">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5 text-primary" />
          {l.statusHistory}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="ep-table-scroll">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{l.machine}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{l.status}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{l.duration}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{l.reason}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{l.lastUpdate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeLogs.length > 0 ? (
                  safeLogs.slice(0, 20).map((log) => {
                    const statusInfo = statusLabels[log.status] ?? statusLabels.unknown;
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/40 transition-colors border-none" data-testid={`row-log-${log.id}`}>
                        <TableCell className="py-4 px-6 font-bold text-foreground">{log.workCenterId.slice(0, 8)}...</TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${statusInfo.color} border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {language === "uz" ? statusInfo.uz : statusInfo.ru}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">
                          {log.durationMinutes ? `${log.durationMinutes} ${l.minutes}` : "—"}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {log.stopReason ? (
                            <span className="text-sm font-medium text-[var(--ep-red)]">
                              {stopReasonLabels[log.stopReason]?.[language] ?? log.stopReason}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-[13px] text-muted-foreground">
                      <Clock className="h-16 w-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">{l.empty}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
