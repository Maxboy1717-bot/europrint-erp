/**
 * @module SharedFiles
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Image, FileText, Grid3X3, List } from "lucide-react";
import { format } from "date-fns";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface SharedFile {
  id: string;
  roomId: string;
  senderId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  messageType: string;
  createdAt: string;
  senderName: string;
}

interface Props {
  roomId: string;
}

type FilterType = "all" | "image" | "document";
type ViewMode = "grid" | "list";

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SharedFiles({ roomId }: Props) {
  const { t } = useTranslation("common");
  const [filter, setFilter] = useState<FilterType>("all");
  const [view, setView] = useState<ViewMode>("grid");

  const { data: files = [], isLoading } = useQuery<SharedFile[]>({
    queryKey: ["chat-room-files", roomId, filter],
    queryFn: async () => {
      const url = `/api/chat/rooms/${roomId}/files${filter !== "all" ? `?type=${filter}` : ""}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load files");
      return res.json();
    },
    enabled: !!roomId,
    staleTime: 30_000,
  });

  const isImage = (f: SharedFile) => f.messageType === "IMAGE" || f.mimeType?.startsWith("image/");

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 flex-shrink-0">
        <div className="flex gap-1">
          {(["all", "image", "document"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              )}
            >
              {f === "all" ? "Barchasi" : f === "image" ? "Rasmlar" : "Hujjatlar"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView("grid")}
            className={cn("p-1.5 rounded-lg transition-colors", view === "grid" ? "bg-muted" : "hover:bg-muted/60")}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("p-1.5 rounded-lg transition-colors", view === "list" ? "bg-muted" : "hover:bg-muted/60")}
          >
            <List className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <EPLoader tone="muted" className="w-5 h-5" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-muted-foreground">
            <FileText className="w-8 h-8 opacity-30" />
            <p className="text-xs">{t("fayllarYoq")}</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {(Array.isArray(files) ? files : []).map((file) => (
              <div
                key={file.id}
                className="relative group rounded-xl overflow-hidden border border-border/40 bg-muted/20 hover:border-border transition-all"
              >
                {isImage(file) ? (
                  <div className="aspect-square">
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center gap-1 p-2">
                    <FileText className="w-8 h-8 text-[var(--ep-blue)]/70" />
                    <p className="text-[10px] text-muted-foreground truncate w-full text-center px-1">
                      {file.fileName}
                    </p>
                  </div>
                )}
                <a
                  href={file.fileUrl}
                  download={file.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <Download className="w-5 h-5 text-white" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {(Array.isArray(files) ? files : []).map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/40 transition-colors group"
              >
                {isImage(file) ? (
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-border/40 flex-shrink-0">
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-[var(--ep-blue)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.fileName || "Fayl"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {file.senderName} · {format(new Date(file.createdAt), "dd.MM.yy")}
                    {file.fileSize ? ` · ${formatBytes(file.fileSize)}` : ""}
                  </p>
                </div>
                <a
                  href={file.fileUrl}
                  download={file.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
