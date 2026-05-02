import { ComponentType } from "react";

export function SectionHeader({ id, icon: Icon, title, description }: {
  id: string; icon: ComponentType<{ className?: string }>; title: string; description?: string;
}) {
  return (
    <div id={id} className="flex items-center gap-3 pb-3 border-b">
      <div className="p-2 bg-primary/10 rounded-md shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
