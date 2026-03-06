import type { RouteInfo } from "./extractRoutes.js";
import type { PermissionsMatrix } from "./extractPermissions.js";

/* ── Types ────────────────────────────────────────────────────── */

export interface UseCase {
  title: string;
  category: string;
  actors: string[];
  entryPoint: string;
  preconditions: string[];
  steps: string[];
  alternateFlows: string[];
  errors: string[];
  permissions: string[];
  apiDependencies: string[];
}

/* ── Helpers ──────────────────────────────────────────────────── */

function personaToActor(p: string): string {
  const map: Record<string, string> = {
    propertyManager: "Property Manager",
    owner: "Property Owner",
    tenant: "Tenant",
    agent: "Agent",
    vendor: "Vendor",
    public: "Unauthenticated User",
    authenticated: "Authenticated User",
  };
  return map[p] || p;
}

function findRouteInfo(routes: RouteInfo[], path: string): RouteInfo | undefined {
  return routes.find((r) => r.route === path);
}

/* ── Use case definitions ─────────────────────────────────────── */

function buildAuthUseCases(routes: RouteInfo[]): UseCase[] {
  const loginRoute = findRouteInfo(routes, "/auth/login");
  const registerRoute = findRouteInfo(routes, "/auth/register");
  const verifyRoute = findRouteInfo(routes, "/auth/verify-email");

  return [
    {
      title: "Login",
      category: "Authentication",
      actors: ["Unauthenticated User"],
      entryPoint: "/auth/login",
      preconditions: ["User has a registered account", "User email is verified"],
      steps: [
        "User navigates to /auth/login",
        "User enters email and password",
        "User clicks Sign In",
        "System authenticates via backend /auth/login API",
        "On success, user is redirected to /app (dashboard)",
      ],
      alternateFlows: [
        "Dev bypass: user selects role and clicks dev bypass button (local/dev only)",
        "Social login: user clicks social login button (not yet implemented)",
        "User clicks Sign Up to navigate to /auth/register",
      ],
      errors: [
        "Invalid credentials → error message displayed",
        "Network error → generic error message",
        "Unverified email → user prompted to verify",
      ],
      permissions: ["public"],
      apiDependencies: loginRoute?.apiCalls || ["/auth/login"],
    },
    {
      title: "Register",
      category: "Authentication",
      actors: ["Unauthenticated User"],
      entryPoint: "/auth/register",
      preconditions: ["User does not already have an account"],
      steps: [
        "User navigates to /auth/register",
        "Step 1: User selects user type (Property Manager, Owner, or Tenant)",
        "Step 2: User fills in name, email, password, confirm password",
        "User clicks Create Account",
        "System calls backend /auth/register API",
        "On success, user is redirected to /auth/verify-email",
      ],
      alternateFlows: [
        "User already confirmed → redirect to login with success message",
        "User clicks Back to return to user type selection",
        "User clicks Sign In to go to login page",
      ],
      errors: [
        "Passwords don't match → client-side validation error",
        "Password too short → client-side validation error",
        "Email already registered → API error message",
        "Registration failed → generic error message",
      ],
      permissions: ["public"],
      apiDependencies: registerRoute?.apiCalls || ["/auth/register"],
    },
    {
      title: "Verify Email",
      category: "Authentication",
      actors: ["Unauthenticated User"],
      entryPoint: "/auth/verify-email",
      preconditions: ["User has just registered", "Verification code sent to email"],
      steps: [
        "User navigates to /auth/verify-email (auto-populated with email from registration)",
        "User enters 6-digit verification code from email",
        "User clicks Verify Email",
        "System calls backend /auth/confirm-email API",
        "On success, user is redirected to /auth/login with verified message",
      ],
      alternateFlows: [
        "User clicks Resend Code to get a new verification code",
        "User clicks Back to Sign In to return to login",
      ],
      errors: [
        "Invalid code → error message displayed",
        "Expired code → user should resend",
        "Network error → generic error message",
      ],
      permissions: ["public"],
      apiDependencies: verifyRoute?.apiCalls || ["/auth/confirm-email", "/auth/resend-confirmation"],
    },
  ];
}

