import { type LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleSectionHeaderProps {
  moduleName: string;
  moduleColor?: string;
  sectionTitle: string;
  sectionDescription?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function ModuleSectionHeader({
  moduleName,
  moduleColor = "text-primary",
  sectionTitle,
  sectionDescription,
  icon: Icon,
  actions,
  className,
}: ModuleSectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6 flex-wrap", className)}>
      <div className="flex items-start gap-4">
        <div className={cn("p-2.5 rounded-md bg-primary/10 shrink-0", moduleColor.replace("text-", "bg-").replace("500", "500/10").replace("600", "600/10"))}>
          <Icon className={cn("w-5 h-5", moduleColor)} />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-0.5">
            <span>{moduleName}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={cn("font-medium", moduleColor)}>{sectionTitle}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{sectionTitle}</h1>
          {sectionDescription && (
            <p className="text-sm text-muted-foreground mt-0.5">{sectionDescription}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
