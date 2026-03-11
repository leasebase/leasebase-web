import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManagerMaintenanceDetail } from "@/app/(dashboard)/app/maintenance/[id]/page";
import type {
  MaintenanceWorkOrder,
  MaintenanceComment,
} from "@/services/maintenance/maintenanceApiService";

/* ── Mocks ── */

const mockFetchDetail = jest.fn();
const mockFetchComments = jest.fn();
const mockPostComment = jest.fn();
const mockUpdateStatus = jest.fn();
const mockAssign = jest.fn();

jest.mock("@/services/maintenance/maintenanceApiService", () => ({
  fetchMaintenanceDetail: (...args: any[]) => mockFetchDetail(...args),
  fetchMaintenanceComments: (...args: any[]) => mockFetchComments(...args),
  postMaintenanceComment: (...args: any[]) => mockPostComment(...args),
  updateMaintenanceStatus: (...args: any[]) => mockUpdateStatus(...args),
  assignMaintenanceWorkOrder: (...args: any[]) => mockAssign(...args),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "wo-1" }),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return { __esModule: true, default: MockLink };
});

/* ── Fixtures ── */

const workOrder: MaintenanceWorkOrder = {
  id: "wo-1",
  organizationId: "org-1",
  unitId: "unit-1",
  createdByUserId: "u-tenant-1",
  tenantUserId: "u-tenant-1",
  assigneeId: null,
  category: "Plumbing",
  priority: "HIGH",
  status: "OPEN",
  description: "Kitchen faucet leaking badly",
  propertyId: "prop-1",
  createdAt: "2026-03-10T12:00:00Z",
  updatedAt: "2026-03-10T12:00:00Z",
};

const assignedWorkOrder: MaintenanceWorkOrder = {
  ...workOrder,
  assigneeId: "u-pm-1",
};

const comments: MaintenanceComment[] = [
  {
    id: "c1",
    workOrderId: "wo-1",
    userId: "u-pm-1",
    comment: "Plumber scheduled for tomorrow.",
    authorName: "Dev Manager",
    createdAt: "2026-03-10T14:00:00Z",
  },
  {
    id: "c2",
    workOrderId: "wo-1",
    userId: "u-tenant-1",
    comment: "Thanks, I will be home.",
    authorName: "Dev Tenant",
    createdAt: "2026-03-10T15:00:00Z",
  },
];

/* ── Helpers ── */

function setupSuccess(item = workOrder, cmnts = comments) {
  mockFetchDetail.mockResolvedValue({ data: item });
  mockFetchComments.mockResolvedValue({ data: cmnts });
}

/* ── Tests ── */

beforeEach(() => {
  mockFetchDetail.mockReset();
  mockFetchComments.mockReset();
  mockPostComment.mockReset();
  mockUpdateStatus.mockReset();
  mockAssign.mockReset();
});

