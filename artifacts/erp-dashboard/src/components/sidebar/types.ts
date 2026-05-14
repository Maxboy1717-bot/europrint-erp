/**
 * @module types
 * @description React UI component.
 */

import { LayoutDashboard } from "lucide-react";

export interface MenuItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  separator?: boolean;
}

export interface MenuGroup {
  title: string;
  icon: typeof LayoutDashboard;
  defaultUrl: string;
  items: MenuItem[];
}

export interface ModuleSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export interface MobileSidebarProps extends ModuleSidebarProps {
  open: boolean;
  onClose: () => void;
}
