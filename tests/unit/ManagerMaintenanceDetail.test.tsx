import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManagerMaintenanceDetail } from "@/app/(dashboard)/app/maintenance/[id]/_detail-views";
import type {
  MaintenanceWorkOrder,
  MaintenanceComment,
} from "@/services/maintenance/maintenanceApiService";

/* ── Mocks ── */

const mockFetchDetail = jest.fn();
const mockFetchComments = jest.fn();
const mockFetchTimeline = jest.fn();
const mockFetchAttachments = jest.fn();
const mockPostComment = jest.fn();
const mockUpdateStatus = jest.fn();
const mockAssign = jest.fn();

jest.mock("@/services/maintenance/maintenanceApiService", () => ({
  fetchMaintenanceDetail: (...args: any[]) => mockFetchDetail(...args),
  fetchMaintenanceComments: (...args: any[]) => mockFetchComments(...args),
  fetchMaintenanceTimeline: (...args: any[]) => mockFetchTimeline(...args),
  fetchMaintenanceAttachments: (...args: any[]) => mockFetchAttachments(...args),
  postMaintenanceComment: (...args: any[]) => mockPostComment(...args),
  updateMaintenanceStatus: (...args: any[]) => mockUpdateStatus(...args),
  assignMaintenanceWorkOrder: (...args: any[]) => mockAssign(...args),
  cancelMaintenanceWorkOrder: jest.fn(),
  uploadMaintenanceAttachment: jest.fn(),
  fetchVendors: jest.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "wo-1" }),
}));

