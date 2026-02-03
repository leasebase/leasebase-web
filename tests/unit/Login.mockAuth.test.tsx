import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";

jest.mock("@/lib/config", () => ({
  getAppConfig: () => ({
    apiBaseUrl: "http://localhost:4000",
    cognito: { userPoolId: undefined, clientId: undefined, domain: undefined },
    devMockAuth: true
  })
}));

describe("LoginPage", () => {
  test("shows dev-only mock login section when enabled", () => {
    render(<LoginPage />);
    expect(screen.getByText(/Dev-only mock login/)).toBeInTheDocument();
  });
});
