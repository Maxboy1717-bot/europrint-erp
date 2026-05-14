/**
 * @module DocumentsTabSectionsB
 * @description FileFolderSection and ContractsSection.
 *              HRDocsSection lives in DocumentsTabSectionsC.tsx.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ScrollText, CheckCircle2, FolderOpen, Upload, Download, Trash2,
} from "lucide-react";
import {
  type EmploymentContract, type EmployeeFile,
  FILE_CATEGORIES,
  formatBytes,
} from "./DocumentsTabTypes";
import { FileIcon } from "./DocumentsTabSectionsA";
import { EPStatusPill } from "@/components/ep";

// ─── FileFolderSection ────────────────────────────────────────────────────────

interface FileFolderSectionProps {
  employeeFiles: EmployeeFile[] | undefined;
  totalFiles: number;
  activeFileCategory: string;
  onCategoryChange: (cat: string) => void;
  deletingId: number | null;
  onDeleteFileClick: (id: number) => void;
  onUploadClick: () => void;
}

export function FileFolderSection({
  employeeFiles, totalFiles, activeFileCategory, onCategoryChange,
  deletingId, onDeleteFileClick, onUploadClick,
}: FileFolderSectionProps) {
  const allFiles      = Array.isArray(employeeFiles) ? employeeFiles : [];
  const filteredFiles = activeFileCategory === "all"
    ? allFiles
    : allFiles.filter(f => f.category === activeFileCategory);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-[var(--ep-purple)]" />
              Xodim Papkasi
            </CardTitle>
            <CardDescription>Xodimning shaxsiy hujjatlari va fayllari</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={onUploadClick}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="button-upload-file"
          >
            <Upload className="h-4 w-4" /> Fayl yuklash
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 mb-4">
          <button
            onClick={() => onCategoryChange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFileCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            Barchasi ({totalFiles})
          </button>
          {Object.entries(FILE_CATEGORIES).map(([key, cfg]) => {
            const count = allFiles.filter(f => f.category === key).length;
            const Icon  = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => onCategoryChange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeFileCategory === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label} {count > 0 && <span className="opacity-60">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Files table */}
        {filteredFiles.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Fayl nomi</TableHead>
                <TableHead>Toifa</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead>Hajmi</TableHead>
                <TableHead>Yuklagan</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map(file => {
                const catCfg = FILE_CATEGORIES[file.category] || FILE_CATEGORIES.other;
                const CatIcon = catCfg.icon;
                return (
                  <TableRow key={file.id} data-testid={`row-empfile-${file.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell><FileIcon mimeType={file.mime_type} /></TableCell>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">
                      {file.file_name}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs flex items-center gap-1 ${catCfg.color}`}>
                        <CatIcon className="h-3 w-3" />{catCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {file.description || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatBytes(file.file_size)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {file.uploaded_by_name || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(file.created_at).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded h-7 w-7 hover:bg-muted transition-colors"
                          title="Yuklab olish"
                        >
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                        <button
                          onClick={() => onDeleteFileClick(file.id)}
                          disabled={deletingId === file.id}
                          className="inline-flex items-center justify-center rounded h-7 w-7 hover:bg-destructive/10 transition-colors"
                          title="O'chirish"
                          data-testid={`button-delete-file-${file.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        ) : (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mb-3 opacity-15" />
            <p className="text-sm font-medium">Fayllar topilmadi</p>
            <p className="text-xs opacity-60 mt-1">
              {activeFileCategory === "all"
                ? "Xodim papkasiga hali fayl yuklanmagan"
                : `${FILE_CATEGORIES[activeFileCategory]?.label} toifasida fayllar yo'q`}
            </p>
            <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={onUploadClick}>
              <Upload className="h-3.5 w-3.5" /> Fayl yuklash
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ContractsSection ─────────────────────────────────────────────────────────

interface ContractsSectionProps {
  contractsArr: EmploymentContract[];
}

export function ContractsSection({ contractsArr }: ContractsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[var(--ep-blue)]" />
          Mehnat shartnomalari
        </CardTitle>
        <CardDescription>Xodim bilan tuzilgan barcha shartnomalar ro'yxati</CardDescription>
      </CardHeader>
      <CardContent>
        {contractsArr.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shartnoma №</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>Boshlanish sanasi</TableHead>
                <TableHead>Tugash sanasi</TableHead>
                <TableHead>Maosh</TableHead>
                <TableHead>Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractsArr.map(contract => {
                const isActive = !contract.endDate || new Date(contract.endDate) > new Date();
                return (
                  <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm font-semibold">
                      {contract.contractNumber || `#${contract.id}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {contract.contractType === "indefinite"  ? "Doimiy"
                          : contract.contractType === "temporary"  ? "Muddatli"
                          : contract.contractType === "probation"  ? "Sinov muddati"
                          : contract.contractType === "fixed-term" ? "Belgilangan muddat"
                          : contract.contractType || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {contract.startDate
                        ? new Date(contract.startDate).toLocaleDateString("uz-UZ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contract.endDate
                        ? new Date(contract.endDate).toLocaleDateString("uz-UZ")
                        : "Muddatsiz"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contract.salary
                        ? `${Number(contract.salary).toLocaleString()} so'm`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge className="bg-green-100 text-green-800 border-none text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Faol
                        </Badge>
                      ) : (
                        <EPStatusPill tone="neutral" className="text-xs">Yakunlangan</EPStatusPill>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        ) : (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <ScrollText className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">Shartnomalar topilmadi</p>
            <p className="text-xs opacity-60 mt-1">Hech qanday mehnat shartnomasi qayd etilmagan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