jest.mock("@/lib/auth/store", () => ({
  authStore: () => ({ user: { id: "u-owner-1", name: "Dev Manager", persona: "owner" } }),
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
  organization_id: "org-1",
  unit_id: "unit-1",
  property_id: "prop-1",
  created_by_user_id: "u-tenant-1",
  tenant_user_id: "u-tenant-1",
  assignee_id: null,
  title: null,
  category: "Plumbing",
  priority: "HIGH",
  status: "SUBMITTED",
  description: "Kitchen faucet leaking badly",
  entry_permission: "WITH_NOTICE",
  contact_preference: "EMAIL",
  availability_notes: null,
  request_number: null,
  assignee_name: null,
  scheduled_date: null,
  submitted_at: "2026-03-10T12:00:00Z",
  completed_at: null,
  closed_at: null,
  cancelled_at: null,
  created_at: "2026-03-10T12:00:00Z",
  updated_at: "2026-03-10T12:00:00Z",
};

const assignedWorkOrder: MaintenanceWorkOrder = {
  ...workOrder,
  assignee_id: "u-pm-1",
};

const comments: MaintenanceComment[] = [
  {
    id: "c1",
    work_order_id: "wo-1",
    user_id: "u-pm-1",
    comment: "Plumber scheduled for tomorrow.",
    author_name: "Dev Manager",
    created_at: "2026-03-10T14:00:00Z",
  },
  {
    id: "c2",
    work_order_id: "wo-1",
    user_id: "u-tenant-1",
    comment: "Thanks, I will be home.",
    author_name: "Dev Tenant",
    created_at: "2026-03-10T15:00:00Z",
  },
];

/* ── Helpers ── */

function setupSuccess(item = workOrder, cmnts = comments) {
  mockFetchDetail.mockResolvedValue({ data: item });
  mockFetchComments.mockResolvedValue({ data: cmnts });
  mockFetchTimeline.mockResolvedValue({ data: cmnts.map((c: any) => ({
    id: c.id, type: "comment", event_type: "COMMENT_ADDED",
    actor_user_id: c.user_id, actor_name: c.author_name,
    metadata: { comment: c.comment }, created_at: c.created_at,
  })) });
  mockFetchAttachments.mockResolvedValue({ data: [] });
}

/* ── Tests ── */

beforeEach(() => {
  mockFetchDetail.mockReset();
  mockFetchComments.mockReset();
  mockFetchTimeline.mockReset();
  mockFetchAttachments.mockReset();
  mockPostComment.mockReset();
  mockUpdateStatus.mockReset();
  mockAssign.mockReset();
});

describe("ManagerMaintenanceDetail", () => {
  /* ── Loading ── */

  test("shows loading skeleton initially", () => {
    mockFetchDetail.mockReturnValue(new Promise(() => {}));
    mockFetchTimeline.mockReturnValue(new Promise(() => {}));
    mockFetchAttachments.mockReturnValue(new Promise(() => {}));
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

    // Status badge (also appears in "Submitted <date>" text)
    expect(screen.getAllByText(/Submitted/).length).toBeGreaterThanOrEqual(1);
    // Priority badge
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    // Category
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
  });

  /* ── Error state ── */

  test("shows error state on fetch failure", async () => {
    mockFetchDetail.mockRejectedValue(new Error("Network error"));
    mockFetchTimeline.mockRejectedValue(new Error("Network error"));
    mockFetchAttachments.mockRejectedValue(new Error("Network error"));
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
    // Current is SUBMITTED, so buttons for IN_REVIEW and CLOSED should appear (valid transitions)
    expect(statusGroup).toHaveTextContent("In Review");
    expect(statusGroup).toHaveTextContent("Closed");
    // SUBMITTED should NOT appear as a button (it's the current status)
    const buttons = screen.getAllByRole("button");
    const statusButtonLabels = buttons.map((b) => b.textContent);
    expect(statusButtonLabels).not.toContain("Submitted");
  });

  test("status-change button calls updateMaintenanceStatus API", async () => {
    const user = userEvent.setup();
    setupSuccess();
    const updatedWO = { ...workOrder, status: "IN_REVIEW" as const };
    mockUpdateStatus.mockResolvedValue({ data: updatedWO });
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /In Review/ }));

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith("wo-1", "IN_REVIEW");
    });
  });

  test("after status change, UI updates to reflect new status", async () => {
    const user = userEvent.setup();
    setupSuccess();
    const updatedWO = { ...workOrder, status: "CLOSED" as const };
    mockUpdateStatus.mockResolvedValue({ data: updatedWO });
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Closed/ }));

    // After update, CLOSED is terminal — no status controls should appear
    await waitFor(() => {
      expect(screen.queryByRole("group", { name: "Status controls" })).not.toBeInTheDocument();
    });
  });

  /* ── Assignment controls ── */

  test("renders assignment selector and assign button", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Assignee type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Assign/ })).toBeInTheDocument();
  });

  test("assign as self calls API with owner info", async () => {
    const user = userEvent.setup();
    setupSuccess();
    mockAssign.mockResolvedValue({ data: { ...workOrder, assignee_id: "u-owner-1", assignee_name: "Dev Manager" } });
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Assign/ }));

    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith("wo-1", expect.objectContaining({ assigneeType: "self" }));
    });
  });

  test("shows current assignee name when assigned", async () => {
    const withAssignee = { ...workOrder, assignee_id: "u-pm-1", assignee_name: "Joe Plumber" };
    setupSuccess(withAssignee);
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet leaking badly")).toBeInTheDocument();
    });

    expect(screen.getByText(/Currently assigned to/i)).toBeInTheDocument();
    expect(screen.getByText(/Joe Plumber/)).toBeInTheDocument();
  });

  /* ── Timeline / Comments ── */

  test("renders timeline with comments", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Plumber scheduled for tomorrow.")).toBeInTheDocument();
    });
    expect(screen.getByText("Thanks, I will be home.")).toBeInTheDocument();
    expect(screen.getByText(/Dev Manager/)).toBeInTheDocument();
    expect(screen.getByText(/Dev Tenant/)).toBeInTheDocument();
  });

  test("shows empty activity message when no timeline entries", async () => {
    setupSuccess(workOrder, []);
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("No activity yet.")).toBeInTheDocument();
    });
  });

  test("can add a comment", async () => {
    const user = userEvent.setup();
    setupSuccess(workOrder, []);
    mockPostComment.mockResolvedValue({
      data: {
        id: "c-new",
        work_order_id: "wo-1",
        user_id: "u-pm-1",
        comment: "Will check tomorrow",
        author_name: "Dev Manager",
        created_at: "2026-03-11T10:00:00Z",
      },
    });
    // After comment, timeline is refreshed
    mockFetchTimeline.mockResolvedValue({ data: [{
      id: "c-new", type: "comment", event_type: "COMMENT_ADDED",
      actor_user_id: "u-pm-1", actor_name: "Dev Manager",
      metadata: { comment: "Will check tomorrow" }, created_at: "2026-03-11T10:00:00Z",
    }] });
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
  });

  test("add comment via Enter key", async () => {
    const user = userEvent.setup();
    setupSuccess(workOrder, []);
    mockPostComment.mockResolvedValue({
      data: {
        id: "c-new",
        work_order_id: "wo-1",
        user_id: "u-pm-1",
        comment: "Noted",
        author_name: "Dev Manager",
        created_at: "2026-03-11T10:00:00Z",
      },
    });
    mockFetchTimeline.mockResolvedValue({ data: [] });
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

  /* ── "Assignment" label present (v2) ── */

  test("shows 'Assignment' label", async () => {
    setupSuccess();
    render(<ManagerMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Assignment")).toBeInTheDocument();
    });
  });
});
