/**
 * @module FilesTabContent
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { Upload, Eye, Download, Trash2 } from "lucide-react";
import { getFileIcon, isImageFile } from "../kanban-types";
import type { TaskFile } from "@shared/schema";
import { useTranslation } from '@/lib/i18n';

interface FilesTabContentProps {
  files: TaskFile[];
  cardId: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (fileId: string) => void;
  isUploading: boolean;
}

export function FilesTabContent({
  files,
  cardId,
  onFileSelect,
  onDeleteFile,
  isUploading,
}: FilesTabContentProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed rounded-md p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const droppedFiles = e.dataTransfer.files;
          if (droppedFiles.length > 0) {
            const event = {
              target: { files: droppedFiles, value: '' },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            onFileSelect(event);
          }
        }}
        onClick={() => document.getElementById(`file-input-${cardId}`)?.click()}
      >
        <input
          id={`file-input-${cardId}`}
          type="file"
          multiple
          className="hidden"
          onChange={onFileSelect}
          data-testid="input-file-upload"
        />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t("fayllarniShuYergaTashlangYoki")}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={isUploading}
          onClick={(e) => { e.stopPropagation(); document.getElementById(`file-input-${cardId}`)?.click(); }}
          data-testid="button-upload-file"
        >
          {t("faylTanlang")}
        </Button>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(Array.isArray(files) ? files : []).map((file) => {
            const { icon: FileIcon, color: iconColor } = getFileIcon(file.mimeType, file.fileName);
            const showThumbnail = isImageFile(file.mimeType, file.fileName);

            return (
              <div key={file.id} className="border rounded-md overflow-hidden group" data-testid={`file-${file.id}`}>
                {showThumbnail ? (
                  <div className="relative h-24 bg-muted">
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                      <a href={file.fileUrl} download={file.fileName}>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 bg-muted flex items-center justify-center">
                    <FileIcon className={`h-12 w-12 ${iconColor}`} />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={file.fileName}>{file.fileName}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-muted-foreground">
                      {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : ""}
                    </p>
                    {!showThumbnail && (
                      <div className="flex items-center gap-1">
                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </a>
                        <a href={file.fileUrl} download={file.fileName}>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Download className="h-3 w-3" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onDeleteFile(file.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {files.length === 0 && (
        <p className="text-center text-muted-foreground py-4">{t("fayllarYoq")}</p>
      )}
    </div>
  );
}
