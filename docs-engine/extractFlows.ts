import type { RouteInfo } from "./extractRoutes.js";
import type { PermissionsMatrix } from "./extractPermissions.js";

/* ── Types ────────────────────────────────────────────────────── */

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowDiagram {
  title: string;
  description: string;
  mermaid: string;
  edges: FlowEdge[];
}

/* ── Helpers ──────────────────────────────────────────────────── */

function routeToNodeId(route: string): string {
  if (route === "/" || route === "") return "Home";
  return route
    .replace(/^\//, "")
    .replace(/\//g, "_")
    .replace(/-/g, "")
    .replace(/[^a-zA-Z0-9_]/g, "");
}

function routeToLabel(route: string): string {
  if (route === "/" || route === "") return "Home (/)";
  const segments = route.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function edgesToMermaid(title: string, edges: FlowEdge[]): string {
  if (edges.length === 0) return `graph TD\n  Empty[No edges detected]`;
  const lines = edges.map((e) => {
    const fromId = routeToNodeId(e.from);
    const toId = routeToNodeId(e.to);
    const fromLabel = routeToLabel(e.from);
    const toLabel = routeToLabel(e.to);
    if (e.label) {
      return `  ${fromId}["${fromLabel}"] -->|${e.label}| ${toId}["${toLabel}"]`;
    }
    return `  ${fromId}["${fromLabel}"] --> ${toId}["${toLabel}"]`;
  });
  return `graph TD\n${[...new Set(lines)].join("\n")}`;
}

/* ── Flow builders ────────────────────────────────────────────── */

function buildLoginFlow(routes: RouteInfo[]): FlowDiagram {
  const edges: FlowEdge[] = [
    { from: "/", to: "/app", label: "redirect" },
    { from: "/auth/login", to: "/app", label: "success" },
    { from: "/auth/login", to: "/auth/register", label: "sign up" },
    { from: "/auth/login", to: "/auth/verify-email", label: "verify" },
    { from: "/auth/register", to: "/auth/verify-email", label: "confirm" },
    { from: "/auth/register", to: "/auth/login", label: "has account" },
    { from: "/auth/verify-email", to: "/auth/login", label: "verified" },
    { from: "/auth/callback", to: "/", label: "OAuth complete" },
  ];

  return {
    title: "Login Flow",
    description: "Authentication flow including login, registration, email verification, and OAuth callback.",
    mermaid: edgesToMermaid("Login Flow", edges),
    edges,
  };
}

function buildDashboardFlow(routes: RouteInfo[], permissions: PermissionsMatrix): FlowDiagram {
  const dashboardEdges: FlowEdge[] = [
    { from: "/app", to: "/app/properties", label: "PM/Owner" },
    { from: "/app", to: "/app/leases", label: "all personas" },
    { from: "/app", to: "/app/payments", label: "all personas" },
    { from: "/app", to: "/app/maintenance", label: "all personas" },
    { from: "/app", to: "/app/messages", label: "all personas" },
    { from: "/app", to: "/app/reports", label: "PM/Owner" },
    { from: "/app", to: "/app/settings", label: "all personas" },
  ];

  // Add nav-defined routes
  for (const entry of permissions.entries) {
    if (entry.route.startsWith("/app/") && entry.route !== "/app" && !entry.isFuture) {
      if (!dashboardEdges.some((e) => e.to === entry.route)) {
        dashboardEdges.push({
          from: "/app",
          to: entry.route,
          label: entry.personas.join(", "),
        });
      }
    }
  }

  return {
    title: "Dashboard Navigation",
    description: "Navigation paths from the main dashboard to all application sections, filtered by persona.",
    mermaid: edgesToMermaid("Dashboard Navigation", dashboardEdges),
    edges: dashboardEdges,
  };
}

function buildPropertyFlow(): FlowDiagram {
  const edges: FlowEdge[] = [
    { from: "/app", to: "/app/properties", label: "navigate" },
    { from: "/app/properties", to: "/app/units", label: "view units" },
    { from: "/app/properties", to: "/app/leases", label: "view leases" },
    { from: "/app/properties", to: "/app/maintenance", label: "maintenance" },
  ];

  return {
    title: "Property Management Flow",
    description: "Flow for property managers and owners managing properties, units, leases, and maintenance.",
    mermaid: edgesToMermaid("Property Management Flow", edges),
    edges,
  };
}

function buildMaintenanceFlow(): FlowDiagram {
  const edges: FlowEdge[] = [
    { from: "/app", to: "/app/maintenance", label: "navigate" },
    { from: "/app/maintenance", to: "/app/messages", label: "contact PM" },
  ];

  return {
    title: "Maintenance Flow",
    description: "Flow for submitting and tracking maintenance requests across all personas.",
    mermaid: edgesToMermaid("Maintenance Flow", edges),
    edges,
  };
}

function buildPaymentFlow(): FlowDiagram {
  const edges: FlowEdge[] = [
    { from: "/app", to: "/app/payments", label: "navigate" },
    { from: "/app/payments", to: "/app/leases", label: "view lease" },
  ];

  return {
    title: "Payment Flow",
    description: "Flow for viewing payment history and making payments.",
    mermaid: edgesToMermaid("Payment Flow", edges),
    edges,
  };
}

/* ── Full navigation graph (from actual code analysis) ────────── */

function buildFullNavigationGraph(routes: RouteInfo[]): FlowDiagram {
  const edges: FlowEdge[] = [];
  for (const route of routes) {
    for (const target of route.navigationTargets) {
      // Skip dynamic/parameterized targets
      if (target.includes("${") || target.includes("?")) continue;
      edges.push({ from: route.route, to: target });
    }
    if (route.isRedirect && route.redirectTarget) {
      edges.push({ from: route.route, to: route.redirectTarget, label: "redirect" });
    }
  }

  return {
    title: "Full Navigation Graph",
    description: "Complete navigation graph derived from code analysis of router.push, Link, and redirect calls.",
    mermaid: edgesToMermaid("Full Navigation Graph", edges),
    edges,
  };
}

/* ── Public API ───────────────────────────────────────────────── */

export function extractFlows(routes: RouteInfo[], permissions: PermissionsMatrix): FlowDiagram[] {
  return [
    buildLoginFlow(routes),
    buildDashboardFlow(routes, permissions),
    buildPropertyFlow(),
    buildMaintenanceFlow(),
    buildPaymentFlow(),
    buildFullNavigationGraph(routes),
  ];
}
