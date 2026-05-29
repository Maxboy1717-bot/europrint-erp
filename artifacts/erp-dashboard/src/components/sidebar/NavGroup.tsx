/**
 * @module NavGroup
 * @description React UI component.
 */

import { Link, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { MenuItem } from "./types";

interface NavGroupProps {
  items: MenuItem[];
  currentPath: string;
}

export function NavGroup({ items, currentPath }: NavGroupProps) {
  const search = useSearch(); // reaktiv: URL o'zganganda yangilanadi

  return (
    <nav className="py-2 px-2">
      {(Array.isArray(items) ? items : []).map((item, index) => {
        if (item.separator) {
          return (
            <div key={`separator-${index}`} className="px-2 pt-4 pb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/40">
                {item.title}
              </p>
            </div>
          );
        }

        // URL qismini va query param'ni ajratib tekshirish
        const [itemPath, itemQuery] = item.url.split("?");
        const pathMatch = currentPath === itemPath || currentPath.startsWith(itemPath + "/");
        const queryMatch = !itemQuery || search === `?${itemQuery}` || search === `${itemQuery}`;
        const isActive = pathMatch && queryMatch;
        const itemName = item.url.replace(/[/?=]/g, "-");
        const hasBadge = typeof item.badge === "number" && item.badge > 0;

        return (
          <Link
            key={item.url + index}
            href={`/${item.url}`}
            data-testid={`nav-menu-item-${itemName}`}
            className={cn(
              "group relative flex items-center gap-3 px-3 h-10 rounded-[10px] text-[13px] font-medium transition-colors duration-150 mb-0.5",
              isActive
                ? "bg-sidebar-accent text-primary font-semibold shadow-[inset_3px_0_0_hsl(var(--primary))]"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/55 hover:text-primary"
            )}
          >
            <item.icon className={cn(
              "h-[18px] w-[18px] shrink-0 transition-all duration-200",
              isActive ? "text-primary" : "text-sidebar-foreground/45 group-hover:text-primary group-hover:scale-110"
            )} />
            <span className="flex-1 truncate">{item.title}</span>
            {hasBadge && (
              <span className="ml-auto text-[10.5px] font-bold bg-primary text-primary-foreground rounded-full min-w-[22px] h-[18px] flex items-center justify-center px-2 shrink-0">
                {(item.badge as number) > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
