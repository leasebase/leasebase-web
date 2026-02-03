import { render, screen } from "@testing-library/react";
import { DataTable } from "@/components/ui/DataTable";

describe("DataTable", () => {
  test("renders empty state message when no rows", () => {
    render(
      <DataTable
        columns={[{ key: "name", header: "Name" }]}
        rows={[]}
        getRowId={(_, i) => String(i)}
        emptyMessage="Nothing here"
      />
    );
    expect(screen.getByText(/Nothing here/)).toBeInTheDocument();
  });
});
