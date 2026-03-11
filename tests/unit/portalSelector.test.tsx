import { render, screen } from "@testing-library/react";
import PortalSelectorPage from "@/app/portal/page";

jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({ get: jest.fn() })),
}));

describe("Portal selector page", () => {
  test("renders the title", () => {
    render(<PortalSelectorPage />);
    expect(screen.getByText("Sign in to LeaseBase")).toBeInTheDocument();
  });

  test("renders Owner / Landlord Portal link", () => {
    render(<PortalSelectorPage />);
    const link = screen.getByText("Owner / Landlord Portal");
    expect(link.closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("owner"),
    );
  });

  test("does NOT render Property Manager Portal link", () => {
    render(<PortalSelectorPage />);
    // PM portal is hidden for MVP — only Owner and Tenant portals are public
    expect(screen.queryByText("Property Manager Portal")).not.toBeInTheDocument();
  });

  test("renders Tenant Portal link", () => {
    render(<PortalSelectorPage />);
    const link = screen.getByText("Tenant Portal");
    expect(link.closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("tenant"),
    );
  });

  test("renders Sign up link", () => {
    render(<PortalSelectorPage />);
    const link = screen.getByText("Sign up");
    expect(link.closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("signup"),
    );
  });
});
