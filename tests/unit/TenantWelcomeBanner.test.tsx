import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TenantWelcomeBanner } from "@/components/dashboards/tenant/TenantWelcomeBanner";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

function recentDate(): string {
  return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
}

function oldDate(): string {
  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days ago
}

describe("TenantWelcomeBanner", () => {
  it("renders when profile is recent and not dismissed", () => {
    render(<TenantWelcomeBanner userId="user-1" profileCreatedAt={recentDate()} />);
    expect(screen.getByText("Welcome to LeaseBase!")).toBeInTheDocument();
  });

  it("does not render when profile is older than 7 days", () => {
    render(<TenantWelcomeBanner userId="user-1" profileCreatedAt={oldDate()} />);
    expect(screen.queryByText("Welcome to LeaseBase!")).not.toBeInTheDocument();
  });

  it("does not render when already dismissed for this user", () => {
    localStorageMock.setItem("lb_tenant_welcome_dismissed_user-1", "1");
    render(<TenantWelcomeBanner userId="user-1" profileCreatedAt={recentDate()} />);
    expect(screen.queryByText("Welcome to LeaseBase!")).not.toBeInTheDocument();
  });

  it("dismissal is user-specific — different user still sees banner", () => {
    localStorageMock.setItem("lb_tenant_welcome_dismissed_user-1", "1");
    render(<TenantWelcomeBanner userId="user-2" profileCreatedAt={recentDate()} />);
    expect(screen.getByText("Welcome to LeaseBase!")).toBeInTheDocument();
  });

  it("clicking dismiss hides the banner and persists to localStorage", () => {
    render(<TenantWelcomeBanner userId="user-1" profileCreatedAt={recentDate()} />);
    expect(screen.getByText("Welcome to LeaseBase!")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss welcome banner"));

    expect(screen.queryByText("Welcome to LeaseBase!")).not.toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "lb_tenant_welcome_dismissed_user-1",
      "1",
    );
  });

  it("renders quick-start suggestions", () => {
    render(<TenantWelcomeBanner userId="user-1" profileCreatedAt={recentDate()} />);
    expect(screen.getByText("Review your lease")).toBeInTheDocument();
    expect(screen.getByText("Complete your profile")).toBeInTheDocument();
    expect(screen.getByText("Submit a maintenance request")).toBeInTheDocument();
  });
});
