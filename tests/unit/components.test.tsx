import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { Textarea } from "@/components/ui/Textarea";
import { RadioGroup } from "@/components/ui/Radio";

// ── EmptyState ──
describe("EmptyState", () => {
  test("renders title and description", () => {
    render(<EmptyState title="No items" description="Add one." />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Add one.")).toBeInTheDocument();
  });

  test("renders action when provided", () => {
    render(
      <EmptyState title="Empty" action={<button>Add</button>} />,
    );
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  test("has status role", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

// ── Skeleton ──
describe("Skeleton", () => {
  test("renders with loading status", () => {
    render(<Skeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("has sr-only loading text", () => {
    render(<Skeleton />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  test("applies variant classes", () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.firstChild).toHaveClass("rounded-full");
  });
});

// ── Avatar ──
describe("Avatar", () => {
  test("renders initials from name", () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  test("renders ? when no name given", () => {
    render(<Avatar />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  test("renders img when src provided", () => {
    render(<Avatar src="/photo.jpg" name="Jane" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/photo.jpg");
  });

  test("applies size classes", () => {
    const { container } = render(<Avatar name="A B" size="xl" />);
    expect(container.firstChild).toHaveClass("h-14");
  });
});

// ── Textarea ──
describe("Textarea", () => {
  test("renders with label", () => {
    render(<Textarea label="Notes" />);
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  test("shows error message", () => {
    render(<Textarea label="Notes" error="Required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  test("marks as aria-invalid on error", () => {
    render(<Textarea label="Notes" error="Bad" />);
    expect(screen.getByLabelText("Notes")).toHaveAttribute("aria-invalid", "true");
  });
});

// ── RadioGroup ──
describe("RadioGroup", () => {
  const options = [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B" },
    { value: "c", label: "Option C", disabled: true },
  ];

  test("renders all options", () => {
    render(<RadioGroup name="test" options={options} />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });

  test("calls onChange when option selected", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<RadioGroup name="test" options={options} value="a" onChange={onChange} />);
    await user.click(screen.getByText("Option B"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  test("renders legend when label provided", () => {
    render(<RadioGroup name="test" label="Pick one" options={options} />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  test("shows error message", () => {
    render(<RadioGroup name="test" options={options} error="Select one" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Select one");
  });
});
