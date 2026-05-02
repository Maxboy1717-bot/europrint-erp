import { useQuery } from "@tanstack/react-query";

interface PanelConfig {
  id?: string;
  userId?: string;
  config?: Record<string, unknown>;
  defaultPage?: string;
  pinnedModules?: string[];
}

export function useDefaultPanel() {
  const { data: panel, isLoading } = useQuery<PanelConfig>({
    queryKey: ["/api/core/panels/default"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const defaultPage = panel?.defaultPage ?? "analytics";
  const pinnedModules: string[] = panel?.pinnedModules ?? [];

  return { panel, isLoading, defaultPage, pinnedModules };
}
