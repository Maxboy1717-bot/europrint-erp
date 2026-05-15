/**
 * @module sidebar
 * @description Barrel re-export for sidebar UI primitives. Definitions live in
 *   `components/ui/sidebar/*` split files so each stays under 300 lines.
 */

export { useSidebar, SidebarProvider } from "./sidebar/sidebar-context"
export { Sidebar, SidebarTrigger, SidebarRail, SidebarInset } from "./sidebar/sidebar-root"
export {
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./sidebar/sidebar-sections"
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./sidebar/sidebar-menu"
