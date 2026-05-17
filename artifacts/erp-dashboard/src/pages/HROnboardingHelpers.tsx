/**
 * @module HROnboardingHelpers
 * @description Small per-row helper components for HROnboarding.
 * Currently: EmployeeFolderItems — renders an employee's onboarding
 * material folder pulled from /api/org-structure/employees/:id/folder.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { FolderOpen, FileText, Video, ClipboardList } from "lucide-react";
import type { Employee, FolderItem } from "./HROnboardingTypes";
import { employeeDisplayName } from "./HROnboardingTypes";

const ITEM_CONFIG = {
  document: { icon: <FileText className="h-3.5 w-3.5" />, label: "Hujjat", color: "#1d4ed8" },
  video:    { icon: <Video className="h-3.5 w-3.5" />, label: "Video", color: "#7c3aed" },
  test:     { icon: <ClipboardList className="h-3.5 w-3.5" />, label: "Test", color: "#16a34a" },
} as const;

export function EmployeeFolderItems({ employee }: { employee: Employee }) {
  const { t } = useTranslation("common");
  const { data: folderItems = [], isLoading } = useQuery<FolderItem[]>({
    queryKey: [`/api/org-structure/employees/${employee.id}/folder`],
    enabled: !!employee.id,
  });

  const empName = employeeDisplayName(employee);
  const items = Array.isArray(folderItems) ? folderItems : [];

  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center gap-2 mb-2">
        <FolderOpen className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{empName}</span>
        <span className="text-xs text-muted-foreground">
          — {employee.positionName || employee.position || "Lavozim ko'rsatilmagan"}
        </span>
        {isLoading && <span className="text-xs text-muted-foreground">{t("Yuklanmoqda...")}</span>}
      </div>
      {!isLoading && items.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-6">{t("papkaBoshLavozimUchunMaterial")}</p>
      ) : (
        <div className="flex flex-wrap gap-2 pl-6">
          {items.map((item) => {
            const config = ITEM_CONFIG[item.itemType] || ITEM_CONFIG.document;
            return (
              <div
                key={item.id}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border"
                style={{
                  borderColor: `${config.color}40`,
                  color: config.color,
                  background: `${config.color}10`,
                }}
                data-testid={`onboarding-folder-item-${item.id}`}
              >
                {config.icon}
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {item.title}
                  </a>
                ) : (
                  <span>{item.title}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
