import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OwnerMaintenancePage } from "@/app/(dashboard)/app/maintenance/_owner-list";
import type { MaintenanceWorkOrder } from "@/services/maintenance/maintenanceApiService";

/* ── Mocks ── */

const mockFetchMaintenanceList = jest.fn();
const mockFetchMaintenanceStats = jest.fn();

jest.mock("@/services/maintenance/maintenanceApiService", () => ({
  fetchMaintenanceList: (...args: any[]) => mockFetchMaintenanceList(...args),
  fetchMaintenanceStats: (...args: any[]) => mockFetchMaintenanceStats(...args),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

/* ── Fixtures ── */

const workOrders: MaintenanceWorkOrder[] = [
  {
    id: "wo-1",
    organization_id: "org-1",
    unit_id: "unit-1",
    property_id: "prop-1",
    created_by_user_id: "u-1",
    tenant_user_id: "u-1",
    assignee_id: null,
    title: null,
    category: "Plumbing",
    priority: "HIGH",
    status: "SUBMITTED",
    description: "Kitchen faucet leaking",
    entry_permission: "WITH_NOTICE",
    contact_preference: "EMAIL",
    availability_notes: null,
    request_number: "MR-20260310-0001",
    assignee_name: null,
    scheduled_date: null,
    submitted_at: "2026-03-10T12:00:00Z",
    completed_at: null,
    closed_at: null,
    cancelled_at: null,
    created_at: "2026-03-10T12:00:00Z",
    updated_at: "2026-03-10T12:00:00Z",
  },
  {
    id: "wo-2",
    organization_id: "org-1",
    unit_id: "unit-2",
    property_id: "prop-1",
    created_by_user_id: "u-2",
    tenant_user_id: "u-2",
    assignee_id: "u-pm-1",
    title: null,
    category: "HVAC",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    description: "AC not cooling properly",
    entry_permission: "WITH_NOTICE",
    contact_preference: "EMAIL",
    availability_notes: null,
    request_number: "MR-20260309-0002",
    assignee_name: null,
    scheduled_date: null,
    submitted_at: "2026-03-09T10:00:00Z",
    completed_at: null,
    closed_at: null,
    cancelled_at: null,
    created_at: "2026-03-09T10:00:00Z",
    updated_at: "2026-03-10T08:00:00Z",
  },
];

function paginatedResponse(data: MaintenanceWorkOrder[]) {
  return {
    data,
    meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
  };
}

/* ── Tests ── */

beforeEach(() => {
  mockFetchMaintenanceList.mockReset();
  mockFetchMaintenanceStats.mockReset();
  mockFetchMaintenanceStats.mockResolvedValue({ data: { submitted: 1, in_review: 0, scheduled: 0, in_progress: 1, completed: 0, closed: 0, cancelled: 0 } });
});

describe("OwnerMaintenancePage", () => {
  test("shows loading skeleton initially", () => {
    mockFetchMaintenanceList.mockReturnValue(new Promise(() => {})); // never resolves
    render(<OwnerMaintenancePage />);
    expect(screen.getByLabelText("Loading work orders")).toBeInTheDocument();
  });

  test("renders work order list with description, badges, and category", async () => {
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse(workOrders));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking")).toBeInTheDocument();
    });
    expect(screen.getByText("AC not cooling properly")).toBeInTheDocument();

    // Status badges ("Submitted" may appear in badge + filter option)
    expect(screen.getAllByText(/Submitted/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThanOrEqual(1);

    // Priority badges
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();

    // Categories
    expect(screen.getByText(/Plumbing/)).toBeInTheDocument();
    expect(screen.getByText(/HVAC/)).toBeInTheDocument();

  });

  test("rows link to detail page", async () => {
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse(workOrders));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking")).toBeInTheDocument();
    });

    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/app/maintenance/wo-1");
    expect(hrefs).toContain("/app/maintenance/wo-2");
  });

  test("shows empty state when no work orders", async () => {
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse([]));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("No work orders")).toBeInTheDocument();
    });
    expect(screen.getByText("No maintenance requests have been submitted yet.")).toBeInTheDocument();
  });

  test("shows contextual empty state when filters active", async () => {
    const user = userEvent.setup();
    // Initial load
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse(workOrders));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking")).toBeInTheDocument();
    });

    // Apply status filter → returns empty
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse([]));
    await user.selectOptions(screen.getByLabelText("Filter by status"), "COMPLETED");

    await waitFor(() => {
      expect(screen.getByText("No work orders match the current filters.")).toBeInTheDocument();
    });
  });

  test("shows error state on fetch failure", async () => {
    mockFetchMaintenanceList.mockRejectedValue(new Error("Network error"));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  test("renders filter controls for status, priority, and search", async () => {
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse(workOrders));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Search work orders")).toBeInTheDocument();
  });

  test("status filter triggers refetch with correct param", async () => {
    const user = userEvent.setup();
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse(workOrders));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking")).toBeInTheDocument();
    });

    mockFetchMaintenanceList.mockClear();
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse([workOrders[0]]));

    await user.selectOptions(screen.getByLabelText("Filter by status"), "SUBMITTED");

    await waitFor(() => {
      expect(mockFetchMaintenanceList).toHaveBeenCalledWith(
        expect.objectContaining({ status: "SUBMITTED" }),
      );
    });
  });

  test("priority filter triggers refetch with correct param", async () => {
    const user = userEvent.setup();
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse(workOrders));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking")).toBeInTheDocument();
    });

    mockFetchMaintenanceList.mockClear();
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse([workOrders[0]]));

    await user.selectOptions(screen.getByLabelText("Filter by priority"), "HIGH");

    await waitFor(() => {
      expect(mockFetchMaintenanceList).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "HIGH" }),
      );
    });
  });

  test("search triggers refetch on Enter", async () => {
    const user = userEvent.setup();
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse(workOrders));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking")).toBeInTheDocument();
    });

    mockFetchMaintenanceList.mockClear();
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse([workOrders[0]]));

    const searchInput = screen.getByLabelText("Search work orders");
    await user.type(searchInput, "faucet{Enter}");

    await waitFor(() => {
      expect(mockFetchMaintenanceList).toHaveBeenCalledWith(
        expect.objectContaining({ search: "faucet" }),
      );
    });
  });

  test("does NOT render status-change or assignment controls", async () => {
    mockFetchMaintenanceList.mockResolvedValue(paginatedResponse(workOrders));
    render(<OwnerMaintenancePage />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /In Review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Completed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Closed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /assign/i })).not.toBeInTheDocument();
  });

});
