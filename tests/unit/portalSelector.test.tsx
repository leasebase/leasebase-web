import PortalSelectorPage from "@/app/portal/page";

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    // redirect() in Next.js throws NEXT_REDIRECT internally
    throw new Error("NEXT_REDIRECT");
  },
}));

describe("Portal selector page", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  test("redirects to /auth/login", () => {
    expect(() => PortalSelectorPage()).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/auth/login");
  });
});
