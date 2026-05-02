import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type ModuleType = "sd" | "pp" | "mm" | "fi" | "hr" | "ai" | "default";

interface ModulePageProps {
  module: ModuleType;
  title: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const moduleStyles: Record<ModuleType, { 
  headerBg: string; 
  iconColor: string; 
  accentBorder: string;
  badge: string;
}> = {
  sd: {
    headerBg: "bg-module-sd-light dark:bg-module-sd/10",
    iconColor: "text-module-sd",
    accentBorder: "border-l-module-sd",
    badge: "bg-module-sd text-white",
  },
  pp: {
    headerBg: "bg-module-pp-light dark:bg-module-pp/10",
    iconColor: "text-module-pp",
    accentBorder: "border-l-module-pp",
    badge: "bg-module-pp text-white",
  },
  mm: {
    headerBg: "bg-module-warehouse-light dark:bg-module-warehouse/10",
    iconColor: "text-module-warehouse",
    accentBorder: "border-l-module-warehouse",
    badge: "bg-module-warehouse text-white",
  },
  fi: {
    headerBg: "bg-module-fi-light dark:bg-module-fi/10",
    iconColor: "text-module-fi",
    accentBorder: "border-l-module-fi",
    badge: "bg-module-fi text-white",
  },
  hr: {
    headerBg: "bg-module-hr-light dark:bg-module-hr/10",
    iconColor: "text-module-hr",
    accentBorder: "border-l-module-hr",
    badge: "bg-module-hr text-white",
  },
  ai: {
    headerBg: "bg-primary/5 dark:bg-primary/10",
    iconColor: "text-primary",
    accentBorder: "border-l-primary",
    badge: "bg-primary text-white",
  },
  default: {
    headerBg: "bg-muted/30 dark:bg-muted/20",
    iconColor: "text-muted-foreground",
    accentBorder: "border-l-muted-foreground",
    badge: "bg-muted-foreground text-white",
  },
};

export function ModulePage({ 
  module, 
  title, 
  subtitle, 
  icon, 
  actions, 
  children, 
  className 
}: ModulePageProps) {
  const styles = moduleStyles[module];

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg border-l-4",
        styles.headerBg,
        styles.accentBorder
      )}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn("p-2 rounded-lg", styles.headerBg)}>
              <div className={styles.iconColor}>{icon}</div>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export function ModuleCard({ 
  module, 
  children, 
  className 
}: { 
  module: ModuleType; 
  children: ReactNode; 
  className?: string;
}) {
  const styles = moduleStyles[module];
  
  return (
    <div className={cn(
      "rounded-lg border p-4 border-l-4",
      styles.accentBorder,
      className
    )}>
      {children}
    </div>
  );
}

export { moduleStyles };
