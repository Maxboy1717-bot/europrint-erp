/**
 * @module AuditConsoleDialogs
 * @description Detail-view dialog for a selected AuditLog entry.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, X } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  type AuditLog,
  getActionBadgeColor,
  getSourceIcon,
  formatDiff,
} from "./AuditConsoleTypes";

interface AuditLogDetailDialogProps {
  selectedLog: AuditLog | null;
  onClose: () => void;
}

export function AuditLogDetailDialog({ selectedLog, onClose }: AuditLogDetailDialogProps) {
  const { t } = useTranslation("common");
  if (!selectedLog) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t("auditYozuvTafsilotlari")}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("action1")}</span>
              <Badge className={`ml-2 ${getActionBadgeColor(selectedLog.actionType)}`}>
                {selectedLog.actionType}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">{t("entity")}</span>
              <span className="ml-2 font-medium">{selectedLog.entityType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("kim")}</span>
              <span className="ml-2">
                {selectedLog.actorFullName || selectedLog.actorUserId || "Tizim"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("qachon")}</span>
              <span className="ml-2">
                {selectedLog.timestamp &&
                  new Date(selectedLog.timestamp).toLocaleString("uz-UZ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("source")}</span>
              <span className="ml-2 flex items-center gap-1">
                {getSourceIcon(selectedLog.source)} {selectedLog.source}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">IP:</span>
              <span className="ml-2">{selectedLog.ipAddress || "-"}</span>
            </div>
          </div>

          {selectedLog.diffJson && (
            <div>
              <h4 className="font-medium mb-2">O'zgarishlar (Diff):</h4>
              <div className="space-y-1">{formatDiff(selectedLog.diffJson)}</div>
            </div>
          )}

          {!!selectedLog.beforeJson && (
            <div>
              <h4 className="font-medium mb-2">{t("oldingiHolat")}</h4>
              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                {JSON.stringify(selectedLog.beforeJson, null, 2)}
              </pre>
            </div>
          )}

          {!!selectedLog.afterJson && (
            <div>
              <h4 className="font-medium mb-2">{t("yangiHolat")}</h4>
              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                {JSON.stringify(selectedLog.afterJson, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
