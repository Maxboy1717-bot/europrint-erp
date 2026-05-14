/**
 * @module LessonPlayerSectionsB
 * @description Content area / player components for LessonPlayer:
 *   - LessonContentArea — right main content (video / PDF / text + actions)
 */

import { sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  CheckCircle,
  BookOpen,
  Play,
  Download,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Lesson } from "./LessonPlayerTypes";
import { getLessonIcon } from "./LessonPlayerSectionsA";

// ---------------------------------------------------------------------------
// LessonContentArea props
// ---------------------------------------------------------------------------

interface LessonContentAreaProps {
  activeLesson: Lesson | null;
  completedIds: Set<string>;
  nextLesson: Lesson | null;
  isPending: boolean;
  onMarkComplete: () => void;
  onNextLesson: () => void;
}

// ---------------------------------------------------------------------------
// LessonContentArea component
// ---------------------------------------------------------------------------

export function LessonContentArea({
  activeLesson,
  completedIds,
  nextLesson,
  isPending,
  onMarkComplete,
  onNextLesson,
}: LessonContentAreaProps) {
  if (!activeLesson) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Dars tanlang</h2>
          <p className="text-muted-foreground">Chap paneldan darsni bosing</p>
        </div>
      </div>
    );
  }

  const isCompleted = completedIds.has(String(activeLesson.id));

  return (
    <>
      {/* Lesson header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-background">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {getLessonIcon(activeLesson.type)}
            <Badge variant="outline" className="text-xs capitalize">
              {activeLesson.type}
            </Badge>
            {isCompleted && (
              <Badge className="bg-green-100 text-[var(--ep-green)] text-xs border-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Bajarilgan
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-semibold text-foreground">{activeLesson.title}</h1>
        </div>
        <div className="flex gap-2">
          {!isCompleted && (
            <Button
              onClick={onMarkComplete}
              disabled={isPending}
              className="bg-primary text-white gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Bajarildi deb belgilash
            </Button>
          )}
          {nextLesson && (
            <Button variant="outline" onClick={onNextLesson}>
              Keyingi dars
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Lesson content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Video lesson */}
          {activeLesson.type === "video" &&
            (activeLesson.videoUrl || activeLesson.filePath) && (
              <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  key={activeLesson.id}
                  controls
                  className="w-full h-full"
                  src={
                    activeLesson.videoUrl ||
                    (activeLesson.filePath
                      ? `/uploads/${activeLesson.filePath}`
                      : undefined)
                  }
                  onEnded={onMarkComplete}
                >
                  Brauzeringiz video formatini qo'llab-quvvatlamaydi.
                </video>
              </div>
            )}

          {/* PDF lesson */}
          {activeLesson.type === "pdf" && activeLesson.filePath && (
            <div className="mb-6">
              <div
                className="rounded-xl overflow-hidden border border-border"
                style={{ height: "600px" }}
              >
                <iframe
                  src={`/uploads/${activeLesson.filePath}`}
                  className="w-full h-full"
                  title={activeLesson.title}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  window.open(`/uploads/${activeLesson.filePath}`, "_blank")
                }
              >
                <Download className="h-4 w-4 mr-2" />
                PDF yuklab olish
              </Button>
            </div>
          )}

          {/* Video without URL placeholder */}
          {activeLesson.type === "video" &&
            !activeLesson.videoUrl &&
            !activeLesson.filePath && (
              <div className="mb-6 rounded-xl bg-muted/60 aspect-video flex items-center justify-center border border-border">
                <div className="text-center">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Video fayli yuklanmagan
                  </p>
                </div>
              </div>
            )}

          {/* Text content */}
          {activeLesson.content && (
            <div className="prose prose-sm max-w-none">
              <div
                className="text-foreground leading-relaxed text-base whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(activeLesson.content),
                }}
              />
            </div>
          )}

          {/* No content fallback */}
          {!activeLesson.content &&
            !activeLesson.videoUrl &&
            !activeLesson.filePath &&
            activeLesson.type === "text" && (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Mazmun hali qo'shilmagan</p>
              </div>
            )}

          {/* Bottom actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            {!isCompleted ? (
              <Button
                onClick={onMarkComplete}
                disabled={isPending}
                className="bg-primary text-white gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isPending ? "Saqlanmoqda..." : "Darsni yakunlash"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-[var(--ep-green)]">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Bajarilgan</span>
              </div>
            )}
            {nextLesson && (
              <Button variant="outline" onClick={onNextLesson}>
                Keyingi: {nextLesson.title}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
