import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LeaseRow } from "@/services/leases/types";
import type { TenantInvitation } from "@/services/invitations/invitationApiService";

/* ── Mocks ── */

const mockFetchLease = jest.fn();
const mockUpdateLease = jest.fn();
const mockTerminateLease = jest.fn();
const mockRenewLease = jest.fn();

jest.mock("@/services/leases/leaseService", () => ({
  fetchLease: (...args: any[]) => mockFetchLease(...args),
  updateLease: (...args: any[]) => mockUpdateLease(...args),
  terminateLease: (...args: any[]) => mockTerminateLease(...args),
  renewLease: (...args: any[]) => mockRenewLease(...args),
}));

const mockFetchPendingInvitationsForUnit = jest.fn();
const mockResendInvitation = jest.fn();

jest.mock("@/services/invitations/invitationApiService", () => ({
  fetchPendingInvitationsForUnit: (...args: any[]) =>
    mockFetchPendingInvitationsForUnit(...args),
  resendInvitation: (...args: any[]) => mockResendInvitation(...args),
  InvitationApiError: class extends Error {
    code: string;
    status: number;
    constructor(msg: string, code: string, status: number) {
      super(msg);
      this.code = code;
      this.status = status;
    }
  },
}));

// Mock InviteTenantModal to simplify tests — just render a marker when open.
jest.mock("@/components/invitations/InviteTenantModal", () => ({
  InviteTenantModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="invite-modal">Invite Modal</div> : null,
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "lease-1" }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

jest.mock("@/lib/auth/store", () => ({
  authStore: () => ({ user: { persona: "owner" } }),
}));

/* ── Fixtures ── */

const now = new Date().toISOString();

function makeLease(overrides: Partial<LeaseRow> = {}): LeaseRow {
  return {
    id: "lease-1",
    org_id: "org-1",
    property_id: "p1",
    unit_id: "u1",
    term_type: "TWELVE_MONTH",
    status: "DRAFT",
    start_date: "2026-01-01T00:00:00Z",
    end_date: "2026-12-31T00:00:00Z",
    rent_amount: 150000,
    security_deposit: 200000,
    lease_terms: null,
    created_at: now,
    updated_at: now,
    property_name: "Sunset Apartments",
    unit_number: "101",
    tenants: [],
    ...overrides,
  };
}

const pendingInvitation: TenantInvitation = {
  id: "inv-1",
  organization_id: "org-1",
  property_id: "p1",
  unit_id: "u1",
  invited_email: "jane@example.com",
  invited_first_name: "Jane",
  invited_last_name: "Smith",
  status: "PENDING",
  expires_at: "2026-04-01T00:00:00Z",
  created_at: now,
};

/* ── Lazy import (must come after jest.mock) ── */

let Page: () => React.JSX.Element;
beforeAll(async () => {
  const mod = await import("@/app/(dashboard)/app/leases/[id]/page");
  Page = mod.default;
});

/* ── Helpers ── */

function setup(lease: LeaseRow, invitations: TenantInvitation[] = []) {
  mockFetchLease.mockResolvedValue({ data: lease });
  mockFetchPendingInvitationsForUnit.mockResolvedValue(invitations);
}

/* ── Tests ── */

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Lease detail — invite action visibility", () => {
  test("DRAFT lease with no tenants shows Invite Tenant button", async () => {
    setup(makeLease({ status: "DRAFT", tenants: [] }));
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Invite Tenant")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Re-send Invite")).not.toBeInTheDocument();
  });

  test("DRAFT lease WITH tenants does NOT show Invite Tenant", async () => {
    setup(
      makeLease({
        status: "DRAFT",
        tenants: [{ id: "t1", name: "Bob", role: "PRIMARY" }],
      }),
    );
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Sunset Apartments")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Invite Tenant")).not.toBeInTheDocument();
  });

  test("ASSIGNED lease with pending invitation shows Re-send Invite", async () => {
    setup(
      makeLease({
        status: "ASSIGNED",
        tenants: [{ id: "t1", name: "Jane Smith", role: "PRIMARY" }],
      }),
      [pendingInvitation],
    );
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Re-send Invite")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Invite Tenant")).not.toBeInTheDocument();
    // Also shows pending status text
    expect(
      screen.getByText(/Invitation pending.*jane@example\.com/),
    ).toBeInTheDocument();
  });

  test("INVITED lease with pending invitation shows Re-send Invite", async () => {
    setup(makeLease({ status: "INVITED", tenants: [] }), [
      pendingInvitation,
    ]);
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Re-send Invite")).toBeInTheDocument(),
    );
  });

  test("ACTIVE lease shows neither invite action", async () => {
    setup(makeLease({ status: "ACTIVE", tenants: [{ id: "t1", name: "Jane", role: "PRIMARY" }] }));
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Terminate")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Invite Tenant")).not.toBeInTheDocument();
    expect(screen.queryByText("Re-send Invite")).not.toBeInTheDocument();
  });

  test("INACTIVE lease shows neither invite action", async () => {
    setup(makeLease({ status: "INACTIVE", tenants: [] }));
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Sunset Apartments")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Invite Tenant")).not.toBeInTheDocument();
    expect(screen.queryByText("Re-send Invite")).not.toBeInTheDocument();
  });

  test("RENEWED lease shows neither invite action", async () => {
    setup(makeLease({ status: "RENEWED", tenants: [] }));
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Sunset Apartments")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Invite Tenant")).not.toBeInTheDocument();
    expect(screen.queryByText("Re-send Invite")).not.toBeInTheDocument();
  });
});

describe("Lease detail — invite actions", () => {
  test("Invite Tenant button opens InviteTenantModal", async () => {
    const user = userEvent.setup();
    setup(makeLease({ status: "DRAFT", tenants: [] }));
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Invite Tenant")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("Invite Tenant"));
    expect(screen.getByTestId("invite-modal")).toBeInTheDocument();
  });

  test("Re-send Invite calls resendInvitation", async () => {
    const user = userEvent.setup();
    mockResendInvitation.mockResolvedValue({
      data: { id: "inv-1", status: "PENDING", expires_at: now },
    });
    setup(
      makeLease({ status: "ASSIGNED", tenants: [{ id: "t1", name: "Jane", role: "PRIMARY" }] }),
      [pendingInvitation],
    );
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Re-send Invite")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("Re-send Invite"));
    await waitFor(() =>
      expect(mockResendInvitation).toHaveBeenCalledWith("inv-1"),
    );
  });
});
