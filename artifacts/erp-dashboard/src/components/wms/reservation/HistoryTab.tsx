/**
 * @module HistoryTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  History, Eye, Clock, Ban, CheckCircle, XCircle,
} from "lucide-react";
import { ReservationRequestData, Translations } from "./types";

interface HistoryTabProps {
  t: Translations;
  requests: ReservationRequestData[];
  isLoading: boolean;
  STATUS_COLORS: Record<string, string>;
  confirmMutation: (id: string) => void;
  confirmPending: boolean;
  cancelMutation: (id: string) => void;
  cancelPending: boolean;
  onViewRequest?: (id: string) => void;
}

export function HistoryTab({
  t,
  requests,
  isLoading,
  STATUS_COLORS,
  confirmMutation,
  confirmPending,
  cancelMutation,
  cancelPending,
  onViewRequest,
}: HistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          {t.history.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <div key={`k-${i}`} className="h-12 w-full bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[500px] border rounded-md">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t.history.id}</TableHead>
                  <TableHead>{t.history.type}</TableHead>
                  <TableHead>{t.history.qty}</TableHead>
                  <TableHead>{t.history.reserved}</TableHead>
                  <TableHead>{t.history.confidence}</TableHead>
                  <TableHead>{t.history.status}</TableHead>
                  <TableHead>{t.history.date}</TableHead>
                  <TableHead className="text-right">{t.history.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(requests) ? requests : []).map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-[10px] uppercase truncate max-w-[80px]">
                      {req.id.split("-")[0]}
                    </TableCell>
                    <TableCell className="font-medium">{req.materialType}</TableCell>
                    <TableCell>
                      {req.requiredQuantity} {req.unit}
                    </TableCell>
                    <TableCell className="font-bold text-[var(--ep-blue)] dark:text-blue-400">
                      {req.totalReserved || 0} {req.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] px-1">
                          {req.aiConfidence || 0}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[req.status] || ""}>
                        {t.statuses[req.status as keyof typeof t.statuses] || req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewRequest?.(req.id)} data-testid={`button-view-req-${req.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {req.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => confirmMutation(req.id)}
                            disabled={confirmPending}
                            data-testid={`button-confirm-req-${req.id}`}
                          >
                            <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" />
                          </Button>
                        )}
                        {(req.status === "pending" || req.status === "reserved" || req.status === "partial") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => cancelMutation(req.id)}
                            disabled={cancelPending}
                            data-testid={`button-cancel-req-${req.id}`}
                          >
                            <XCircle className="w-4 h-4 text-[var(--ep-red)]" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">{t.history.noRequests}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
