import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TenantMaintenanceDetail } from "@/app/(dashboard)/app/maintenance/[id]/_detail-views";
import type { WorkOrderRow, WorkOrderCommentRow, DomainResult } from "@/services/tenant/types";

/* ── Mocks ── */

const mockFetchDetail = jest.fn<Promise<DomainResult<WorkOrderRow | null>>, [string]>();
const mockFetchComments = jest.fn<Promise<DomainResult<WorkOrderCommentRow[]>>, [string]>();
const mockFetchTimeline = jest.fn();
const mockFetchAttachments = jest.fn();
const mockAddComment = jest.fn<Promise<WorkOrderCommentRow>, [string, string]>();

jest.mock("@/services/tenant/adapters/maintenanceAdapter", () => ({
  fetchMaintenanceDetail: (...args: any[]) => mockFetchDetail(args[0]),
  fetchMaintenanceComments: (...args: any[]) => mockFetchComments(args[0]),
  fetchMaintenanceTimeline: (...args: any[]) => mockFetchTimeline(args[0]),
  fetchMaintenanceAttachments: (...args: any[]) => mockFetchAttachments(args[0]),
  addMaintenanceComment: (...args: any[]) => mockAddComment(args[0], args[1]),
  cancelMaintenanceRequest: jest.fn(),
  uploadMaintenanceAttachment: jest.fn(),
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

const workOrder: WorkOrderRow = {
  id: "wo-1",
  organization_id: "org-1",
  unit_id: "unit-1",
  property_id: "prop-1",
  created_by_user_id: "u-tenant-1",
  tenant_user_id: "u-tenant-1",
  title: null,
  category: "Plumbing",
  priority: "HIGH",
  status: "SUBMITTED",
  description: "Kitchen faucet is leaking badly",
  entry_permission: "WITH_NOTICE",
  contact_preference: "EMAIL",
  availability_notes: null,
  request_number: null,
  assignee_id: null,
  assignee_name: null,
  scheduled_date: null,
  submitted_at: "2026-03-10T12:00:00Z",
  completed_at: null,
  closed_at: null,
  cancelled_at: null,
  created_at: "2026-03-10T12:00:00Z",
  updated_at: "2026-03-10T12:00:00Z",
};

const comments: WorkOrderCommentRow[] = [
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

function successDetail(data: WorkOrderRow): DomainResult<WorkOrderRow | null> {
  return { data, source: "live", error: null };
}
function successComments(data: WorkOrderCommentRow[]): DomainResult<WorkOrderCommentRow[]> {
  return { data, source: "live", error: null };
}
function errorResult<T>(fallback: T, msg: string): DomainResult<T> {
  return { data: fallback, source: "unavailable", error: msg };
}

/* ── Tests ── */

beforeEach(() => {
  mockFetchDetail.mockReset();
  mockFetchComments.mockReset();
  mockFetchTimeline.mockReset();
  mockFetchAttachments.mockReset();
  mockAddComment.mockReset();
  // Default v2 mocks
  mockFetchTimeline.mockResolvedValue({ data: [], source: "live", error: null });
  mockFetchAttachments.mockResolvedValue({ data: [], source: "live", error: null });
});

describe("TenantMaintenanceDetail", () => {
  test("shows loading skeleton initially", () => {
    mockFetchDetail.mockReturnValue(new Promise(() => {}));
    mockFetchTimeline.mockReturnValue(new Promise(() => {}));
    mockFetchAttachments.mockReturnValue(new Promise(() => {}));
    render(<TenantMaintenanceDetail />);
    expect(screen.getByLabelText("Loading work order")).toBeInTheDocument();
  });

  test("renders work order detail with description, status, priority, category, and date", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockFetchTimeline.mockResolvedValue({ data: comments.map((c: any) => ({ id: c.id, type: "comment", event_type: "COMMENT_ADDED", actor_user_id: c.user_id, actor_name: c.author_name, metadata: { comment: c.comment }, created_at: c.created_at })), source: "live", error: null });
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet is leaking badly")).toBeInTheDocument();
    });

    // Status badge (also appears in "Submitted <date>" text)
    expect(screen.getAllByText(/Submitted/).length).toBeGreaterThanOrEqual(1);
    // Priority badge
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    // Category
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
  });

  test("renders timeline with comments", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockFetchTimeline.mockResolvedValue({ data: comments.map((c: any) => ({ id: c.id, type: "comment", event_type: "COMMENT_ADDED", actor_user_id: c.user_id, actor_name: c.author_name, metadata: { comment: c.comment }, created_at: c.created_at })), source: "live", error: null });
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Plumber scheduled for tomorrow.")).toBeInTheDocument();
    });
    expect(screen.getByText("Thanks, I will be home.")).toBeInTheDocument();
    expect(screen.getByText(/Dev Manager/)).toBeInTheDocument();
    expect(screen.getByText(/Dev Tenant/)).toBeInTheDocument();
  });

  test("shows empty activity message when no timeline entries", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("No activity yet.")).toBeInTheDocument();
    });
  });

  test("shows error when detail fetch fails", async () => {
    mockFetchDetail.mockResolvedValue(errorResult(null, "Work order not found"));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Work order not found")).toBeInTheDocument();
    });
  });

  test("tenant can add a comment", async () => {
    const user = userEvent.setup();
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockAddComment.mockResolvedValue({
      id: "c-new",
      work_order_id: "wo-1",
      user_id: "u-tenant-1",
      comment: "When will this be fixed?",
      author_name: "Dev Tenant",
      created_at: "2026-03-11T10:00:00Z",
    });
    // After comment, timeline refreshes
    mockFetchTimeline.mockResolvedValue({ data: [{
      id: "c-new", type: "comment", event_type: "COMMENT_ADDED",
      actor_user_id: "u-tenant-1", actor_name: "Dev Tenant",
      metadata: { comment: "When will this be fixed?" },
      created_at: "2026-03-11T10:00:00Z",
    }], source: "live", error: null });

    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet is leaking badly")).toBeInTheDocument();
    });

    const input = screen.getByLabelText("Add a comment");
    await user.type(input, "When will this be fixed?");
    await user.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(mockAddComment).toHaveBeenCalledWith("wo-1", "When will this be fixed?");
    });
  });

  test("does NOT render status-change buttons", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet is leaking badly")).toBeInTheDocument();
    });

    // PM detail shows status transition buttons — tenant detail must NOT show these
    expect(screen.queryByRole("button", { name: /In Review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Completed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Closed/i })).not.toBeInTheDocument();
  });

  test("does NOT render assignment controls", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet is leaking badly")).toBeInTheDocument();
    });

    expect(screen.queryByText(/assign/i)).not.toBeInTheDocument();
  });

  test("renders IN_PROGRESS status with human-readable label", async () => {
    const inProgressWO = { ...workOrder, status: "IN_PROGRESS" as const };
    mockFetchDetail.mockResolvedValue(successDetail(inProgressWO));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });
  });
});
