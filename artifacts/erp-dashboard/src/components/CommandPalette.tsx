/**
 * @module CommandPalette
 * @description Global Cmd+K / Ctrl+K navigation palette.
 *   Opens a searchable dialog listing all sidebar navigation items.
 *   Mount once inside AppShellModern.
 *
 *   Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
 */

import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getTranslatedMenuGroups } from "@/components/sidebar/constants";
import { useTranslation } from "@/lib/i18n";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { t } = useTranslation("navigation");
  const { t: tCommon } = useTranslation("common");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Build flat navigation list from all module groups
  const groups = useMemo(() => getTranslatedMenuGroups(t), [t]);

  const navGroups = useMemo(() => {
    return Object.values(groups)
      .map((g) => ({
        groupTitle: g.title,
        items: (Array.isArray(g.items) ? g.items : [])
          .filter((item) => item.url && !item.separator)
          .map((item) => ({
            label: item.title,
            url: item.url.startsWith("/") ? item.url : `/${item.url}`,
          })),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={tCommon("commandPaletteSearch")} />
      <CommandList>
        <CommandEmpty>{tCommon("commandPaletteEmpty")}</CommandEmpty>
        {navGroups.map((g) => (
          <CommandGroup key={g.groupTitle} heading={g.groupTitle}>
            {g.items.map((item) => (
              <CommandItem
                key={item.url}
                value={`${g.groupTitle} ${item.label}`}
                onSelect={() => {
                  navigate(item.url);
                  setOpen(false);
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
