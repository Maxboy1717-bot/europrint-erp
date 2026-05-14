/**
 * @module ErpThemeProvider
 * @description Source module. See exports for details.
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Replit / Vite: class="dark" on <html>, localStorage key "theme".
 * "system" — OS rejimiga moslashadi.
 */
export function ErpThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
