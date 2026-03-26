/**
 * AppHeader — shell structure tests (Figma design).
 *
 * Verifies the minimal header contract:
 *  - Search bar present
 *  - Notifications bell present
 *  - No messages link (moved to sidebar/removed)
 *  - No user menu (user profile in sidebar footer)
 *  - No breadcrumbs
 */

import { render, screen } from "@testing-library/react";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/app",
}));

jest.mock("@/lib/auth/store", () => ({
  authStore: Object.assign(
    () => ({ user: { name: "Alice Tester", email: "alice@example.com", persona: "owner" } }),
    {
      getState: () => ({ logout: jest.fn() }),
    },
  ),
}));

jest.mock("@/components/layout/AppShell", () => ({
  useAppShell: () => ({
    mobileOpen: false,
    setMobileOpen: jest.fn(),
    hamburgerRef: { current: null },
  }),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { AppHeader } from "@/components/layout/AppHeader";

function renderHeader() {
  return render(<AppHeader />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AppHeader — Figma minimal header", () => {
  test("renders search input with Figma placeholder", () => {
    renderHeader();
    expect(screen.getByPlaceholderText(/search properties, tenants, leases/i)).toBeInTheDocument();
  });

  test("renders a Notifications link pointing to /app/notifications", () => {
    renderHeader();
    const link = screen.getByRole("link", { name: /notifications/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/app/notifications");
  });

  test("does NOT render a Messages link (per Figma)", () => {
    renderHeader();
    expect(screen.queryByRole("link", { name: /messages/i })).toBeNull();
  });

  test("does NOT render a user menu trigger (user profile in sidebar)", () => {
    renderHeader();
    expect(screen.queryByRole("button", { name: /user menu/i })).toBeNull();
  });

  test("does not render breadcrumbs", () => {
    renderHeader();
    expect(screen.queryByRole("navigation", { name: /breadcrumb/i })).toBeNull();
  });
});
