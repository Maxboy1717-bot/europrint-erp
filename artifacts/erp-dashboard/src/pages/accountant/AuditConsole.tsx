import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  History,
  Clock,
  Search,
  FileText,
  Download,
  Activity,
  RefreshCw,
  Database,
  CheckCircle,
  Trash2,
  Monitor,
  Server,
  Settings,
  Layers,
  MessageSquare,
  Cpu,
  Eye,
  X,
  FileSearch,
  FileCheck,
  Table,
} from "lucide-react";

interface AuditDiffChange {
  field: string;
  old: unknown;
  new: unknown;
}

interface AuditLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  documentNo?: string;
  source: string;
  sourceRef?: string;
  actorUserId?: string;
  actorFullName?: string;
  description?: string;
  diffJson?: AuditDiffChange[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  timestamp?: string;
  ipAddress?: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}

interface AuditConsoleProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export function AuditConsole({ onExportCSV, onExportExcel, onExportPDF }: AuditConsoleProps) {
  const { toast } = useToast();
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    actionType: "",
    entityType: "",
    source: "",
    documentNo: "",
  });

  const { data: auditStats, refetch } = useQuery<{
    totalLogs: number;
    actionStats: { actionType: string; count: number }[];
    entityStats: { entityType: string; count: number }[];
    sourceStats: { source: string; count: number }[];
    recentLogs: AuditLog[];
  }>({
    queryKey: ["/api/europrint-control/audit-stats"],
  });

  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/europrint-control/audit-logs", filters],
  });

  const { data: actionTypes = [] } = useQuery<{ value: string; label: string }[]>({
    queryKey: ["/api/europrint-control/audit-action-types"],
  });

  const { data: sourceTypes = [] } = useQuery<{ value: string; label: string }[]>({
    queryKey: ["/api/europrint-control/audit-source-types"],
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-500";
      case "UPDATE": return "bg-blue-500";
      case "DELETE": return "bg-red-500";
      case "APPROVE": return "bg-emerald-500";
      case "CANCEL": return "bg-orange-500";
      case "LOGIN": return "bg-purple-500";
      case "LOGOUT": return "bg-gray-500";
      case "SETTINGS_CHANGE": return "bg-yellow-500 text-on-surface";
      case "STATUS_CHANGE": return "bg-cyan-500";
      default: return "bg-gray-500";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "UI_PAGE": return <Monitor className="h-4 w-4" />;
      case "API_ENDPOINT": return <Server className="h-4 w-4" />;
      case "SYSTEM_JOB": return <Settings className="h-4 w-4" />;
      case "IMPORT": return <Download className="h-4 w-4" />;
      case "INTEGRATION": return <Layers className="h-4 w-4" />;
      case "TELEGRAM": return <MessageSquare className="h-4 w-4" />;
      case "IOT": return <Cpu className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDiff = (diffJson: AuditDiffChange[] | null | undefined) => {
    if (!diffJson || !Array.isArray(diffJson)) return null;
    return (diffJson ?? []).map((change: AuditDiffChange, index: number) => (
      <div key={`k-${index}`} className="p-2 bg-muted rounded text-xs font-mono">
        <span className="text-muted-foreground">{change.field}: </span>
        <span className="text-red-500 line-through">{JSON.stringify(change.old)}</span>
        <span className="mx-1">→</span>
        <span className="text-green-500">{JSON.stringify(change.new)}</span>
      </div>
    ));
  };

  return (
    <Card className="border-blue-500/30" data-testid="audit-console-section">
      <CardHeader className="bg-blue-500/5 border-b border-blue-500/20">
        <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <History className="h-6 w-6" />
          AUDIT CONSOLE — 100% Qamrovli
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Tizimda har qanday o'zgarish bu yerda ko'rinadi (immutable)
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Jami Loglar</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{auditStats?.totalLogs || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">CREATE</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {auditStats?.actionStats?.find(s => s.actionType === "CREATE")?.count || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">UPDATE</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {auditStats?.actionStats?.find(s => s.actionType === "UPDATE")?.count || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                <span className="font-medium">DELETE</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {auditStats?.actionStats?.find(s => s.actionType === "DELETE")?.count || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="timeline" data-testid="audit-tab-timeline">
              <Clock className="h-4 w-4 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="search" data-testid="audit-tab-search">
              <Search className="h-4 w-4 mr-1" />
              Qidirish
            </TabsTrigger>
            <TabsTrigger value="document" data-testid="audit-tab-document">
              <FileText className="h-4 w-4 mr-1" />
              Hujjat Trace
            </TabsTrigger>
            <TabsTrigger value="export" data-testid="audit-tab-export">
              <Download className="h-4 w-4 mr-1" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                So'nggi o'zgarishlar
              </h3>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => { refetch(); toast({ title: "Yangilandi", description: "Ma'lumotlar muvaffaqiyatli yangilandi" }); }} data-testid="button-refresh-audit">
                <RefreshCw className="h-4 w-4" />
                Yangilash
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Yuklanmoqda...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Hozircha audit yozuvlar yo'q</p>
                  <p className="text-sm mt-2">Tizimda biror o'zgarish qilganingizda bu yerda ko'rinadi</p>
                </div>
              ) : (
                (Array.isArray(auditLogs) ? auditLogs : []).map((log: AuditLog) => (
                  <div
                    key={log.id}
                    className="p-3 border rounded-lg hover-elevate cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                    data-testid={`audit-log-${log.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {getSourceIcon(log.source)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getActionBadgeColor(log.actionType)}>
                              {log.actionType}
                            </Badge>
                            <span className="font-medium">{log.entityType}</span>
                            {log.documentNo && (
                              <Badge variant="outline">{log.documentNo}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.actorFullName || log.actorUserId || "Tizim"} • {log.sourceRef}
                          </p>
                          {log.description && (
                            <p className="text-sm mt-1">{log.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground shrink-0">
                        <p>{log.timestamp && new Date(log.timestamp).toLocaleDateString("uz-UZ")}</p>
                        <p>{log.timestamp && new Date(log.timestamp).toLocaleTimeString("uz-UZ")}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Action turi</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={filters.actionType}
                  onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                >
                  <option value="">Barchasi</option>
                  {(Array.isArray(actionTypes) ? actionTypes : []).map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Source</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                >
                  <option value="">Barchasi</option>
                  {(Array.isArray(sourceTypes) ? sourceTypes : []).map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Entity turi</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md bg-background"
                  placeholder="users, products..."
                  value={filters.entityType}
                  onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hujjat raqami</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md bg-background"
                  placeholder="SO-0001..."
                  value={filters.documentNo}
                  onChange={(e) => setFilters({ ...filters, documentNo: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={() => setFilters({ actionType: "", entityType: "", source: "", documentNo: "" })}
              variant="outline"
              size="sm"
            >
              Filtrlarni tozalash
            </Button>
          </TabsContent>

          <TabsContent value="document" className="space-y-4">
            <div className="p-6 bg-muted rounded-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                Hujjat Trace
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Hujjat raqamini kiriting va unga bog'liq barcha o'zgarishlarni ko'ring
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md bg-background"
                  placeholder="Hujjat raqami (masalan: SO-0001, INV-0001)"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                />
                <Button className="gap-2" onClick={() => { if (docSearchQuery.trim()) { toast({ title: "Qidirilmoqda", description: `"${docSearchQuery}" bo'yicha qidiruv boshlandi` }); } }} data-testid="button-doc-search">
                  <Search className="h-4 w-4" />
                  Qidirish
                </Button>
              </div>
              <div className="mt-4 p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground text-center">
                  Hujjat raqamini kiritib qidiring. Natijada hujjat zanjiri ko'rsatiladi:
                  <br />
                  <span className="text-emerald-500">Order → Invoice → Payment → ...</span>
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <h3 className="font-bold mb-2">CSV Export</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Audit loglarni CSV formatda yuklash
                  </p>
                  <Button variant="outline" className="w-full gap-2" onClick={onExportCSV} data-testid="button-export-csv">
                    <Download className="h-4 w-4" />
                    Yuklash
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Table className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="font-bold mb-2">Excel Export</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Audit loglarni Excel formatda yuklash
                  </p>
                  <Button variant="outline" className="w-full gap-2" onClick={onExportExcel} data-testid="button-export-excel">
                    <Download className="h-4 w-4" />
                    Yuklash
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="p-6 text-center">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="font-bold mb-2">PDF Hisobot</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Auditor uchun PDF hisobot
                  </p>
                  <Button variant="outline" className="w-full gap-2" onClick={onExportPDF} data-testid="button-export-pdf">
                    <Download className="h-4 w-4" />
                    Yuklash
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Audit Yozuv Tafsilotlari
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLog(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Action:</span>
                    <Badge className={`ml-2 ${getActionBadgeColor(selectedLog.actionType)}`}>
                      {selectedLog.actionType}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entity:</span>
                    <span className="ml-2 font-medium">{selectedLog.entityType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kim:</span>
                    <span className="ml-2">{selectedLog.actorFullName || selectedLog.actorUserId || "Tizim"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Qachon:</span>
                    <span className="ml-2">{selectedLog.timestamp && new Date(selectedLog.timestamp).toLocaleString("uz-UZ")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source:</span>
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
                    <div className="space-y-1">
                      {formatDiff(selectedLog.diffJson)}
                    </div>
                  </div>
                )}

                {!!selectedLog.beforeJson && (
                  <div>
                    <h4 className="font-medium mb-2">Oldingi holat:</h4>
                    <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.beforeJson, null, 2)}
                    </pre>
                  </div>
                )}

                {!!selectedLog.afterJson && (
                  <div>
                    <h4 className="font-medium mb-2">Yangi holat:</h4>
                    <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.afterJson, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
