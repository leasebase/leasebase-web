/**
 * AppHeader — shell structure tests.
 *
 * Verifies the post-refactor contract:
 *  - Messages trigger lives in the header
 *  - Notifications trigger lives in the header
 *  - A single user/account menu trigger exists
 *  - No breadcrumb <nav> is rendered
 *  - User menu contains Settings and Sign out (no duplicate destinations)
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderHeader() {
  return render(<AppHeader />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AppHeader — top-right controls", () => {
  test("renders a Messages link pointing to /app/messages", () => {
    renderHeader();
    const link = screen.getByRole("link", { name: /messages/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/app/messages");
  });

  test("renders a Notifications link pointing to /app/notifications", () => {
    renderHeader();
    const link = screen.getByRole("link", { name: /notifications/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/app/notifications");
  });

  test("renders exactly one user/account menu trigger", () => {
    renderHeader();
    const userMenuTriggers = screen.getAllByRole("button", { name: /user menu/i });
    expect(userMenuTriggers).toHaveLength(1);
  });
});

describe("AppHeader — breadcrumbs absent", () => {
  test("does not render a breadcrumb navigation element", () => {
    renderHeader();
    // The old HeaderBreadcrumbs used aria-label="Breadcrumb"
    expect(screen.queryByRole("navigation", { name: /breadcrumb/i })).toBeNull();
  });

  test("does not render Home breadcrumb link", () => {
    renderHeader();
    // If breadcrumbs were present, there would be a 'Home' link inside them.
    // The Leasebase logo link is NOT a breadcrumb; this asserts no extra 'Home' link.
    const homeLinks = screen.queryAllByRole("link", { name: /^home$/i });
    expect(homeLinks).toHaveLength(0);
  });
});

describe("AppHeader — user menu items", () => {
  test("user menu contains Settings after opening", async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: /settings/i })).toBeInTheDocument();
  });

  test("user menu contains Sign out after opening", async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
  });

  test("user menu contains Profile item (Phase 3: moved from sidebar)", async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: /^profile$/i })).toBeInTheDocument();
  });

  test("user menu does NOT contain Billing item (no route yet)", async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await user.click(trigger);
    expect(screen.queryByRole("menuitem", { name: /billing/i })).toBeNull();
  });

  test("user menu has exactly three items: Profile, Settings, Sign out", async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await user.click(trigger);
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(3);
  });
});
