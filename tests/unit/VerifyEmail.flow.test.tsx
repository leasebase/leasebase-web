import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";
import VerifyEmailPage from "@/app/auth/verify-email/page";

// Minimal shim for getApiBaseUrl in tests
jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000/api",
}));

// Mock next/navigation hooks used in the pages
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      replace: jest.fn(),
      push: jest.fn(),
    }),
    useSearchParams: () => {
      const params = new URLSearchParams();
      return {
        get(key: string) {
          return params.get(key);
        },
      } as any;
    },
  };
});

describe("Email verification flow UI", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("login page shows helper link to verify email", () => {
    render(<LoginPage />);
    expect(
      screen.getByText(/Verify your email or resend the code/i)
    ).toBeInTheDocument();
  });

  test("verify email page renders form fields and resend button", () => {
    render(<VerifyEmailPage />);
    expect(screen.getByText(/Verify your email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Verification code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Verify email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend code/i })).toBeInTheDocument();
  });

  test("verify email page posts to confirm-email endpoint", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "ok" }),
    } as any);

    render(<VerifyEmailPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Verification code/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Verify email/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:4000/api/auth/confirm-email",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
