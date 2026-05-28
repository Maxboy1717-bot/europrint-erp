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
            <div key={`separator-${index}`} className="px-2 pt-5 pb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] flex items-center gap-1.5 text-sidebar-foreground/35">
                <span className="flex-1 h-px bg-sidebar-border" />
                {item.title}
                <span className="flex-1 h-px bg-sidebar-border" />
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
              "relative flex items-center gap-2.5 px-3 h-9 rounded-md text-[12.5px] font-medium transition-colors duration-100 mb-0.5",
              isActive
                ? "bg-sidebar-accent text-primary font-semibold shadow-[inset_3px_0_0_hsl(var(--primary))]"
                : "text-sidebar-foreground/65 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive ? "text-primary" : "text-sidebar-foreground/40"
            )} />
            <span className="flex-1 truncate">{item.title}</span>
            {hasBadge && (
              <span className="ml-auto text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shrink-0">
                {(item.badge as number) > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
