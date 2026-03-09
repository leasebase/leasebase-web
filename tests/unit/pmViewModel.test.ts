import {
  buildPMKpiGrid,
  buildPMTasksList,
  buildPMMaintenanceWidget,
  buildPMPropertySummaries,
  toPMDashboardViewModel,
} from "@/services/pm/viewModel";
import { getStubPMDashboardData } from "@/services/pm/stubs/pmDashboardStubs";
import type { PMDashboardData, Sourced } from "@/services/pm/types";

function sourced<T>(value: T, source: "live" | "stub" | "unavailable" = "live"): Sourced<T> {
  return { value, source };
}

/* ── buildPMKpiGrid ── */

describe("buildPMKpiGrid", () => {
  test("produces 4 KPI items from stub data", () => {
    const data = getStubPMDashboardData();
    const grid = buildPMKpiGrid(data);

    expect(grid.items).toHaveLength(4);
    expect(grid.items.map((i) => i.key)).toEqual([
      "properties",
      "units",
      "occupancy",
      "revenue",
    ]);
  });

  test("KPI values reflect data", () => {
    const data = getStubPMDashboardData();
    const grid = buildPMKpiGrid(data);

    const propsItem = grid.items.find((i) => i.key === "properties")!;
    expect(propsItem.value).toBe("12");
    expect(propsItem.source).toBe("stub");
  });

  test("occupancy shows — when no units", () => {
    const data = getStubPMDashboardData();
    data.kpis.totalUnits = sourced(0, "live");
    data.kpis.vacancyRate = sourced(0, "live");

    const grid = buildPMKpiGrid(data);
    const occ = grid.items.find((i) => i.key === "occupancy")!;
    expect(occ.value).toBe("—");
  });

  test("revenue shows 'On track' when collected >= scheduled", () => {
    const data = getStubPMDashboardData();
    data.kpis.collectedThisMonth = sourced(500000, "live");
    data.kpis.monthlyScheduledRent = sourced(500000, "live");

    const grid = buildPMKpiGrid(data);
    const rev = grid.items.find((i) => i.key === "revenue")!;
    expect(rev.change).toBe("On track");
  });
});

/* ── buildPMTasksList ── */

describe("buildPMTasksList", () => {
  test("produces task view models from stub data", () => {
    const data = getStubPMDashboardData();
    const vm = buildPMTasksList(data);

    expect(vm.hasTasks).toBe(true);
    expect(vm.tasks).toHaveLength(3);
    expect(vm.tasks[0].title).toContain("lease renewal");
  });

  test("hasTasks is false when no tasks", () => {
    const data = getStubPMDashboardData();
    data.tasks = [];

    const vm = buildPMTasksList(data);
    expect(vm.hasTasks).toBe(false);
    expect(vm.tasks).toHaveLength(0);
  });

  test("danger task shows Overdue badge", () => {
    const data = getStubPMDashboardData();
    const dangerTask = data.tasks.find((t) => t.severity === "danger");
    expect(dangerTask).toBeDefined();

    const vm = buildPMTasksList(data);
    const dangerVm = vm.tasks.find((t) => t.severity === "danger");
    expect(dangerVm?.badgeText).toBe("Overdue");
  });
});

/* ── buildPMMaintenanceWidget ── */

describe("buildPMMaintenanceWidget", () => {
  test("counts open work orders", () => {
    const data = getStubPMDashboardData();
    const vm = buildPMMaintenanceWidget(data);

    // Stub has 1 IN_PROGRESS + 1 OPEN = 2 open
    expect(vm.openCount).toBe(2);
    expect(vm.hasRequests).toBe(true);
  });

  test("limits to 5 recent requests sorted by date", () => {
    const data = getStubPMDashboardData();
    const vm = buildPMMaintenanceWidget(data);

    expect(vm.recentRequests.length).toBeLessThanOrEqual(5);
    // Most recent first
    if (vm.recentRequests.length >= 2) {
      expect(vm.recentRequests[0].title).toContain("HVAC"); // 2026-03-07
    }
  });

  test("hasRequests false when empty", () => {
    const data = getStubPMDashboardData();
    data.maintenanceRequests = [];

    const vm = buildPMMaintenanceWidget(data);
    expect(vm.hasRequests).toBe(false);
    expect(vm.openCount).toBe(0);
  });
});

/* ── buildPMPropertySummaries ── */

describe("buildPMPropertySummaries", () => {
  test("computes per-property occupancy", () => {
    const data = getStubPMDashboardData();
    const summaries = buildPMPropertySummaries(data);

    expect(summaries.length).toBe(2);
    const riverside = summaries.find((s) => s.name === "Riverside Apartments")!;
    expect(riverside.totalUnits).toBe(3);
    // 3 units, 3 active leases on units 1,2,3
    expect(riverside.occupiedUnits).toBe(3);
    expect(riverside.occupancyRate).toBe(100);
  });

  test("property with no units has 0% occupancy", () => {
    const data = getStubPMDashboardData();
    // Remove all units for prop-2
    data.units = data.units.filter((u) => u.property_id !== "stub-prop-2");
    data.leases = data.leases.filter((l) => l.unit_id !== "stub-unit-4");

    const summaries = buildPMPropertySummaries(data);
    const oak = summaries.find((s) => s.name === "Oak Park Residences")!;
    expect(oak.totalUnits).toBe(0);
    expect(oak.occupancyRate).toBe(0);
  });
});

/* ── toPMDashboardViewModel ── */

describe("toPMDashboardViewModel", () => {
  test("produces complete view model", () => {
    const data = getStubPMDashboardData();
    const vm = toPMDashboardViewModel(data);

    expect(vm.kpis.items).toHaveLength(4);
    expect(vm.tasks.hasTasks).toBe(true);
    expect(vm.maintenance.hasRequests).toBe(true);
    expect(vm.properties.length).toBe(2);
    expect(vm.setupStage).toBe("active");
  });
});
