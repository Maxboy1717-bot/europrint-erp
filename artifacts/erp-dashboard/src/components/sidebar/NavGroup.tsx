import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { MenuItem } from "./types";

interface NavGroupProps {
  items: MenuItem[];
  currentPath: string;
}

export function NavGroup({ items, currentPath }: NavGroupProps) {
  return (
    <nav className="py-2 px-2">
      {(Array.isArray(items) ? items : []).map((item, index) => {
        if (item.separator) {
          return (
            <div key={`separator-${index}`} className="px-2 pt-5 pb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1.5 text-sidebar-foreground/40">
                <span className="flex-1 h-px bg-sidebar-border" />
                {item.title}
                <span className="flex-1 h-px bg-sidebar-border" />
              </p>
            </div>
          );
        }

        const isActive = currentPath === item.url || currentPath.startsWith(item.url + "/");
        const itemName = item.url.replace(/\//g, "-");

        return (
          <Link
            key={item.url + index}
            href={`/${item.url}`}
            data-testid={`nav-menu-item-${itemName}`}
            className={cn(
              "relative flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12.5px] font-medium transition-all duration-150 mb-0.5",
              isActive
                ? "bg-primary/10 text-primary border-r-2 border-primary font-semibold"
                : "text-sidebar-foreground/70 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive ? "text-primary" : "text-sidebar-foreground/40"
            )} />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
