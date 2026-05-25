/** @module constants-utils @description Utility functions that operate on the combined menuGroups map: translation helper and path-to-module resolver. */

import { MenuGroup } from "./types";
import { menuGroups } from "./constants";

/**
 * Returns a copy of menuGroups with every title string passed through the
 * provided translation function `t`.
 */
export function getTranslatedMenuGroups(t: (key: string) => string): Record<string, MenuGroup> {
  const translated: Record<string, MenuGroup> = {};
  for (const [key, group] of Object.entries(menuGroups)) {
    translated[key] = {
      ...group,
      title: t(group.title),
      items: group.items.map((item) => ({
        ...item,
        title: t(item.title),
      })),
    };
  }
  return translated as Record<string, MenuGroup>;
}

/**
 * Given a URL path, returns the module key whose defaultUrl or item URLs
 * match as a prefix.  Returns `null` when no match is found.
 */
export function findModuleByPath(path: string): string | null {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  for (const [moduleKey, group] of Object.entries(menuGroups)) {
    if (
      group.defaultUrl &&
      (cleanPath === group.defaultUrl || cleanPath.startsWith(group.defaultUrl + "/"))
    ) {
      return moduleKey;
    }
    for (const item of group.items) {
      if (!("separator" in item) || !item.separator) {
        if (item.url && (cleanPath === item.url || cleanPath.startsWith(item.url + "/"))) {
          return moduleKey;
        }
      }
    }
  }

  return null;
}
