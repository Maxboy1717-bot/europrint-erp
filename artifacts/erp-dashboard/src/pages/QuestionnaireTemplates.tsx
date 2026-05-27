/**
 * @module QuestionnaireTemplates
 * @description Anketa Shablonlar sahifasi — kategoriya bo'yicha filtrlash bilan.
 * Route: /questionnaire-templates
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileQuestion } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuestionnaireTemplate {
  id: number | string;
  code?: string;
  title: string;
  description?: string;
  category: string;
  questions_count: number;
  is_active?: boolean;
  created_at?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryVariant(
  category: string
): "default" | "info" | "warning" | "success" | "purple" | "neutral" {
  const map: Record<string, "default" | "info" | "warning" | "success" | "purple" | "neutral"> = {
    hr: "success",
    finance: "info",
    quality: "warning",
    production: "purple",
    general: "neutral",
  };
  const key = category?.toLowerCase() ?? "";
  return map[key] ?? "default";
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function TemplateCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3 mt-1" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-8 w-24 mt-3" />
      </CardContent>
    </Card>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: QuestionnaireTemplate;
}

function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug">
            {template.title}
          </CardTitle>
          <Badge variant={categoryVariant(template.category)} className="shrink-0">
            {template.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {template.questions_count} ta savol
        </p>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-3">
        {template.description && (
          <p
            className="text-xs text-muted-foreground line-clamp-2 flex-1"
            title={template.description}
          >
            {template.description}
          </p>
        )}
        {!template.description && (
          <div className="flex-1" />
        )}
        <Button size="sm" variant="outline" className="w-fit mt-auto">
          Ishlatish
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ALL_LABEL = "Barchasi";

export default function QuestionnaireTemplates() {
  const { t } = useTranslation("common");
  const [activeCategory, setActiveCategory] = useState(ALL_LABEL);

  const { data: raw, isLoading, isError } = useQuery<QuestionnaireTemplate[]>({
    queryKey: ["/api/questionnaire-templates"],
    retry: false,
  });

  const templates: QuestionnaireTemplate[] = Array.isArray(raw) ? raw : [];

  // Collect unique categories
  const categories: string[] = [ALL_LABEL];
  templates.forEach((t) => {
    if (t.category && !categories.includes(t.category)) {
      categories.push(t.category);
    }
  });

  const filtered =
    activeCategory === ALL_LABEL
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileQuestion className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Anketa Shablonlar</h1>
          <p className="text-sm text-muted-foreground">
            Tayyor shablon anketalardan foydalanish
          </p>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Card>
          <CardContent className="py-14 text-center">
            <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Shablonlarni yuklashda xatolik yuz berdi.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Shablon moduli hali ishga tushirilmagan bo'lishi mumkin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category filter tabs */}
      {!isError && (
        <>
          <div className="flex flex-wrap gap-2">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={[
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50",
                    ].join(" ")}
                  >
                    {cat}
                  </button>
                ))}
          </div>

          {/* Grid */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TemplateCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <FileQuestion className="mx-auto h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  {activeCategory === ALL_LABEL
                    ? "Hozircha shablonlar yo'q."
                    : `"${activeCategory}" kategoriyasida shablon topilmadi.`}
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((tmpl) => (
                <TemplateCard key={tmpl.id} template={tmpl} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
