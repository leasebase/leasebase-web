import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  test("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  test("renders without label", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  test("shows error message", () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  test("shows helper text when no error", () => {
    render(<Input label="Email" helperText="Enter your email" />);
    expect(screen.getByText("Enter your email")).toBeInTheDocument();
  });

  test("does not show helper text when error present", () => {
    render(<Input label="Email" error="Bad" helperText="Enter your email" />);
    expect(screen.queryByText("Enter your email")).not.toBeInTheDocument();
  });
});
