import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "@/app/auth/register/page";

jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({ get: jest.fn() })),
}));

/** Advance past step 1 by selecting a user type. */
function selectUserType() {
  fireEvent.click(screen.getByText("Property Manager"));
}

/** Fill in the non-password fields so only password gates the form. */
function fillBasicFields() {
  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Smoke" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Test" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.co" } });
}

describe("Register page — password validation UX", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  test("renders password requirements checklist on step 2", () => {
    render(<RegisterPage />);
    selectUserType();
    expect(screen.getByRole("list", { name: /password requirements/i })).toBeInTheDocument();
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("One uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("One lowercase letter")).toBeInTheDocument();
    expect(screen.getByText("One number")).toBeInTheDocument();
    expect(screen.getByText("One special character")).toBeInTheDocument();
  });

  test("submit button is disabled when password requirements are not met", () => {
    render(<RegisterPage />);
    selectUserType();
    fillBasicFields();

    const btn = screen.getByRole("button", { name: /create account/i });
    expect(btn).toBeDisabled();

    // Type a weak password + matching confirm
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "weak" } });
    expect(btn).toBeDisabled();
  });

  test("submit button becomes enabled with a valid password + matching confirm", () => {
    render(<RegisterPage />);
    selectUserType();
    fillBasicFields();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "GoodP@ss1" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "GoodP@ss1" } });

    const btn = screen.getByRole("button", { name: /create account/i });
    expect(btn).not.toBeDisabled();
  });

  test("does not call API when passwords do not match", () => {
    render(<RegisterPage />);
    selectUserType();
    fillBasicFields();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "GoodP@ss1" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Different1!" } });

    // Button should be disabled because passwords don't match
    const btn = screen.getByRole("button", { name: /create account/i });
    expect(btn).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("shows inline mismatch error when confirm password differs", () => {
    render(<RegisterPage />);
    selectUserType();
    fillBasicFields();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "GoodP@ss1" } });
    // Type something different in confirm
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Nope" } });

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  test("maps backend password-complexity error to inline field message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Password does not meet requirements",
          },
        }),
    });

    render(<RegisterPage />);
    selectUserType();
    fillBasicFields();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "GoodP@ss1" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "GoodP@ss1" } });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      // The inline password error should appear
      expect(screen.getByText("Password does not meet the requirements.")).toBeInTheDocument();
    });

    // The generic top-level error should NOT appear
    expect(screen.queryByText("Registration failed")).not.toBeInTheDocument();
  });

  test("shows generic error for non-password backend errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({
          message: "An account with this email already exists",
        }),
    });

    render(<RegisterPage />);
    selectUserType();
    fillBasicFields();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "GoodP@ss1" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "GoodP@ss1" } });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText("An account with this email already exists")
      ).toBeInTheDocument();
    });
  });
});
