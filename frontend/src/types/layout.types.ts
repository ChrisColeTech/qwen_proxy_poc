/**
 * Layout Component Type Definitions
 * Contains all interfaces and types for layout components
 */

export interface AppLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export interface SidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
