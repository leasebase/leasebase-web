"use client";

import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  FileText,
  Users,
  CreditCard,
  Wrench,
  MessageSquare,
  BarChart3,
  Settings,
  Calendar,
  HardHat,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  properties: Building2,
  units: DoorOpen,
  leases: FileText,
  tenants: Users,
  payments: CreditCard,
  maintenance: Wrench,
  messages: MessageSquare,
  reports: BarChart3,
  settings: Settings,
  showings: Calendar,
  vendor: HardHat,
};

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className = "" }: IconProps) {
  const Component = iconMap[name];
  if (!Component) return null;
  return <Component size={size} className={className} aria-hidden="true" />;
}

export { iconMap };
