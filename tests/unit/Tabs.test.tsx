import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "@/components/ui/Tabs";

const items = [
  { id: "a", label: "Tab A", content: <div>Content A</div> },
  { id: "b", label: "Tab B", content: <div>Content B</div> },
  { id: "c", label: "Tab C", content: <div>Content C</div>, disabled: true },
];

describe("Tabs", () => {
  test("renders all tab buttons", () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole("tab", { name: "Tab A" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab B" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab C" })).toBeInTheDocument();
  });

  test("shows first tab content by default", () => {
    render(<Tabs items={items} />);
    expect(screen.getByText("Content A")).toBeInTheDocument();
  });

  test("switches tab on click", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    await user.click(screen.getByRole("tab", { name: "Tab B" }));
    expect(screen.getByText("Content B")).toBeInTheDocument();
  });

  test("disabled tab cannot be clicked", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    await user.click(screen.getByRole("tab", { name: "Tab C" }));
    // Should still show first tab content
    expect(screen.getByText("Content A")).toBeInTheDocument();
  });

  test("has correct aria-selected attributes", () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute("aria-selected", "false");
  });

  test("calls onTabChange when tab changes", async () => {
    const user = userEvent.setup();
    const onTabChange = jest.fn();
    render(<Tabs items={items} onTabChange={onTabChange} />);
    await user.click(screen.getByRole("tab", { name: "Tab B" }));
    expect(onTabChange).toHaveBeenCalledWith("b");
  });

  test("renders tabpanel with correct aria-labelledby", () => {
    render(<Tabs items={items} />);
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", "tab-a");
  });
});
