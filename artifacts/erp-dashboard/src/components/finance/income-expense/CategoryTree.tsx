/**
 * @module CategoryTree
 * @description React UI component.
 */

import { useState } from "react";
import { ChevronRight, ChevronDown, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinanceCategory } from "./types";

interface CategoryTreeProps {
  categories: FinanceCategory[];
  parentId: string | null;
  level?: number;
  onEdit: (category: FinanceCategory) => void;
}

export function CategoryTree({
  categories,
  parentId = null,
  level = 0,
  onEdit,
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const children = (Array.isArray(categories) ? categories : []).filter((c) => c.parentId === parentId);

  if (children.length === 0) return null;

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  return (
    <div className="space-y-1">
      {(Array.isArray(children) ? children : []).map((category) => {
        const hasChildren = (Array.isArray(categories) ? categories : []).some((c) => c.parentId === category.id);
        const isExpanded = expandedIds.has(category.id);

        return (
          <div key={category.id}>
            <div
              className={`flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer ${
                level === 0 ? "bg-muted/50" : ""
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              data-testid={`category-item-${category.id}`}
            >
              {hasChildren ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4"
                  onClick={() => toggleExpand(category.id)}
                  data-testid={`toggle-category-${category.id}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <div className="w-5" />
              )}

              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    category.color ||
                    (category.categoryType === "income" ? "#22c55e" : "#ef4444"),
                }}
              />

              <span className="flex-1 text-sm">{category.name}</span>

              <Badge variant="outline" className="text-xs">
                {category.code}
              </Badge>

              <Badge
                variant="outline"
                className={
                  category.categoryType === "income"
                    ? "bg-green-500/20 text-green-400 border-green-500/40"
                    : "bg-red-500/20 text-red-400 border-red-500/40"
                }
              >
                {category.categoryType === "income" ? "Kirim" : "Chiqim"}
              </Badge>

              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onEdit(category)}
                data-testid={`edit-category-${category.id}`}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>

            {isExpanded && hasChildren && (
              <CategoryTree
                categories={categories}
                parentId={category.id}
                level={level + 1}
                onEdit={onEdit}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
