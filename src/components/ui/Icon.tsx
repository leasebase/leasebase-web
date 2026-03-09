"use client";

import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  FileText,
  FolderOpen,
  Users,
  CreditCard,
  Wrench,
  MessageSquare,
  BarChart3,
  Settings,
  Calendar,
  HardHat,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  properties: Building2,
  units: DoorOpen,
  leases: FileText,
  documents: FolderOpen,
  tenants: Users,
  payments: CreditCard,
  maintenance: Wrench,
  messages: MessageSquare,
  reports: BarChart3,
  settings: Settings,
  showings: Calendar,
  vendor: HardHat,
  alert: AlertTriangle,
  bell: Bell,
  check: CheckCircle2,
  clock: Clock,
  trend: TrendingUp,
  plus: Plus,
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