describe("ManagerMaintenanceDetail", () => {
  /* ── Loading ── */

  test("shows loading skeleton initially", () => {
    mockFetchDetail.mockReturnValue(new Promise(() => {}));
    mockFetchComments.mockReturnValue(new Promise(() => {}));
    render(<ManagerMaintenanceDetail />);
    expect(screen.getByLabelText("Loading work order")).toBeInTheDocument();
  });

  /* ── Metadata render ── */

  test("renders work order metadata: description, status, priority, category, date", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    // Status badge
    expect(screen.getByText("OPEN")).toBeInTheDocument();
    // Priority badge
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    // Category
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    // Submitted date
    expect(screen.getByText(/Submitted/)).toBeInTheDocument();
  });

  /* ── Error state ── */

  test("shows error state on fetch failure", async () => {
    mockFetchDetail.mockRejectedValue(new Error("Network error"));
    mockFetchComments.mockRejectedValue(new Error("Network error"));
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  /* ── Status controls ── */

  test("renders status-change buttons for all statuses except current", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    const statusGroup = screen.getByRole("group", { name: "Status controls" });
    // Current is OPEN, so buttons for IN_PROGRESS, RESOLVED, CLOSED should appear
    expect(statusGroup).toHaveTextContent("IN PROGRESS");
    expect(statusGroup).toHaveTextContent("RESOLVED");
    expect(statusGroup).toHaveTextContent("CLOSED");
    // OPEN should NOT appear as a button (it's the current status)
    const buttons = screen.getAllByRole("button");
    const statusButtonLabels = buttons.map((b) => b.textContent);
    expect(statusButtonLabels).not.toContain("OPEN");
  });

  test("status-change button calls updateMaintenanceStatus API", async () => {
    const user = userEvent.setup();
    setupSuccess();
    const updatedWO = { ...workOrder, status: "IN_PROGRESS" as const };
    mockUpdateStatus.mockResolvedValue({ data: updatedWO });
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /IN PROGRESS/ }));

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith("wo-1", "IN_PROGRESS");
    });
  });

  test("after status change, UI updates to reflect new status", async () => {
    const user = userEvent.setup();
    setupSuccess();
    const updatedWO = { ...workOrder, status: "RESOLVED" as const };
    mockUpdateStatus.mockResolvedValue({ data: updatedWO });
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /RESOLVED/ }));

    // After update, RESOLVED should be the badge (not a button), and OPEN should appear as a button
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /OPEN/ })).toBeInTheDocument();
    });
  });

  /* ── Assignment controls ── */

  test("renders assignment input and assign button", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Assignee ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Assign/ })).toBeInTheDocument();
  });

  test("assign button calls assignMaintenanceWorkOrder API", async () => {
    const user = userEvent.setup();
    setupSuccess();
    mockAssign.mockResolvedValue({ data: { ...workOrder, assigneeId: "u-pm-2" } });
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    const input = screen.getByLabelText("Assignee ID");
    await user.clear(input);
    await user.type(input, "u-pm-2");
    await user.click(screen.getByRole("button", { name: /Assign/ }));

    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith("wo-1", "u-pm-2");
    });
  });

  test("shows current assignee when assigned", async () => {
    setupSuccess(assignedWorkOrder);
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    expect(screen.getByText(/Currently assigned: u-pm-1/)).toBeInTheDocument();
  });

  test("assignment input pre-fills with current assigneeId", async () => {
    setupSuccess(assignedWorkOrder);
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Assignee ID")).toHaveValue("u-pm-1");
  });

  /* ── Comments ── */

  test("renders comments thread", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Plumber scheduled for tomorrow.")).toBeInTheDocument();
    });
    expect(screen.getByText("Thanks, I will be home.")).toBeInTheDocument();
    expect(screen.getByText(/Dev Manager/)).toBeInTheDocument();
    expect(screen.getByText(/Dev Tenant/)).toBeInTheDocument();
  });

  test("shows empty comments message when none exist", async () => {
    setupSuccess(workOrder, []);
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("No comments yet.")).toBeInTheDocument();
    });
  });

  test("can add a comment", async () => {
    const user = userEvent.setup();
    setupSuccess(workOrder, []);
    mockPostComment.mockResolvedValue({
      data: {
        id: "c-new",
        workOrderId: "wo-1",
        userId: "u-pm-1",
        comment: "Will check tomorrow",
        authorName: "Dev Manager",
        createdAt: "2026-03-11T10:00:00Z",
      },
    });
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    const input = screen.getByLabelText("Add a comment");
    await user.type(input, "Will check tomorrow");
    await user.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(mockPostComment).toHaveBeenCalledWith("wo-1", "Will check tomorrow");
    });
    expect(screen.getByText("Will check tomorrow")).toBeInTheDocument();
  });

  test("add comment via Enter key", async () => {
    const user = userEvent.setup();
    setupSuccess(workOrder, []);
    mockPostComment.mockResolvedValue({
      data: {
        id: "c-new",
        workOrderId: "wo-1",
        userId: "u-pm-1",
        comment: "Noted",
        authorName: "Dev Manager",
        createdAt: "2026-03-11T10:00:00Z",
      },
    });
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    const input = screen.getByLabelText("Add a comment");
    await user.type(input, "Noted{Enter}");

    await waitFor(() => {
      expect(mockPostComment).toHaveBeenCalledWith("wo-1", "Noted");
    });
  });

  /* ── "Change status" label present ── */

  test("shows 'Change status' label", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Change status")).toBeInTheDocument();
    });
  });

  /* ── "Assignee" label present ── */

  test("shows 'Assignee' label", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Assignee")).toBeInTheDocument();
    });
  });
});
