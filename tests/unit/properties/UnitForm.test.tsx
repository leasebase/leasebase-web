import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnitForm } from "@/components/properties/UnitForm";
import type { UnitRow } from "@/services/properties/types";

/* ── Fixtures ── */

const now = new Date().toISOString();

const existingUnit: UnitRow = {
  id: "u1",
  organization_id: "org-1",
  property_id: "p1",
  unit_number: "101",
  bedrooms: 2,
  bathrooms: 1.5,
  square_feet: 850,
  status: "OCCUPIED",
  created_at: now,
  updated_at: now,
};

/* ── Tests ── */

describe("UnitForm", () => {
  const mockSubmit = jest.fn<Promise<void>, [any]>();
  const mockCancel = jest.fn();

  beforeEach(() => {
    mockSubmit.mockReset();
    mockCancel.mockReset();
    mockSubmit.mockResolvedValue(undefined);
  });

  test("renders create mode with defaults", () => {
    render(<UnitForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.getByLabelText("Unit Number / Name")).toHaveValue("");
    expect(screen.getByText("Add Unit")).toBeInTheDocument();
  });

  test("renders edit mode with initial values", () => {
    render(<UnitForm initial={existingUnit} onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.getByLabelText("Unit Number / Name")).toHaveValue("101");
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });

  test("does not render rent field (rent lives on the lease)", () => {
    render(<UnitForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.queryByLabelText("Monthly Rent ($)")).not.toBeInTheDocument();
  });

  test("validates required unit number", async () => {
    render(<UnitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    // Use fireEvent.submit to bypass native HTML constraint validation (jsdom enforces `required`)
    const form = screen.getByText("Add Unit").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Unit number is required")).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  test("submits valid form data", async () => {
    const user = userEvent.setup();
    render(<UnitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.type(screen.getByLabelText("Unit Number / Name"), "301");
    await user.clear(screen.getByLabelText("Bedrooms"));
    await user.type(screen.getByLabelText("Bedrooms"), "3");
    await user.clear(screen.getByLabelText("Bathrooms"));
    await user.type(screen.getByLabelText("Bathrooms"), "2");

    await user.click(screen.getByText("Add Unit"));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          unitNumber: "301",
          bedrooms: 3,
          bathrooms: 2,
        }),
      );
      // Rent is no longer on units
      expect(mockSubmit.mock.calls[0][0]).not.toHaveProperty("rentAmount");
    });
  });

  test("shows server error on submit failure", async () => {
    mockSubmit.mockRejectedValueOnce(new Error("Server error"));
    const user = userEvent.setup();
    render(<UnitForm initial={existingUnit} onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Server error");
    });
  });

  test("cancel calls onCancel", async () => {
    const user = userEvent.setup();
    render(<UnitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.click(screen.getByText("Cancel"));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  test("status defaults to AVAILABLE for new units", async () => {
    const user = userEvent.setup();
    render(<UnitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    await user.type(screen.getByLabelText("Unit Number / Name"), "A1");

    await user.click(screen.getByText("Add Unit"));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: "AVAILABLE" }),
      );
    });
  });
});
