/**
 * @module ChildrenTab
 * @description React UI component.
 */

import { useLocation } from "wouter";
import { Network, Users, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NodeDetail, NODE_TYPE_LABELS } from "./types";
import { useTranslation } from '@/lib/i18n';

interface ChildrenTabProps {
  node: NodeDetail;
}

export function ChildrenTab({ node }: ChildrenTabProps) {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();

  if (node.children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Network className="h-10 w-10" />
        <p>{t("farzandBolimlarYoq")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {(Array.isArray(node.children) ? node.children : []).map((child) => (
        <Card key={child.id}
          className="cursor-pointer hover:shadow transition-shadow overflow-hidden"
          onClick={() => navigate(`/org-structure/hierarchy/node/${child.id}`)}>
          <div className="h-1.5" style={{ background: child.color || "#1d4ed8" }} />
          <CardContent className="py-3 px-4">
            <p className="font-medium text-sm">{child.name}</p>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground text-xs">
              <Users className="h-3 w-3" />
              <span>{child.employeeCount} xodim</span>
              <span className="ml-auto">{NODE_TYPE_LABELS[child.nodeType] || child.nodeType}</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
