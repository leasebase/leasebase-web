import {
  fetchProperties,
  fetchProperty,
  createProperty,
  updateProperty,
  fetchUnitsForProperty,
  fetchUnit,
  createUnit,
  updateUnit,
  fetchPropertiesWithUnitCounts,
} from "@/services/properties/propertyService";

/* ── Mock apiRequest ── */

const mockApiRequest = jest.fn();

jest.mock("@/lib/api/client", () => ({
  apiRequest: (opts: any) => mockApiRequest(opts),
}));

/* ── Tests ── */

beforeEach(() => mockApiRequest.mockReset());

describe("propertyService", () => {
  describe("fetchProperties", () => {
    test("calls correct path with default pagination", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } });
      await fetchProperties();
      expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/properties?page=1&limit=50" });
    });

    test("passes custom pagination", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: [], meta: { page: 2, limit: 10, total: 0, totalPages: 0 } });
      await fetchProperties(2, 10);
      expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/properties?page=2&limit=10" });
    });
  });

  describe("fetchProperty", () => {
    test("calls correct path", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: { id: "p1" } });
      const result = await fetchProperty("p1");
      expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/properties/p1" });
      expect(result.data.id).toBe("p1");
    });
  });

  describe("createProperty", () => {
    test("sends POST with JSON body", async () => {
      const dto = { name: "Test", addressLine1: "123", city: "LA", state: "CA", postalCode: "90001" };
      mockApiRequest.mockResolvedValueOnce({ data: { id: "new-1" } });
      await createProperty(dto);
      expect(mockApiRequest).toHaveBeenCalledWith({
        path: "api/properties",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
    });
  });

  describe("updateProperty", () => {
    test("sends PUT with JSON body", async () => {
      const dto = { name: "Updated" };
      mockApiRequest.mockResolvedValueOnce({ data: { id: "p1", name: "Updated" } });
      await updateProperty("p1", dto);
      expect(mockApiRequest).toHaveBeenCalledWith({
        path: "api/properties/p1",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
    });
  });

  describe("fetchUnitsForProperty", () => {
    test("calls correct path", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } });
      await fetchUnitsForProperty("p1");
      expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/properties/p1/units?page=1&limit=100" });
    });
  });

  describe("fetchUnit", () => {
    test("calls correct path", async () => {
      mockApiRequest.mockResolvedValueOnce({ data: { id: "u1" } });
      await fetchUnit("u1");
      expect(mockApiRequest).toHaveBeenCalledWith({ path: "api/properties/units/u1" });
    });
  });

  describe("createUnit", () => {
    test("sends POST with JSON body", async () => {
      const dto = { unitNumber: "101", bedrooms: 2, bathrooms: 1, rentAmount: 150000 };
      mockApiRequest.mockResolvedValueOnce({ data: { id: "new-u1" } });
      await createUnit("p1", dto);
      expect(mockApiRequest).toHaveBeenCalledWith({
        path: "api/properties/p1/units",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
    });
  });

  describe("updateUnit", () => {
    test("sends PUT with JSON body", async () => {
      const dto = { unitNumber: "101A" };
      mockApiRequest.mockResolvedValueOnce({ data: { id: "u1" } });
      await updateUnit("u1", dto);
      expect(mockApiRequest).toHaveBeenCalledWith({
        path: "api/properties/units/u1",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
    });
  });

  describe("fetchPropertiesWithUnitCounts", () => {
    test("fetches properties then fans out for unit counts", async () => {
      // First call: fetchProperties
      mockApiRequest.mockResolvedValueOnce({
        data: [{ id: "p1" }, { id: "p2" }],
        meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
      });
      // Fan-out: fetchUnitsForProperty for p1
      mockApiRequest.mockResolvedValueOnce({
        data: [{ status: "OCCUPIED" }, { status: "AVAILABLE" }],
        meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
      });
      // Fan-out: fetchUnitsForProperty for p2
      mockApiRequest.mockResolvedValueOnce({
        data: [{ status: "OCCUPIED" }],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      });

      const result = await fetchPropertiesWithUnitCounts();

      expect(result.data).toHaveLength(2);
      expect(result.unitCounts.p1).toEqual({ total: 2, occupied: 1 });
      expect(result.unitCounts.p2).toEqual({ total: 1, occupied: 1 });
    });

    test("handles failed unit count fetch gracefully", async () => {
      mockApiRequest.mockResolvedValueOnce({
        data: [{ id: "p1" }],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });
      // Fan-out fails
      mockApiRequest.mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchPropertiesWithUnitCounts();
      expect(result.unitCounts.p1).toEqual({ total: 0, occupied: 0 });
    });
  });
});
