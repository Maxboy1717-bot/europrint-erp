/**
 * @module KnowledgeBaseSections
 * @description Presentational components for the KnowledgeBase page:
 *   loading skeleton, filter bar, empty state, and the item card list.
 *   All data and callbacks are received via props — no local state.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, BookOpen, Filter } from "lucide-react";
import type { CategoryOption, KnowledgeBase } from "./KnowledgeBaseTypes";
import { getCategoryLabel } from "./KnowledgeBaseTypes";
import { EPStatusPill } from "@/components/ep";

import { tLabel } from '@/lib/i18n/tLabel';
// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

interface LoadingSkeletonProps {
  addButtonLabel: string;
}

export function KnowledgeBaseLoadingSkeleton({ addButtonLabel }: LoadingSkeletonProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-80 mb-2 rounded-lg" />
          <Skeleton className="h-5 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={`k-${i}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-6 w-64 mb-2 rounded-lg" />
                  <Skeleton className="h-4 w-48 mb-2 rounded-lg" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-lg" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 mb-1 rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-4 w-24 mb-1 rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">{addButtonLabel}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

interface FilterBarProps {
  categories: CategoryOption[];
  filterCategory: string;
  onFilterChange: (value: string) => void;
  totalCount: number;
  allLabel: string;
  categoryLabel: string;
  totalLabel: string;
}

export function KnowledgeBaseFilterBar({
  categories,
  filterCategory,
  onFilterChange,
  totalCount,
  allLabel,
  categoryLabel,
  totalLabel,
}: FilterBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterCategory} onValueChange={onFilterChange}>
            <SelectTrigger className="w-64 h-9" data-testid="select-category-filter">
              <SelectValue placeholder={`${allLabel} ${categoryLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {allLabel} {categoryLabel.toLowerCase()}
              </SelectItem>
              {(Array.isArray(categories) ? categories : []).map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <EPStatusPill tone="neutral">
            {totalLabel}: {totalCount}
          </EPStatusPill>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Item card
// ---------------------------------------------------------------------------

interface ItemCardProps {
  item: KnowledgeBase;
  categories: CategoryOption[];
  inactiveLabel: string;
  onEdit: (item: KnowledgeBase) => void;
  onDelete: (id: string) => void;
}

export function KnowledgeBaseItemCard({
  item,
  categories,
  inactiveLabel,
  onEdit,
  onDelete,
}: ItemCardProps) {
  return (
    <Card data-testid={`knowledge-card-${item.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{item.title}</CardTitle>
              {!item.isActive && (
                <EPStatusPill tone="danger">{inactiveLabel}</EPStatusPill>
              )}
            </div>
            <CardDescription>{item.titleRu}</CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {getCategoryLabel(categories, item.category)}
              </Badge>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {(Array.isArray(item.tags) ? item.tags : []).map(
                    (tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
              data-testid={`button-edit-${item.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium mb-1">O&apos;zbekcha:</p>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {item.content}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">{tLabel('common.KnowledgeBaseSections.untitled', "Русский:")}</p>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {item.contentRu}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Items list (empty state + card grid)
// ---------------------------------------------------------------------------

interface ItemsListProps {
  items: KnowledgeBase[];
  categories: CategoryOption[];
  noDataLabel: string;
  inactiveLabel: string;
  onEdit: (item: KnowledgeBase) => void;
  onDelete: (id: string) => void;
}

export function KnowledgeBaseItemsList({
  items,
  categories,
  noDataLabel,
  inactiveLabel,
  onEdit,
  onDelete,
}: ItemsListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{noDataLabel}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {(Array.isArray(items) ? items : []).map((item) => (
        <KnowledgeBaseItemCard
          key={item.id}
          item={item}
          categories={categories}
          inactiveLabel={inactiveLabel}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
