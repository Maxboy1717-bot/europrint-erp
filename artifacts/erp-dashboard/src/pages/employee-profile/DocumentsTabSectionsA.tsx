/**
 * @module DocumentsTabSectionsA
 * @description FileIcon helper, KPICards, and EmployeeDocsSection.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ScrollText, FileText, FileCheck, Clock, CheckCircle2, FolderOpen,
  Download, Trash2, File, Image, FileType2, Plus,
} from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  type EmploymentContract, type EmployeeDocument,
  EMP_DOC_CATEGORIES,
} from "./DocumentsTabTypes";

// ─── FileIcon ─────────────────────────────────────────────────────────────────

export function FileIcon({ mimeType }: { mimeType?: string }) {
  const { t } = useTranslation("common");
  if (!mimeType)                                              return <File      className="h-4 w-4 text-muted-foreground" />;
  if (mimeType.startsWith("image/"))                         return <Image     className="h-4 w-4 text-blue-400"         />;
  if (mimeType === "application/pdf")                        return <FileText  className="h-4 w-4 text-red-400"          />;
  if (mimeType.includes("word"))                             return <FileType2 className="h-4 w-4 text-[var(--ep-blue)]"         />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
                                                              return <FileType2 className="h-4 w-4 text-[var(--ep-green)]"        />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

// ─── KPICards ─────────────────────────────────────────────────────────────────

interface KPICardsProps {
  totalContracts: number;
  activeContract: EmploymentContract | undefined;
  pendingDocs: number;
  approvedDocs: number;
  totalFiles: number;
}

export function KPICards({
  totalContracts, activeContract, pendingDocs, approvedDocs, totalFiles,
}: KPICardsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="from-blue-500/10 to-blue-600/10 border-blue-500/20">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("shartnomalar")}</p>
              <p className="text-2xl font-bold text-[var(--ep-blue)]">{totalContracts}</p>
              {activeContract && <p className="text-xs text-[var(--ep-blue)] mt-0.5">1 ta faol</p>}
            </div>
            <ScrollText className="h-7 w-7 text-[var(--ep-blue)]" />
          </div>
        </CardContent>
      </Card>

      <Card className="from-amber-500/10 to-amber-600/10 border-amber-500/20">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("kutilayotgan")}</p>
              <p className="text-2xl font-bold text-[var(--ep-yellow)]">{pendingDocs}</p>
            </div>
            <Clock className="h-7 w-7 text-[var(--ep-yellow)]" />
          </div>
        </CardContent>
      </Card>

      <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("approved")}</p>
              <p className="text-2xl font-bold text-[var(--ep-green)]">{approvedDocs}</p>
            </div>
            <FileCheck className="h-7 w-7 text-[var(--ep-green)]" />
          </div>
        </CardContent>
      </Card>

      <Card className="from-purple-500/10 to-purple-600/10 border-purple-500/20">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("yuklanganFayllar")}</p>
              <p className="text-2xl font-bold text-[var(--ep-purple)]">{totalFiles}</p>
            </div>
            <FolderOpen className="h-7 w-7 text-[var(--ep-purple)]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── EmployeeDocsSection ──────────────────────────────────────────────────────

interface EmployeeDocsSectionProps {
  empDocs: EmployeeDocument[] | undefined;
  isAdminOrHrManager: boolean;
  deletingDocId: number | null;
  onAddDocClick: () => void;
  onDeleteDocClick: (id: number) => void;
}

export function EmployeeDocsSection({
  empDocs, isAdminOrHrManager, deletingDocId, onAddDocClick, onDeleteDocClick,
}: EmployeeDocsSectionProps) {
  const { t } = useTranslation("common");
  const docs = Array.isArray(empDocs) ? empDocs : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--ep-blue)]" />
              {t("hujjatlar")}
            </CardTitle>
            <CardDescription>
              Xodimning rasmiy hujjatlari (kategoriya bo'yicha guruhlangan)
            </CardDescription>
          </div>
          {isAdminOrHrManager && (
            <Button
              size="sm"
              onClick={onAddDocClick}
              className="gap-2 bg-primary hover:bg-primary/90"
              data-testid="button-add-document"
            >
              <Plus className="h-4 w-4" /> {t("hujjatQoshish")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-15" />
            <p className="text-sm font-medium">{t("hujjatQoshilmagan")}</p>
            <p className="text-xs opacity-60 mt-1">{t("xodimUchunHaliHujjatYuklanmagan")}</p>
            {isAdminOrHrManager && (
              <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={onAddDocClick}>
                <Plus className="h-3.5 w-3.5" /> {t("hujjatQoshish")}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(EMP_DOC_CATEGORIES).map(([catKey, catCfg]) => {
              const catDocs = docs.filter(d => d.category === catKey);
              if (catDocs.length === 0) return null;
              const CatIcon = catCfg.icon;
              return (
                <div key={catKey}>
                  <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${catCfg.color}`}>
                    <CatIcon className="h-4 w-4" />
                    {catCfg.label}
                    <span className="text-muted-foreground font-normal text-xs">({catDocs.length})</span>
                  </div>
                  <div className="space-y-1 pl-2">
                    {catDocs.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 hover:bg-muted/50 transition-colors"
                        data-testid={`row-empdoc-${doc.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {doc.file_name && (
                                <span className="truncate max-w-[140px]">{doc.file_name}</span>
                              )}
                              {doc.notes && (
                                <span className="truncate max-w-[160px] opacity-70">{doc.notes}</span>
                              )}
                              <span>{new Date(doc.created_at).toLocaleDateString("uz-UZ")}</span>
                              {doc.uploaded_by_name && <span>• {doc.uploaded_by_name}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {doc.file_url && (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded h-7 w-7 hover:bg-muted transition-colors"
                              title={t("view")}
                            >
                              <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          )}
                          {isAdminOrHrManager && (
                            <button
                              onClick={() => onDeleteDocClick(doc.id)}
                              disabled={deletingDocId === doc.id}
                              className="inline-flex items-center justify-center rounded h-7 w-7 hover:bg-destructive/10 transition-colors"
                              title={t("delete")}
                              data-testid={`button-delete-doc-${doc.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
