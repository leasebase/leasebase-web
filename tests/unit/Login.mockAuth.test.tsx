import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";

// Mock next/navigation for useRouter / useSearchParams
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/headers — headers() is called in the page component to force
// dynamic rendering, but it throws outside a real Next.js request context.
jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({ get: jest.fn() })),
}));

describe("LoginPage", () => {
  test("renders sign-in heading", () => {
    render(<LoginPage />);
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
  });

  test("renders email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByRole("textbox", { name: /Email/i })).toBeTruthy();
    expect(screen.getByText(/Email/)).toBeInTheDocument();
    expect(screen.getByText(/Password/)).toBeInTheDocument();
  });
});