function buildDashboardUseCases(routes: RouteInfo[], permissions: PermissionsMatrix): UseCase[] {
  const appRoute = findRouteInfo(routes, "/app");
  const dashboardPersonas = permissions.entries.find((e) => e.route === "/app")?.personas || [
    "propertyManager",
    "owner",
    "tenant",
  ];

  return [
    {
      title: "View Dashboard",
      category: "Dashboard",
      actors: dashboardPersonas.map(personaToActor),
      entryPoint: "/app",
      preconditions: ["User is authenticated"],
      steps: [
        "User navigates to /app",
        "System loads persona-specific dashboard (PM, Owner, or Tenant)",
        "Dashboard displays KPIs, tasks, and recent activity",
        "User can navigate to any section via the sidebar",
      ],
      alternateFlows: [
        "Property Manager sees portfolio overview with properties, units, occupancy, and revenue",
        "Owner sees income tracking, property summary, and lease status",
        "Tenant sees rent status, maintenance requests, and messages",
      ],
      errors: [
        "Unauthenticated → redirected to /auth/login",
        "Session expired → redirected to /auth/login",
      ],
      permissions: dashboardPersonas,
      apiDependencies: ["/auth/me"],
    },
  ];
}

function buildCrudUseCases(permissions: PermissionsMatrix): UseCase[] {
  const sections = [
    {
      title: "View Properties",
      category: "Properties",
      route: "/app/properties",
      steps: [
        "User navigates to /app/properties",
        "System displays list of properties",
        "User can view property details, units, and leases",
      ],
    },
    {
      title: "View Leases",
      category: "Leases",
      route: "/app/leases",
      steps: [
        "User navigates to /app/leases",
        "System displays list of leases",
        "User can view lease details, terms, and associated tenants",
      ],
    },
    {
      title: "Submit Maintenance Request",
      category: "Maintenance",
      route: "/app/maintenance",
      steps: [
        "User navigates to /app/maintenance",
        "User creates a new maintenance request",
        "System submits request to backend",
        "Request appears in the maintenance queue",
      ],
    },
    {
      title: "View Payment History",
      category: "Payments",
      route: "/app/payments",
      steps: [
        "User navigates to /app/payments",
        "System displays payment history and upcoming payments",
        "User can view payment details and receipts",
      ],
    },
    {
      title: "View Documents",
      category: "Documents",
      route: "/app/leases",
      steps: [
        "User navigates to lease or property details",
        "System displays associated documents",
        "User can download or view documents",
      ],
    },
    {
      title: "View Reports",
      category: "Reporting",
      route: "/app/reports",
      steps: [
        "User navigates to /app/reports",
        "System displays available reports",
        "User can generate and export reports",
      ],
    },
  ];

  return sections.map((section) => {
    const entry = permissions.entries.find((e) => e.route === section.route);
    const personas = entry?.personas || ["authenticated"];
    return {
      title: section.title,
      category: section.category,
      actors: personas.map(personaToActor),
      entryPoint: section.route,
      preconditions: ["User is authenticated", `User has ${personas.join(" or ")} persona`],
      steps: section.steps,
      alternateFlows: ["Data not found → empty state displayed"],
      errors: [
        "Unauthorized → redirected to login",
        "API error → error toast displayed",
      ],
      permissions: personas,
      apiDependencies: [],
    };
  });
}

/* ── Public API ───────────────────────────────────────────────── */

export function extractUseCases(routes: RouteInfo[], permissions: PermissionsMatrix): UseCase[] {
  return [
    ...buildAuthUseCases(routes),
    ...buildDashboardUseCases(routes, permissions),
    ...buildCrudUseCases(permissions),
  ];
}
