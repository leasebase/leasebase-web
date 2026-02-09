import { attachDevMockHeader } from "@/lib/api/http";

jest.mock("@/lib/config", () => ({
  getAppConfig: () => ({
    apiBaseUrl: "http://localhost:4000",
    cognito: { userPoolId: undefined, clientId: undefined, domain: undefined },
    devMockAuth: true
  })
}));

describe("attachDevMockHeader", () => {
  test("adds x-lb-dev-mock when devMockAuth is true", () => {
    const req: any = { headers: {} };
    const result = attachDevMockHeader(req);
    expect(result.headers["x-lb-dev-mock"]).toBe("true");
  });
});
