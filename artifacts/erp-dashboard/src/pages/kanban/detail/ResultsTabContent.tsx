/**
 * @module ResultsTabContent
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Plus, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { getFileIcon, isImageFile } from "../kanban-types";
import type { ResultWithFiles } from "../kanban-types";
import { useTranslation } from '@/lib/i18n';

interface ResultsTabContentProps {
  results: ResultWithFiles[];
  resultText: string;
  onResultTextChange: (val: string) => void;
  onAddResult: (text: string) => void;
  onUploadResultFile: (resultId: string, file: File) => void;
  onDeleteResultFile: (fileId: string) => void;
  isUploadingResultFile: boolean;
}

export function ResultsTabContent({
  results,
  resultText,
  onResultTextChange,
  onAddResult,
  onUploadResultFile,
  onDeleteResultFile,
  isUploadingResultFile,
}: ResultsTabContentProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div>
        <Label>{t("natijaMatni")}</Label>
        <Textarea
          value={resultText}
          onChange={(e) => onResultTextChange(e.target.value)}
          placeholder={t("vazifaNatijasiniKiriting")}
          className="min-h-[100px]"
          data-testid="input-result-text"
        />
        <Button
          className="mt-2"
          onClick={() => resultText.trim() && onAddResult(resultText)}
          disabled={!resultText.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("natijaQoshish")}
        </Button>
      </div>

      <Separator />

      {(Array.isArray(results) ? results : []).map((result) => (
        <div key={result.id} className="border rounded-md p-3 space-y-3" data-testid={`result-${result.id}`}>
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {result.creator?.fullName?.split(" ").map(n => n[0]).join("").substring(0, 2) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{result.creator?.fullName || "Noma'lum"}</span>
                <span className="text-xs text-muted-foreground">
                  {result.createdAt && format(new Date(result.createdAt), "dd.MM.yyyy HH:mm")}
                </span>
              </div>
              <p className="text-sm mt-1">{result.description}</p>
            </div>
          </div>

          {result.files && result.files.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-11">
              {(Array.isArray(result.files) ? result.files : []).map((file) => {
                const { icon: FileIcon, color: iconColor } = getFileIcon(file.mimeType, file.fileName);
                const showThumbnail = isImageFile(file.mimeType, file.fileName);

                return (
                  <div key={file.id} className="relative group">
                    {showThumbnail ? (
                      <div className="h-16 w-16 rounded border overflow-hidden">
                        <img src={file.fileUrl} alt={file.fileName} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white"
                            onClick={() => onDeleteResultFile(file.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 border rounded text-xs">
                        <FileIcon className={`h-4 w-4 ${iconColor}`} />
                        <span className="max-w-[100px] truncate">{file.fileName}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100"
                          onClick={() => onDeleteResultFile(file.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 pl-11">
            <input
              type="file"
              id={`result-file-${result.id}`}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUploadResultFile(result.id, file);
                }
                e.target.value = '';
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => document.getElementById(`result-file-${result.id}`)?.click()}
              disabled={isUploadingResultFile}
            >
              <Paperclip className="h-3 w-3 mr-1" />
              {t("faylBiriktirish")}
            </Button>
          </div>
        </div>
      ))}

      {results.length === 0 && (
        <p className="text-center text-muted-foreground py-4">{t("natijalarYoq")}</p>
      )}
    </div>
  );
}
