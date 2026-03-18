import {
  fetchLeases,
  fetchLease,
  createLease,
  updateLease,
  terminateLease,
  renewLease,
} from "@/services/leases/leaseService";

/* ── Mock apiRequest ── */

const mockApiRequest = jest.fn();

jest.mock("@/lib/api/client", () => ({
  apiRequest: (opts: any) => mockApiRequest(opts),
}));

/* ── Tests ── */

beforeEach(() => mockApiRequest.mockReset());

describe("leaseService", () => {
  describe("fetchLeases", () => {
    test("calls correct path with default pagination", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } });
      await fetchLeases();
      expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/leases?page=1&limit=50" });
    });

    test("passes custom pagination", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: [], meta: { page: 2, limit: 10, total: 0, totalPages: 0 } });
      await fetchLeases(2, 10);
      expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/leases?page=2&limit=10" });
    });

    test("passes filters", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } });
      await fetchLeases(1, 50, { status: "ACTIVE", propertyId: "p1" });
      const path = mockApiRequest.mock.calls[0][0].path;
      expect(path).toContain("status=ACTIVE");
      expect(path).toContain("propertyId=p1");
    });
  });

  describe("fetchLease", () => {
    test("calls correct path", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: { id: "l1" } });
      const result = await fetchLease("l1");
      expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/leases/l1" });
      expect(result.data.id).toBe("l1");
    });
  });

  describe("createLease", () => {
    test("sends POST with JSON body", async () => {
      const dto = {
        propertyId: "p1",
        unitId: "u1",
        termType: "TWELVE_MONTH",
        startDate: "2026-01-01",
      };
      mockApiRequest.mockResolvedValueOnce({ data: { id: "new-1" } });
      await createLease(dto);
      expect(mockApiRequest).toHaveBeenCalledWith({
        path: "api/leases",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
    });
  });

  describe("updateLease", () => {
    test("sends PUT with JSON body", async () => {
      const dto = { termType: "CUSTOM", endDate: "2027-06-30" };
      mockApiRequest.mockResolvedValueOnce({ data: { id: "l1" } });
      await updateLease("l1", dto);
      expect(mockApiRequest).toHaveBeenCalledWith({
        path: "api/leases/l1",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
    });
  });

  describe("terminateLease", () => {
    test("sends POST to /:id/terminate", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: { id: "l1", status: "TERMINATED" } });
      await terminateLease("l1", "Moving out");
      expect(mockApiRequest).toHaveBeenCalledWith({
        path: "api/leases/l1/terminate",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Moving out" }),
      });
    });
  });

  describe("renewLease", () => {
    test("sends POST to /:id/renew", async () => {
      const dto = { termType: "TWELVE_MONTH", startDate: "2027-01-01" };
      mockApiRequest.mockResolvedValueOnce({ data: { id: "new-lease" } });
      await renewLease("l1", dto);
      expect(mockApiRequest).toHaveBeenCalledWith({
        path: "api/leases/l1/renew",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
    });
  });
});
