import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "@/components/ui/Pagination";

describe("Pagination", () => {
  test("renders nothing for 1 page", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders page buttons", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  test("marks current page with aria-current", () => {
    render(<Pagination page={3} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByText("3")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("2")).not.toHaveAttribute("aria-current");
  });

  test("calls onPageChange when page clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByText("3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test("previous button disabled on first page", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  test("next button disabled on last page", () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  test("next button calls onPageChange with page+1", async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
