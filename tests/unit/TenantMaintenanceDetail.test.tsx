import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TenantMaintenanceDetail } from "@/app/(dashboard)/app/maintenance/[id]/_detail-views";
import type { WorkOrderRow, WorkOrderCommentRow, DomainResult } from "@/services/tenant/types";

/* ── Mocks ── */

const mockFetchDetail = jest.fn<Promise<DomainResult<WorkOrderRow | null>>, [string]>();
const mockFetchComments = jest.fn<Promise<DomainResult<WorkOrderCommentRow[]>>, [string]>();
const mockAddComment = jest.fn<Promise<WorkOrderCommentRow>, [string, string]>();

jest.mock("@/services/tenant/adapters/maintenanceAdapter", () => ({
  fetchMaintenanceDetail: (...args: any[]) => mockFetchDetail(args[0]),
  fetchMaintenanceComments: (...args: any[]) => mockFetchComments(args[0]),
  addMaintenanceComment: (...args: any[]) => mockAddComment(args[0], args[1]),
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
  created_by_user_id: "u-tenant-1",
  category: "Plumbing",
  priority: "HIGH",
  status: "OPEN",
  description: "Kitchen faucet is leaking badly",
  assignee_id: null,
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
  mockAddComment.mockReset();
});

describe("TenantMaintenanceDetail", () => {
  test("shows loading skeleton initially", () => {
    mockFetchDetail.mockReturnValue(new Promise(() => {}));
    mockFetchComments.mockReturnValue(new Promise(() => {}));
    render(<TenantMaintenanceDetail />);
    expect(screen.getByLabelText("Loading work order")).toBeInTheDocument();
  });

  test("renders work order detail with description, status, priority, category, and date", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockFetchComments.mockResolvedValue(successComments(comments));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet is leaking badly")).toBeInTheDocument();
    });

    // Status badge
    expect(screen.getByText("OPEN")).toBeInTheDocument();
    // Priority badge
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    // Category
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    // Created date
    expect(screen.getByText(/Submitted/)).toBeInTheDocument();
  });

  test("renders comments thread", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockFetchComments.mockResolvedValue(successComments(comments));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Plumber scheduled for tomorrow.")).toBeInTheDocument();
    });
    expect(screen.getByText("Thanks, I will be home.")).toBeInTheDocument();
    expect(screen.getByText(/Dev Manager/)).toBeInTheDocument();
    expect(screen.getByText(/Dev Tenant/)).toBeInTheDocument();
  });

  test("shows empty comments message when none exist", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockFetchComments.mockResolvedValue(successComments([]));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("No comments yet.")).toBeInTheDocument();
    });
  });

  test("shows error when detail fetch fails", async () => {
    mockFetchDetail.mockResolvedValue(errorResult(null, "Work order not found"));
    mockFetchComments.mockResolvedValue(successComments([]));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Work order not found")).toBeInTheDocument();
    });
  });

  test("tenant can add a comment", async () => {
    const user = userEvent.setup();
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockFetchComments.mockResolvedValue(successComments([]));
    mockAddComment.mockResolvedValue({
      id: "c-new",
      work_order_id: "wo-1",
      user_id: "u-tenant-1",
      comment: "When will this be fixed?",
      author_name: "Dev Tenant",
      created_at: "2026-03-11T10:00:00Z",
    });

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
    expect(screen.getByText("When will this be fixed?")).toBeInTheDocument();
  });

  test("does NOT render status-change buttons", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockFetchComments.mockResolvedValue(successComments([]));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet is leaking badly")).toBeInTheDocument();
    });

    // PM detail shows status transition buttons like "IN PROGRESS", "RESOLVED", "CLOSED"
    // Tenant detail must NOT show these
    expect(screen.queryByRole("button", { name: /IN PROGRESS/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /RESOLVED/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /CLOSED/i })).not.toBeInTheDocument();
  });

  test("does NOT render assignment controls", async () => {
    mockFetchDetail.mockResolvedValue(successDetail(workOrder));
    mockFetchComments.mockResolvedValue(successComments([]));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("Kitchen faucet is leaking badly")).toBeInTheDocument();
    });

    expect(screen.queryByText(/assign/i)).not.toBeInTheDocument();
  });

  test("renders IN_PROGRESS status with space-replaced label", async () => {
    const inProgressWO = { ...workOrder, status: "IN_PROGRESS" as const };
    mockFetchDetail.mockResolvedValue(successDetail(inProgressWO));
    mockFetchComments.mockResolvedValue(successComments([]));
    render(<TenantMaintenanceDetail />);

    await waitFor(() => {
      expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    });
  });
});
